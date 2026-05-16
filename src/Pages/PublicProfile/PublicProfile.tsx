import React, { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, FileText, RefreshCw, Search, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "react-toastify";
import PageTitle from "../../Component/PageTitle";
import usersApi from "../../api/usersApi";
import Cookies from "js-cookie";
import { normalizeUser } from "../../Helpers/userMapper";

interface PublicProfileData {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  public_document_count: number;
  public_collection_count: number;
  follower_count: number;
  following_count: number;
  is_following: boolean | null;
}

interface FollowUser {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface FollowListItem {
  created_at: string;
  user: FollowUser;
  is_following: boolean | null;
}

type FollowTab = "followers" | "following";

interface FollowStatus {
  user_id: string;
  viewer_id: string | null;
  is_authenticated: boolean;
  is_self: boolean;
  is_following: boolean;
}

const PAGE_SIZE = 8;

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const statCards = [
  { key: "public_document_count", label: "Tài liệu công khai", icon: FileText },
  { key: "public_collection_count", label: "Bộ sưu tập công khai", icon: BookOpen },
  { key: "follower_count", label: "Người theo dõi", icon: Users, tab: "followers" },
  { key: "following_count", label: "Đang theo dõi", icon: Users, tab: "following" },
] as const;

const PublicProfile: React.FC = () => {
  const { userID } = useParams<{ userID: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [activeTab, setActiveTab] = useState<FollowTab>("followers");
  const [followRows, setFollowRows] = useState<FollowListItem[]>([]);
  const [followPagination, setFollowPagination] = useState({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });
  const [followPage, setFollowPage] = useState(1);
  const [followSearch, setFollowSearch] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  const [listReloadKey, setListReloadKey] = useState(0);

  useEffect(() => {
    const userStr = Cookies.get("user");
    if (!userStr) {
      setCurrentUserId("");
      return;
    }

    try {
      setCurrentUserId(normalizeUser(JSON.parse(userStr)).userId);
    } catch {
      setCurrentUserId("");
    }
  }, []);

  useEffect(() => {
    if (!userID) {
      setLoading(false);
      return;
    }

    setLoading(true);
    usersApi
      .getPublicProfile(userID)
      .then((response) => setProfile(response.data?.data ?? response.data))
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Không tải được hồ sơ công khai.");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [profileReloadKey, userID]);

  useEffect(() => {
    if (!userID) {
      setFollowStatus(null);
      return;
    }

    usersApi
      .getFollowStatus(userID)
      .then((response) => setFollowStatus(response.data?.data ?? response.data))
      .catch(() => setFollowStatus(null));
  }, [profileReloadKey, userID]);

  useEffect(() => {
    if (!userID) return;

    const timeout = window.setTimeout(() => {
    setFollowLoading(true);
    const request =
      activeTab === "followers"
          ? usersApi.getPublicFollowers(userID, { pageNumber: followPage, pageSize: PAGE_SIZE, search: followSearch })
          : usersApi.getPublicFollowing(userID, { pageNumber: followPage, pageSize: PAGE_SIZE, search: followSearch });

    request
      .then((response) => {
        const body = response.data?.data ?? response.data ?? {};
        const rows = activeTab === "followers" ? body.followers : body.following;
        setFollowRows(rows ?? []);
        setFollowPagination(
          body.pagination ?? {
            currentPage: followPage,
            pageSize: PAGE_SIZE,
            totalCount: rows?.length ?? 0,
            totalPages: 1,
          }
        );
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Không tải được danh sách follow.");
        setFollowRows([]);
      })
      .finally(() => setFollowLoading(false));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeTab, followPage, followSearch, listReloadKey, userID]);

  const changeTab = (tab: FollowTab) => {
    setActiveTab(tab);
    setFollowPage(1);
  };

  const refreshFollowData = () => {
    setProfileReloadKey((value) => value + 1);
    setListReloadKey((value) => value + 1);
  };

  const handleFollowUser = async (targetUserId: string) => {
    if (!Cookies.get("token")) {
      window.location.href = "/login";
      return;
    }

    setActionLoadingId(targetUserId);
    try {
      const response = await usersApi.followUser(targetUserId);
      toast.success(response.data?.message || "Đã theo dõi người dùng.");
      refreshFollowData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Theo dõi thất bại.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleUnfollowUser = async (targetUserId: string) => {
    setActionLoadingId(targetUserId);
    try {
      const response = await usersApi.unfollowUser(targetUserId);
      toast.success(response.data?.message || "Đã bỏ theo dõi.");
      refreshFollowData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Bỏ theo dõi thất bại.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!window.confirm("Xóa người này khỏi danh sách theo dõi bạn?")) return;

    setActionLoadingId(`remove-${followerId}`);
    try {
      const response = await usersApi.removeFollower(followerId);
      toast.success(response.data?.message || "Đã xóa người theo dõi.");
      refreshFollowData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Xóa người theo dõi thất bại.");
    } finally {
      setActionLoadingId("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">Không tìm thấy người dùng</h1>
        <p className="mt-2 text-ink-secondary">Hồ sơ công khai này không tồn tại hoặc hiện không thể truy cập.</p>
        <NavLink to="/" className="btn-primary mt-6">
          Về trang chủ
        </NavLink>
      </div>
    );
  }

  const displayName = profile.full_name || profile.username || "Người dùng DocShare";
  const isOwnProfile = followStatus?.is_self || (!!currentUserId && currentUserId === profile.user_id);
  const isFollowingProfile = followStatus?.is_following ?? profile.is_following ?? false;

  return (
    <>
      <PageTitle title={displayName} description={`Hồ sơ công khai của ${displayName}`} />
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="surface-card overflow-hidden">
          <div className="bg-gradient-to-r from-primary-soft via-white to-emerald-50 px-5 py-8 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={profile.avatar_url || "/default-avatar.png"}
                  alt={displayName}
                  className="h-28 w-28 rounded-full border-4 border-white bg-white object-cover shadow-card"
                  onError={(event) => {
                    event.currentTarget.src = "/default-avatar.png";
                  }}
                />
                <div>
                  <h1 className="text-3xl font-bold text-ink">{displayName}</h1>
                  <p className="mt-1 text-sm font-medium text-ink-secondary">@{profile.username || profile.user_id}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-white/80 px-3 py-1.5 text-sm text-ink-secondary ring-1 ring-line">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Tham gia {formatDate(profile.created_at)}
                  </div>
                </div>
              </div>

              {!isOwnProfile && (
                isFollowingProfile ? (
                  <button
                    type="button"
                    onClick={() => handleUnfollowUser(profile.user_id)}
                    disabled={actionLoadingId === profile.user_id}
                    className="btn-secondary bg-white"
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    {actionLoadingId === profile.user_id ? "Đang xử lý..." : "Bỏ theo dõi"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFollowUser(profile.user_id)}
                    disabled={actionLoadingId === profile.user_id}
                    className="btn-primary"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {actionLoadingId === profile.user_id ? "Đang xử lý..." : "Theo dõi"}
                  </button>
                )
              )}
            </div>
            {!isOwnProfile && followStatus?.is_authenticated && (
              <div className="mt-5 rounded-md border border-line bg-white/80 p-3 text-sm text-ink-secondary">
                {isFollowingProfile ? "Bạn đang theo dõi hồ sơ này." : "Bạn hiện chưa theo dõi hồ sơ này."}
              </div>
            )}
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map(({ key, label, icon: Icon, tab }) => (
              <button
                key={key}
                type="button"
                onClick={() => tab && changeTab(tab as FollowTab)}
                className={`rounded-md border border-line bg-canvas p-4 text-left transition hover:-translate-y-px hover:border-primary ${
                  tab && activeTab === tab ? "border-primary bg-primary-soft" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-secondary">{label}</p>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 text-3xl font-bold text-ink">
                  {(profile[key] ?? 0).toLocaleString("vi-VN")}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-line p-3">
            <div className="flex rounded-md bg-canvas p-1">
              <button
                type="button"
                onClick={() => changeTab("followers")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                  activeTab === "followers" ? "bg-primary text-white" : "text-ink-secondary hover:bg-white hover:text-ink"
                }`}
              >
                Người theo dõi
              </button>
              <button
                type="button"
                onClick={() => changeTab("following")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                  activeTab === "following" ? "bg-primary text-white" : "text-ink-secondary hover:bg-white hover:text-ink"
                }`}
              >
                Đang theo dõi
              </button>
            </div>
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
              <input
                value={followSearch}
                onChange={(event) => {
                  setFollowSearch(event.target.value);
                  setFollowPage(1);
                }}
                className="input-field pl-9"
                placeholder={activeTab === "followers" ? "Tìm người theo dõi..." : "Tìm người đang theo dõi..."}
              />
            </label>
          </div>

          {followLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <RefreshCw className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : followRows.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-ink-secondary">
              {activeTab === "followers" ? "Chưa có người theo dõi." : "Chưa theo dõi người dùng nào."}
            </div>
          ) : (
            <div className="divide-y divide-line">
              {followRows.map((item) => {
                const user = item.user;
                const name = user.full_name || user.username || "Người dùng DocShare";
                const canRemoveFollower = isOwnProfile && activeTab === "followers" && user.user_id !== currentUserId;
                const canToggleFollow = !!currentUserId && user.user_id !== currentUserId && item.is_following !== null;

                return (
                  <div
                    key={`${activeTab}-${user.user_id}`}
                    className="flex items-center gap-3 p-4 transition hover:bg-gray-50"
                  >
                    <NavLink to={`/public-profile/${user.user_id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <img
                        src={user.avatar_url || "/default-avatar.png"}
                        alt={name}
                        className="h-12 w-12 rounded-full border border-line object-cover"
                        onError={(event) => {
                          event.currentTarget.src = "/default-avatar.png";
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{name}</p>
                        <p className="truncate text-sm text-ink-secondary">@{user.username || user.user_id}</p>
                      </div>
                    </NavLink>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-neutral">Từ {formatDate(item.created_at)}</p>
                      {item.is_following !== null && (
                        <p className="mt-1 text-xs font-medium text-primary">
                          {item.is_following ? "Bạn đang theo dõi" : "Chưa theo dõi"}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {canToggleFollow && (
                        item.is_following ? (
                          <button
                            type="button"
                            onClick={() => handleUnfollowUser(user.user_id)}
                            disabled={actionLoadingId === user.user_id}
                            className="btn-secondary px-3 py-2"
                          >
                            Bỏ
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleFollowUser(user.user_id)}
                            disabled={actionLoadingId === user.user_id}
                            className="btn-primary px-3 py-2"
                          >
                            Theo dõi
                          </button>
                        )
                      )}
                      {canRemoveFollower && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFollower(user.user_id)}
                          disabled={actionLoadingId === `remove-${user.user_id}`}
                          className="btn-secondary px-3 py-2 text-danger hover:border-danger hover:text-danger"
                          title="Xóa người theo dõi"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {followPagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary">
              <span>
                Trang {followPagination.currentPage}/{followPagination.totalPages} -{" "}
                {followPagination.totalCount.toLocaleString("vi-VN")} người dùng
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-2"
                  disabled={followPagination.currentPage <= 1}
                  onClick={() => setFollowPage(followPagination.currentPage - 1)}
                  title="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="btn-secondary px-3 py-2"
                  disabled={followPagination.currentPage >= followPagination.totalPages}
                  onClick={() => setFollowPage(followPagination.currentPage + 1)}
                  title="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default PublicProfile;
