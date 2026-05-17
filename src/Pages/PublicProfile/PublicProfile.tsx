import React, { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  Heart,
  RefreshCw,
  Search,
  ThumbsDown,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
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

type ProfileTab = "public-documents" | "public-collections" | "followers" | "following";

interface FollowStatus {
  user_id: string;
  viewer_id: string | null;
  is_authenticated: boolean;
  is_self: boolean;
  is_following: boolean;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface PublicDocument {
  document_id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  file_type: string;
  download_count: number;
  uploaded_at: string;
  like_count: number;
  dislike_count: number;
  categories?: { category_id: string; name: string; parent_id: string | null }[];
  tags?: { tag_id: number; name: string }[];
}

interface PublicCollection {
  collection_id: number;
  name: string;
  description: string;
  created_at: string;
  document_count: number;
  latest_documents?: {
    document_id: number;
    title: string;
    thumbnail_url: string;
    file_type: string;
    uploaded_at: string;
  }[];
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
  { key: "public_document_count", label: "Tài liệu công khai", icon: FileText, tab: "public-documents" },
  { key: "public_collection_count", label: "Bộ sưu tập công khai", icon: BookOpen, tab: "public-collections" },
  { key: "follower_count", label: "Người theo dõi", icon: Users, tab: "followers" },
  { key: "following_count", label: "Đang theo dõi", icon: Users, tab: "following" },
] as const;

const PublicProfile: React.FC = () => {
  const { userID } = useParams<{ userID: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("public-documents");
  const [followRows, setFollowRows] = useState<FollowListItem[]>([]);
  const [followPagination, setFollowPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });
  const [followPage, setFollowPage] = useState(1);
  const [followSearch, setFollowSearch] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [documentsPagination, setDocumentsPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [collectionsPagination, setCollectionsPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });
  const [collectionsPage, setCollectionsPage] = useState(1);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
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
    if (!userID || (activeTab !== "followers" && activeTab !== "following")) return;

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

  useEffect(() => {
    if (!userID || activeTab !== "public-documents") return;

    setDocumentsLoading(true);
    usersApi
      .getPublicDocuments(userID, { pageNumber: documentsPage, pageSize: PAGE_SIZE })
      .then((response) => {
        const body = response.data?.data ?? response.data ?? {};
        const rows = body.documents ?? [];
        setDocuments(rows);
        setDocumentsPagination(
          body.pagination ?? {
            currentPage: documentsPage,
            pageSize: PAGE_SIZE,
            totalCount: rows.length,
            totalPages: 1,
          }
        );
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Không tải được tài liệu công khai.");
        setDocuments([]);
      })
      .finally(() => setDocumentsLoading(false));
  }, [activeTab, documentsPage, userID]);

  useEffect(() => {
    if (!userID || activeTab !== "public-collections") return;

    setCollectionsLoading(true);
    usersApi
      .getPublicCollections(userID, { pageNumber: collectionsPage, pageSize: PAGE_SIZE })
      .then((response) => {
        const body = response.data?.data ?? response.data ?? {};
        const rows = body.collections ?? [];
        setCollections(rows);
        setCollectionsPagination(
          body.pagination ?? {
            currentPage: collectionsPage,
            pageSize: PAGE_SIZE,
            totalCount: rows.length,
            totalPages: 1,
          }
        );
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Không tải được bộ sưu tập công khai.");
        setCollections([]);
      })
      .finally(() => setCollectionsLoading(false));
  }, [activeTab, collectionsPage, userID]);

  const changeTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    setFollowPage(1);
    setDocumentsPage(1);
    setCollectionsPage(1);
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
      await usersApi.followUser(targetUserId);
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
      await usersApi.unfollowUser(targetUserId);
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

  const renderPagination = (
    pagination: PaginationState,
    label: string,
    onPageChange: (page: number) => void
  ) => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary">
        <span>
          Trang {pagination.currentPage}/{pagination.totalPages} -{" "}
          {pagination.totalCount.toLocaleString("vi-VN")} {label}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-2"
            disabled={pagination.currentPage <= 1}
            onClick={() => onPageChange(pagination.currentPage - 1)}
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn-secondary px-3 py-2"
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => onPageChange(pagination.currentPage + 1)}
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
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
                onClick={() => changeTab(tab)}
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
            <div className="grid rounded-md bg-canvas p-1 sm:grid-cols-4">
              {[
                ["public-documents", "Tài liệu"],
                ["public-collections", "Bộ sưu tập"],
                ["followers", "Người theo dõi"],
                ["following", "Đang theo dõi"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => changeTab(tab as ProfileTab)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab ? "bg-primary text-white" : "text-ink-secondary hover:bg-white hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {(activeTab === "followers" || activeTab === "following") && (
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
            )}
          </div>

          {activeTab === "public-documents" && (
            documentsLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <RefreshCw className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : documents.length === 0 ? (
              <div className="px-4 py-14 text-center text-sm text-ink-secondary">
                Người dùng này chưa có tài liệu công khai.
              </div>
            ) : (
              <>
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  {documents.map((document) => (
                    <article key={document.document_id} className="surface-card surface-card-hover overflow-hidden">
                      <NavLink to={`/document/${document.document_id}`} className="block">
                        <div className="flex h-44 justify-center overflow-hidden bg-canvas">
                          <img
                            src={document.thumbnail_url || "/default-thumbnail.png"}
                            alt={document.title}
                            className="h-full w-3/4 border border-line object-fill transition duration-300 hover:scale-[1.03]"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src = "/default-thumbnail.png";
                            }}
                          />
                        </div>
                      </NavLink>
                      <div className="p-4">
                        <NavLink
                          to={`/document/${document.document_id}`}
                          className="line-clamp-2 min-h-12 text-[15px] font-bold leading-6 text-ink hover:text-primary"
                        >
                          {document.title}
                        </NavLink>
                        <p className="mt-2 line-clamp-2 text-sm text-ink-secondary">
                          {document.description || "Không có mô tả."}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {(document.categories ?? []).slice(0, 2).map((category) => (
                            <span key={category.category_id} className="rounded-md bg-primary-soft px-2 py-1 text-xs text-primary">
                              {category.name}
                            </span>
                          ))}
                          {(document.tags ?? []).slice(0, 2).map((tag) => (
                            <span key={tag.tag_id} className="rounded-md bg-canvas px-2 py-1 text-xs text-ink-secondary">
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-ink-secondary">
                          <span>{formatDate(document.uploaded_at)}</span>
                          <span className="inline-flex items-center gap-1">
                            <Download className="h-3.5 w-3.5" />
                            {document.download_count ?? 0}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-ink-secondary">
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-danger" />
                            {document.like_count ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ThumbsDown className="h-3.5 w-3.5" />
                            {document.dislike_count ?? 0}
                          </span>
                          <span className="ml-auto uppercase">{document.file_type || "file"}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {renderPagination(documentsPagination, "tài liệu", setDocumentsPage)}
              </>
            )
          )}

          {activeTab === "public-collections" && (
            collectionsLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <RefreshCw className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : collections.length === 0 ? (
              <div className="px-4 py-14 text-center text-sm text-ink-secondary">
                Người dùng này chưa có bộ sưu tập công khai.
              </div>
            ) : (
              <>
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  {collections.map((collection) => (
                    <article key={collection.collection_id} className="surface-card surface-card-hover overflow-hidden p-4">
                      <NavLink
                        to={`/collection/${collection.collection_id}`}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-lg font-bold text-ink hover:text-primary">
                            {collection.name}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-secondary">
                            {collection.description || "Không có mô tả."}
                          </p>
                        </div>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                          <FolderOpen className="h-5 w-5" />
                        </span>
                      </NavLink>
                      <div className="mt-4 flex items-center justify-between text-sm text-ink-secondary">
                        <span>{collection.document_count ?? 0} tài liệu</span>
                        <span>Tạo {formatDate(collection.created_at)}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {(collection.latest_documents ?? []).slice(0, 3).map((document) => (
                          <NavLink
                            key={document.document_id}
                            to={`/document/${document.document_id}`}
                            className="block overflow-hidden rounded-md border border-line bg-canvas"
                            title={document.title}
                          >
                            <img
                              src={document.thumbnail_url || "/default-thumbnail.png"}
                              alt={document.title}
                              className="h-24 w-full object-cover"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.src = "/default-thumbnail.png";
                              }}
                            />
                          </NavLink>
                        ))}
                        {(collection.latest_documents ?? []).length === 0 && (
                          <div className="col-span-3 rounded-md border border-dashed border-line bg-canvas px-3 py-8 text-center text-sm text-ink-secondary">
                            Chưa có tài liệu hiển thị.
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                {renderPagination(collectionsPagination, "bộ sưu tập", setCollectionsPage)}
              </>
            )
          )}

          {(activeTab === "followers" || activeTab === "following") && (followLoading ? (
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
          ))}

          {(activeTab === "followers" || activeTab === "following") &&
            renderPagination(followPagination, "người dùng", setFollowPage)}
        </section>
      </div>
    </>
  );
};

export default PublicProfile;
