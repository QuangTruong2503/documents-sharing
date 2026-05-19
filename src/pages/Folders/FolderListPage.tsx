import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Bell,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Share2,
} from "lucide-react";
import PageTitle from "components/PageTitle.js";
import foldersApi, { folderVisibilityOptions } from "api/foldersApi.js";
import { formatDateToVN } from "utils/formatDateToVN";

type FolderVisibility = "private" | "shared" | "public";
type FolderRole = "owner" | "admin" | "editor" | "contributor" | "commenter" | "viewer" | "public";

interface FolderItem {
  folder_id: number;
  name: string;
  description: string | null;
  visibility: FolderVisibility;
  created_at: string;
  document_count?: number;
  member_count?: number;
  current_user_role?: FolderRole;
  role?: FolderRole;
  owner?: { username?: string; Username?: string; full_name?: string | null } | null;
}

const visibilityLabel: Record<string, string> = {
  private: "Riêng tư",
  shared: "Chia sẻ",
  public: "Công khai",
};

const roleLabel: Record<string, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị",
  editor: "Biên tập",
  contributor: "Đóng góp",
  commenter: "Bình luận",
  viewer: "Xem",
  public: "Công khai",
};

function apiMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-secondary">
    {children}
  </span>
);

const EmptyState = ({ tab, onCreate }: { tab: string; onCreate: () => void }) => (
  <div className="surface-card p-10 text-center">
    <FolderOpen className="mx-auto h-10 w-10 text-neutral" />
    <h2 className="mt-4 text-lg font-bold text-ink">
      {tab === "shared" ? "Chưa có thư mục được chia sẻ" : "Chưa có thư mục nào"}
    </h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
      {tab === "shared"
        ? "Các thư mục người khác mời bạn tham gia sẽ xuất hiện tại đây."
        : "Tạo thư mục để gom tài liệu, phân quyền thành viên và quản lý lời mời."}
    </p>
    {tab !== "shared" && (
      <button type="button" onClick={onCreate} className="btn-primary mt-6">
        <Plus className="mr-2 h-4 w-4" />
        Tạo thư mục
      </button>
    )}
  </div>
);

const FolderFormDialog = ({
  title,
  initialValue,
  onClose,
  onSubmit,
  disableVisibility = false,
}: {
  title: string;
  initialValue?: { name: string; description: string; visibility: FolderVisibility };
  onClose: () => void;
  onSubmit: (payload: { name: string; description: string; visibility: FolderVisibility; parent_folder_id: null }) => Promise<void>;
  disableVisibility?: boolean;
}) => {
  const [form, setForm] = useState(
    initialValue || { name: "", description: "", visibility: "private" as FolderVisibility }
  );
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFieldError("Tên thư mục là bắt buộc.");
      return;
    }

    setSaving(true);
    setFieldError("");
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
        parent_folder_id: null,
      });
    } catch (error: any) {
      if (error?.response?.data?.code === "FOLDER_NAME_EXISTS") {
        setFieldError("Tên thư mục này đã tồn tại.");
      } else {
        toast.error(apiMessage(error, "Không thể lưu thư mục."));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-semibold text-ink">Tên thư mục</span>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="input-field"
            maxLength={150}
            autoFocus
          />
          {fieldError && <span className="mt-1 block text-xs font-medium text-danger">{fieldError}</span>}
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-semibold text-ink">Mô tả</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="input-field min-h-24"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-semibold text-ink">Hiển thị</span>
          <select
            value={form.visibility}
            onChange={(event) => setForm({ ...form, visibility: event.target.value as FolderVisibility })}
            className="input-field"
            disabled={disableVisibility}
          >
            {folderVisibilityOptions.map((value) => (
              <option key={value} value={value}>
                {visibilityLabel[value]}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Hủy
          </button>
          <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
};

const FolderCard = ({ folder, isShared }: { folder: FolderItem; isShared: boolean }) => {
  const ownerName = folder.owner?.full_name || folder.owner?.username || folder.owner?.Username;
  const role = folder.current_user_role || folder.role;

  return (
    <article className="surface-card surface-card-hover p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <Folder className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <NavLink
              to={`/folders/${folder.folder_id}`}
              className="line-clamp-1 text-lg font-bold text-ink transition hover:text-primary"
            >
              {folder.name}
            </NavLink>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-secondary">
              {folder.description || "Thư mục này chưa có mô tả."}
            </p>
          </div>
        </div>
        <Badge>{visibilityLabel[folder.visibility] || folder.visibility}</Badge>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge>{folder.document_count ?? 0} tài liệu</Badge>
        <Badge>{folder.member_count ?? 0} thành viên</Badge>
        {isShared && role && <Badge>{roleLabel[role] || role}</Badge>}
      </div>
      <div className="mt-4 text-xs text-ink-secondary">
        {isShared && ownerName ? <p>Chủ sở hữu: {ownerName}</p> : <p>Tạo ngày {formatDateToVN(folder.created_at)}</p>}
      </div>
    </article>
  );
};

const FolderListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeTab = location.pathname.endsWith("/shared-with-me") ? "shared" : location.pathname.endsWith("/my") ? "my" : null;
  const tab = searchParams.get("tab") === "shared" || routeTab === "shared" ? "shared" : "my";
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 8, totalCount: 0, totalPages: 1 });

  const page = Number(searchParams.get("page") || 1);
  const query = useMemo(() => ({ search: searchParams.get("search") || "", pageNumber: page, pageSize: 8 }), [page, searchParams]);

  useEffect(() => {
    const loadFolders = async () => {
      setLoading(true);
      try {
        const response = tab === "shared" ? await foldersApi.getSharedFolders(query) : await foldersApi.getMyFolders(query);
        setFolders(response.data);
        setPagination(response.pagination);
      } catch (error: any) {
        toast.error(apiMessage(error, "Không tải được danh sách thư mục."));
      } finally {
        setLoading(false);
      }
    };

    loadFolders();
  }, [query, tab]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams({ tab, search: search.trim(), page: "1" });
  };

  const changeTab = (nextTab: string) => {
    setSearchParams({ tab: nextTab, page: "1" });
  };

  const createFolder = async (payload: any) => {
    const folder = await foldersApi.createFolder(payload);
    toast.success("Đã tạo thư mục.");
    setShowCreate(false);
    if (folder?.folder_id) {
      navigate(`/folders/${folder.folder_id}`);
    } else {
      setSearchParams({ tab: "my", page: "1" });
    }
  };

  return (
    <>
      <PageTitle title="Thư mục" description="Quản lý không gian tài liệu có phân quyền." />
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-primary">DocShare Drive</p>
            <h1 className="text-3xl font-bold text-ink">Thư mục tài liệu</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Tạo thư mục cá nhân, theo dõi thư mục được chia sẻ và xử lý lời mời tham gia.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <NavLink to="/folder-invites" className="btn-secondary">
              <Bell className="mr-2 h-4 w-4" />
              Lời mời
            </NavLink>
            <button type="button" onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="mr-2 h-4 w-4" />
              Tạo thư mục
            </button>
          </div>
        </section>

        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-lg border border-line bg-surface p-1">
            <button
              type="button"
              onClick={() => changeTab("my")}
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition ${
                tab === "my" ? "bg-primary text-white" : "text-ink-secondary hover:text-primary"
              }`}
            >
              <Folder className="mr-2 h-4 w-4" />
              Của tôi
            </button>
            <button
              type="button"
              onClick={() => changeTab("shared")}
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition ${
                tab === "shared" ? "bg-primary text-white" : "text-ink-secondary hover:text-primary"
              }`}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Được chia sẻ
            </button>
          </div>

          <form onSubmit={submitSearch} className="flex gap-2 lg:w-[420px]">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input-field pl-9"
                placeholder="Tìm thư mục"
              />
            </label>
            <button type="submit" className="btn-secondary px-3">
              Tìm
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <RefreshCw className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-ink-secondary">Đang tải thư mục...</p>
          </div>
        ) : folders.length === 0 ? (
          <EmptyState tab={tab} onCreate={() => setShowCreate(true)} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {folders.map((folder) => (
                <FolderCard key={folder.folder_id} folder={folder} isShared={tab === "shared"} />
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm text-ink-secondary">
                <span>
                  Trang {pagination.currentPage}/{pagination.totalPages} - {pagination.totalCount} thư mục
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2"
                    disabled={pagination.currentPage <= 1}
                    onClick={() => setSearchParams({ tab, search: query.search, page: String(pagination.currentPage - 1) })}
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2"
                    disabled={pagination.currentPage >= pagination.totalPages}
                    onClick={() => setSearchParams({ tab, search: query.search, page: String(pagination.currentPage + 1) })}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {showCreate && (
          <FolderFormDialog title="Tạo thư mục" onClose={() => setShowCreate(false)} onSubmit={createFolder} />
        )}
      </div>
    </>
  );
};

export { Badge, FolderFormDialog, apiMessage, roleLabel, visibilityLabel };
export default FolderListPage;
