import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  Check,
  Copy,
  Download,
  Eye,
  File,
  FileText,
  Folder,
  Grid3X3,
  Image,
  List,
  Lock,
  MoreHorizontal,
  MoveRight,
  Pencil,
  RefreshCw,
  Search,
  Share2,
  Shield,
  Star,
  Table,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import PageTitle from "components/PageTitle.js";
import WorkspaceCreateDropdown from "components/Workspace/WorkspaceCreateDropdown.tsx";
import workspaceLibraryApi, {
  WorkspaceFolder,
  WorkspaceItem,
  WorkspacePermissions,
} from "api/workspaceLibraryApi.ts";
import foldersApi, { folderRoles } from "api/foldersApi.js";
import PaginationComponent from "components/Pagination/Pagination.tsx";
import { formatDateToVN } from "utils/formatDateToVN";
import {
  canEvery,
  defaultWorkspacePagination,
  downloadWorkspaceDocument,
  normalizeWorkspacePagination,
  toDateTimeLocalValue,
  WorkspacePagination,
  workspaceFailureMessage,
} from "utils/workspaceLibraryHelpers.ts";
import { Badge, apiMessage, roleLabel } from "./FolderListPage.tsx";

type ViewMode = "grid" | "list";
type WorkspaceTab = "documents" | "members" | "invites" | "settings";
type DialogState =
  | { type: "create-folder" }
  | { type: "upload" }
  | { type: "rename"; item: WorkspaceItem }
  | { type: "move"; mode: "move" | "copy"; items: WorkspaceItem[] }
  | { type: "merge"; items: WorkspaceItem[] }
  | { type: "share"; item: WorkspaceItem }
  | null;

interface FolderMember {
  user_id: string;
  role: string;
  joined_at: string;
  user?: { username?: string; Username?: string; full_name?: string | null; email?: string | null } | null;
}

interface FolderInvite {
  invite_id: number;
  invitee_user_id?: string | null;
  invitee_email?: string | null;
  role: string;
  status: string;
  created_at: string;
}

const fileIconMap: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: Table,
  xlsx: Table,
  png: Image,
  jpg: Image,
  jpeg: Image,
};

const defaultPermissions: WorkspacePermissions = {
  canView: true,
  canDownload: true,
  canUpload: false,
  canCreateFolder: false,
  canRename: false,
  canMove: false,
  canCopy: false,
  canShare: false,
  canDelete: false,
  canManageMembers: false,
};

const getPermissions = (folder?: WorkspaceFolder | WorkspaceItem | null) => ({ ...defaultPermissions, ...(folder?.permissions || {}) });
const getItemName = (item: WorkspaceItem) => item.title || item.name || `${item.type} #${item.id}`;
const getExtension = (item: WorkspaceItem) => (item.extension || item.mimeType || "file").replace(".", "").toLowerCase();
const toPayloadItems = (items: WorkspaceItem[]) => items.map((item) => ({ id: item.id, type: item.type }));
const getMemberName = (member: FolderMember) => member.user?.full_name || member.user?.username || member.user?.Username || member.user_id;

const formatSize = (size?: number) => {
  if (!size) return "--";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const FolderWorkspaceSidebar = ({
  folder,
  activeTab,
  onTab,
  onCreate,
  onUpload,
  onShare,
}: {
  folder: WorkspaceFolder;
  activeTab: WorkspaceTab;
  onTab: (tab: WorkspaceTab) => void;
  onCreate: () => void;
  onUpload: () => void;
  onShare: () => void;
}) => {
  const permissions = getPermissions(folder);
  const nav = [
    { key: "documents", label: "Tài liệu", icon: Folder },
    { key: "members", label: "Thành viên", icon: Users, disabled: !permissions.canManageMembers },
    { key: "invites", label: "Lời mời", icon: UserPlus, disabled: !permissions.canManageMembers },
    { key: "settings", label: "Cài đặt", icon: Shield },
  ] as const;

  return (
    <aside className="rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Folder className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h2 className="line-clamp-2 font-bold text-ink">{folder.name}</h2>
          <p className="mt-1 text-xs text-ink-secondary">{folder.permission || "viewer"}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-secondary">{folder.description || "Thư mục này chưa có mô tả."}</p>
      <div className="mt-5 grid gap-2">
        <WorkspaceCreateDropdown
          canUpload={permissions.canUpload !== false}
          canCreateFolder={permissions.canCreateFolder !== false}
          onUpload={onUpload}
          onCreateFolder={onCreate}
          className="w-full [&>button]:w-full [&>div]:left-0 [&>div]:right-auto"
        />
        <button type="button" onClick={onShare} disabled={!permissions.canShare && !permissions.canManageMembers} className="btn-secondary">
          <Share2 className="mr-2 h-4 w-4" />
          Share folder
        </button>
      </div>
      <nav className="mt-6 space-y-1 border-t border-line pt-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTab(item.key)}
              disabled={item.disabled}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition ${
                active ? "bg-primary-soft text-primary" : "text-ink-secondary hover:bg-canvas hover:text-ink"
              } disabled:pointer-events-none disabled:opacity-40`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-6 rounded-md border border-line bg-canvas p-3 text-sm text-ink-secondary">
        <div className="mb-2 flex items-center gap-2 font-semibold text-ink">
          <Shield className="h-4 w-4 text-primary" />
          Quyền truy cập
        </div>
        <p>{permissions.canCreateFolder ? "Bạn có thể tạo folder con và tải file trong thư mục này." : "Bạn đang ở chế độ xem giới hạn."}</p>
      </div>
    </aside>
  );
};

const DocumentsToolbar = ({
  selectedItems,
  folderPermissions,
  viewMode,
  onViewMode,
  onClear,
  onCreate,
  onUpload,
  onRename,
  onMove,
  onCopy,
  onMerge,
  onShare,
  onTrash,
}: {
  selectedItems: WorkspaceItem[];
  folderPermissions: WorkspacePermissions;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  onClear: () => void;
  onCreate: () => void;
  onUpload: () => void;
  onRename: () => void;
  onMove: () => void;
  onCopy: () => void;
  onMerge: () => void;
  onShare: () => void;
  onTrash: () => void;
}) => {
  const selectedCount = selectedItems.length;
  const allDocuments = selectedItems.length > 1 && selectedItems.every((item) => item.type === "document");
  const canRename = selectedCount === 1 && selectedItems[0].permissions?.canRename !== false;
  const canMove = canEvery(selectedItems, "canMove");
  const canCopy = canEvery(selectedItems, "canCopy");
  const canShare = selectedCount === 1 && selectedItems[0].permissions?.canShare !== false;
  const canDelete = canEvery(selectedItems, "canDelete");
  const canCreate = folderPermissions.canCreateFolder !== false;
  const canUpload = folderPermissions.canUpload !== false;

  return (
    <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">{selectedCount} mục đã chọn</span>
          {selectedCount === 1 && (
            <button type="button" onClick={onRename} disabled={!canRename} className="btn-secondary px-3 py-2">
              <Pencil className="mr-2 h-4 w-4" />
              Đổi tên
            </button>
          )}
          <button type="button" onClick={onMove} disabled={!canMove} className="btn-secondary px-3 py-2">
            <MoveRight className="mr-2 h-4 w-4" />
            Di chuyển
          </button>
          <button type="button" onClick={onCopy} disabled={!canCopy} className="btn-secondary px-3 py-2">
            <Copy className="mr-2 h-4 w-4" />
            Sao chép
          </button>
          {allDocuments && (
            <button type="button" onClick={onMerge} className="btn-secondary px-3 py-2">
              <Folder className="mr-2 h-4 w-4" />
              Gom vào thư mục
            </button>
          )}
          {selectedCount === 1 && (
            <button type="button" onClick={onShare} disabled={!canShare} className="btn-secondary px-3 py-2">
              <Share2 className="mr-2 h-4 w-4" />
              Chia sẻ
            </button>
          )}
          <button type="button" onClick={onTrash} disabled={!canDelete} className="btn-secondary border-danger px-3 py-2 text-danger hover:border-danger hover:text-danger">
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </button>
          <button type="button" onClick={onClear} className="btn-secondary px-3 py-2" title="Bỏ chọn">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <WorkspaceCreateDropdown
            canUpload={canUpload}
            canCreateFolder={canCreate}
            onUpload={onUpload}
            onCreateFolder={onCreate}
          />
        </div>
      )}
      <div className="inline-flex w-fit rounded-md border border-line bg-canvas p-1">
        <button type="button" onClick={() => onViewMode("grid")} className={`rounded px-2.5 py-2 ${viewMode === "grid" ? "bg-surface text-primary shadow-sm" : "text-ink-secondary"}`} title="Grid view">
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onViewMode("list")} className={`rounded px-2.5 py-2 ${viewMode === "list" ? "bg-surface text-primary shadow-sm" : "text-ink-secondary"}`} title="List view">
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const WorkspaceItemCard = ({
  item,
  selected,
  onSelect,
  onPreview,
  onMenu,
}: {
  item: WorkspaceItem;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onMenu: () => void;
}) => {
  const isFolder = item.type === "folder";
  const ext = getExtension(item);
  const Icon = isFolder ? Folder : fileIconMap[ext] || File;

  return (
    <article className={`rounded-lg border bg-surface transition hover:-translate-y-0.5 hover:shadow-card ${selected ? "border-primary ring-2 ring-primary/20" : "border-line"}`}>
      <div className="relative">
        <button type="button" onClick={onSelect} className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary text-white" : "border-line bg-surface/95 text-ink-secondary hover:text-primary"}`} aria-label={selected ? "Bỏ chọn mục" : "Chọn mục"}>
          {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
        </button>
        <button type="button" onClick={onMenu} className="absolute right-3 top-3 z-10 rounded-md bg-surface/95 p-2 text-ink-secondary hover:text-primary" title="Thao tác">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {isFolder ? (
          <NavLink to={`/library/folders/${item.id}`} className="flex h-36 items-center justify-center bg-primary-soft">
            <Icon className="h-14 w-14 text-primary" />
          </NavLink>
        ) : (
          <button type="button" onClick={onPreview} className="flex h-36 w-full items-center justify-center overflow-hidden bg-canvas">
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt={getItemName(item)} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-ink-secondary">
                <Icon className="h-10 w-10 text-primary" />
                {ext.toUpperCase()}
              </span>
            )}
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-2">
          {isFolder ? (
            <NavLink to={`/library/folders/${item.id}`} className="line-clamp-1 min-w-0 flex-1 font-bold text-ink hover:text-primary">{getItemName(item)}</NavLink>
          ) : (
            <button type="button" onClick={onPreview} className="line-clamp-1 min-w-0 flex-1 text-left font-bold text-ink hover:text-primary">{getItemName(item)}</button>
          )}
          {item.isFavorite && <Star className="h-4 w-4 shrink-0 fill-warning text-warning" />}
        </div>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-ink-secondary">
          {isFolder ? item.description || `${item.childrenCount ?? 0} mục` : item.description || "Không có mô tả."}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-ink-secondary">
          <span>{isFolder ? `${item.folderCount ?? 0} thư mục · ${item.documentCount ?? 0} file` : `${ext.toUpperCase()} · ${formatSize(item.size)}`}</span>
          <span>{item.updatedAt ? formatDateToVN(item.updatedAt) : ""}</span>
        </div>
      </div>
    </article>
  );
};

const WorkspaceItemList = ({
  items,
  selectedKeys,
  onToggle,
  onPreview,
  onMenu,
}: {
  items: WorkspaceItem[];
  selectedKeys: string[];
  onToggle: (item: WorkspaceItem) => void;
  onPreview: (item: WorkspaceItem) => void;
  onMenu: (item: WorkspaceItem) => void;
}) => (
  <div className="overflow-x-auto rounded-lg border border-line bg-surface">
    <div className="grid min-w-[760px] grid-cols-[44px_1fr_120px_120px_150px_48px] gap-3 border-b border-line px-4 py-3 text-xs font-semibold uppercase text-ink-secondary">
      <span />
      <span>Tên</span>
      <span>Loại</span>
      <span>Kích thước</span>
      <span>Cập nhật</span>
      <span />
    </div>
    {items.map((item) => {
      const selected = selectedKeys.includes(`${item.type}-${item.id}`);
      const Icon = item.type === "folder" ? Folder : fileIconMap[getExtension(item)] || File;
      return (
        <div key={`${item.type}-${item.id}`} className="grid min-w-[760px] grid-cols-[44px_1fr_120px_120px_150px_48px] gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-canvas">
          <button type="button" onClick={() => onToggle(item)} className={`flex h-8 w-8 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary text-white" : "border-line text-ink-secondary"}`} aria-label={selected ? "Bỏ chọn mục" : "Chọn mục"}>
            {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {item.type === "folder" ? (
              <NavLink to={`/library/folders/${item.id}`} className="truncate font-semibold text-ink hover:text-primary">{getItemName(item)}</NavLink>
            ) : (
              <button type="button" onClick={() => onPreview(item)} className="truncate text-left font-semibold text-ink hover:text-primary">{getItemName(item)}</button>
            )}
          </div>
          <span className="self-center text-sm text-ink-secondary">{item.type === "folder" ? "Folder" : getExtension(item).toUpperCase()}</span>
          <span className="self-center text-sm text-ink-secondary">{item.type === "folder" ? formatSize(item.totalSize) : formatSize(item.size)}</span>
          <span className="self-center text-sm text-ink-secondary">{item.updatedAt ? formatDateToVN(item.updatedAt) : "--"}</span>
          <button type="button" onClick={() => onMenu(item)} className="rounded-md p-2 text-ink-secondary hover:text-primary" title="Thao tác">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      );
    })}
  </div>
);

const PreviewDrawer = ({ item, onClose, onShare }: { item: WorkspaceItem | null; onClose: () => void; onShare: (item: WorkspaceItem) => void }) => {
  const [preview, setPreview] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!item || item.type !== "document") {
      setPreview(null);
      return;
    }
    workspaceLibraryApi.getDocumentPreview(item.id).then(setPreview).catch(() => setPreview(null));
  }, [item]);

  if (!item || item.type !== "document") return null;
  const document = preview?.document || item;
  const metadata = preview?.metadata;
  const ext = getExtension(document);
  const Icon = fileIconMap[ext] || FileText;
  const canDownload = document.allowDownload !== false && document.permissions?.canDownload !== false;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadWorkspaceDocument(document);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tải tài liệu."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line bg-surface shadow-card  lg:inset-y-0 lg:right-0">
      <div className="flex items-center justify-between border-b border-line p-4">
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{getItemName(document)}</p>
          <p className="text-xs text-ink-secondary">{ext.toUpperCase()} · {formatSize(document.size)}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-2 text-ink-secondary hover:bg-canvas hover:text-ink" title="Đóng">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex h-72 items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas">
          {document.thumbnailUrl ? (
            <img src={document.thumbnailUrl} alt={getItemName(document)} className="h-full w-full object-contain" />
          ) : (
            <div className="text-center text-ink-secondary">
              <Icon className="mx-auto h-14 w-14 text-primary" />
              <p className="mt-3 text-sm">{document.status === "processing" ? "Đang xử lý preview" : "Chưa có preview"}</p>
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <NavLink to={`/document/${item.id}`} className="btn-primary">
            <Eye className="mr-2 h-4 w-4" />
            Chi tiết
          </NavLink>
          <button type="button" onClick={download} disabled={!canDownload || downloading} className="btn-secondary">
            {downloading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Tải xuống
          </button>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-ink">Mô tả</dt>
            <dd className="mt-1 text-ink-secondary">{document.description || "Không có mô tả."}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Chủ sở hữu</dt>
            <dd className="mt-1 text-ink-secondary">{metadata?.ownerName || item.ownerName || "--"}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
};

const CreateFolderDialog = ({ parentFolderId, onClose, onDone }: { parentFolderId: number; onClose: () => void; onDone: () => void }) => {
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await workspaceLibraryApi.createFolder({ name: form.name.trim(), description: form.description.trim(), parentFolderId, color: null });
      toast.success("Đã tạo thư mục con.");
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tạo thư mục con."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Tạo thư mục con</h2>
        <p className="mt-1 text-sm text-ink-secondary">Thư mục mới sẽ nằm trong folder hiện tại.</p>
        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-semibold text-ink">Tên thư mục</span>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input-field" autoFocus />
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-semibold text-ink">Mô tả</span>
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input-field min-h-24" />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary">{saving ? "Đang tạo..." : "Tạo"}</button>
        </div>
      </form>
    </div>
  );
};

const UploadDialog = ({ parentFolderId, onClose, onDone }: { parentFolderId: number; onClose: () => void; onDone: () => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length === 0) return;
    setUploading(true);
    try {
      const response = await workspaceLibraryApi.uploadDocuments(files, parentFolderId);
      if (response.failed?.length) toast.warning(`${response.documents?.length || 0} file tải lên thành công, ${response.failed.length} file lỗi.`);
      else toast.success("Đã tải file vào thư mục.");
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tải file lên."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-xl rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Tải tài liệu vào thư mục</h2>
        <label className="mt-5 block rounded-lg border border-dashed border-line bg-canvas p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-primary" />
          <span className="mt-2 block text-sm font-semibold text-ink">Chọn một hoặc nhiều file</span>
          <input type="file" multiple className="mt-4 block w-full text-sm text-ink-secondary" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
        </label>
        {files.length > 0 && <p className="mt-3 text-sm text-ink-secondary">{files.length} file đã chọn</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={uploading || files.length === 0} className="btn-primary">
            {uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Đang tải..." : "Tải lên"}
          </button>
        </div>
      </form>
    </div>
  );
};

const RenameDialog = ({ item, onClose, onDone }: { item: WorkspaceItem; onClose: () => void; onDone: () => void }) => {
  const [name, setName] = useState(getItemName(item));
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await workspaceLibraryApi.renameItem(item.id, { type: item.type, name: name.trim() });
      toast.success("Đã đổi tên.");
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể đổi tên."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Đổi tên</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} className="input-field mt-5" autoFocus />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving || !name.trim()} className="btn-primary">{saving ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </form>
    </div>
  );
};

const MoveCopyDialog = ({ mode, items, onClose, onDone }: { mode: "move" | "copy"; items: WorkspaceItem[]; onClose: () => void; onDone: () => void }) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    workspaceLibraryApi.getFolderTree({ root: "my", includeShared: true }).then((response) => setNodes(response.nodes || [])).catch((error) => toast.error(apiMessage(error, "Không tải được cây thư mục.")));
  }, []);

  const flatNodes = useMemo(() => {
    const rows: Array<{ id: number; name: string; depth: number; canReceiveItems: boolean }> = [];
    const walk = (list: any[], depth: number) => {
      list.forEach((node) => {
        rows.push({ id: node.id, name: node.name, depth, canReceiveItems: node.canReceiveItems !== false });
        walk(node.children || [], depth + 1);
      });
    };
    walk(nodes, 0);
    return rows;
  }, [nodes]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { items: toPayloadItems(items), targetFolderId };
      const response = mode === "move" ? await workspaceLibraryApi.moveItems(payload) : await workspaceLibraryApi.copyItems(payload);
      if (response.failed?.length) toast.info(workspaceFailureMessage(response, "Một số mục chưa xử lý được."));
      else toast.success(mode === "move" ? "Đã di chuyển." : "Đã sao chép.");
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, mode === "move" ? "Không thể di chuyển." : "Không thể sao chép."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">{mode === "move" ? "Di chuyển" : "Sao chép"} {items.length} mục</h2>
        <div className="mt-5 max-h-80 overflow-auto rounded-lg border border-line">
          <label className="flex cursor-pointer items-center gap-3 border-b border-line p-3 text-sm hover:bg-canvas">
            <input type="radio" checked={targetFolderId === null} onChange={() => setTargetFolderId(null)} />
            <span className="font-medium text-ink">Tài liệu của tôi</span>
          </label>
          {flatNodes.map((node) => (
            <label key={node.id} className={`flex cursor-pointer items-center gap-3 border-b border-line p-3 text-sm last:border-b-0 ${node.canReceiveItems ? "hover:bg-canvas" : "opacity-50"}`}>
              <input type="radio" checked={targetFolderId === node.id} disabled={!node.canReceiveItems} onChange={() => setTargetFolderId(node.id)} />
              <span style={{ paddingLeft: node.depth * 18 }} className="font-medium text-ink">{node.name}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Đang xử lý..." : "Xác nhận"}</button>
        </div>
      </form>
    </div>
  );
};

const MergeDialog = ({ items, parentFolderId, onClose, onDone }: { items: WorkspaceItem[]; parentFolderId: number; onClose: () => void; onDone: () => void }) => {
  const [name, setName] = useState("Tài liệu mới");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await workspaceLibraryApi.mergeDocumentsIntoFolder({
        name: name.trim(),
        parentFolderId,
        items: items.filter((item) => item.type === "document").map((item) => ({ id: item.id, type: "document" })),
      });
      toast.success("Đã gom vào thư mục mới.");
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể gom tài liệu."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Gom vào thư mục con mới</h2>
        <p className="mt-1 text-sm text-ink-secondary">{items.length} tài liệu sẽ được chuyển vào folder mới trong folder hiện tại.</p>
        <input value={name} onChange={(event) => setName(event.target.value)} className="input-field mt-5" autoFocus />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving || !name.trim()} className="btn-primary">{saving ? "Đang tạo..." : "Gom"}</button>
        </div>
      </form>
    </div>
  );
};

const ShareDialog = ({ item, onClose }: { item: WorkspaceItem; onClose: () => void }) => {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [form, setForm] = useState({ access: "anyone_with_link", permission: "viewer", allowDownload: true, password: "", expiresAt: "" });

  useEffect(() => {
    workspaceLibraryApi.getShareLinkSettings({ itemId: item.id, itemType: item.type }).then((response) => {
      if (response.shareLink) {
        setSettings(response.shareLink);
        setForm({
          access: response.shareLink.access || "anyone_with_link",
          permission: response.shareLink.permission || "viewer",
          allowDownload: response.shareLink.allowDownload !== false,
          password: "",
          expiresAt: toDateTimeLocalValue(response.shareLink.expiresAt),
        });
      }
    }).catch(() => undefined);
  }, [item]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await workspaceLibraryApi.createShareLink({
        itemId: item.id,
        itemType: item.type,
        access: form.access,
        permission: form.permission,
        allowDownload: form.allowDownload,
        password: form.password || null,
        expiresAt: form.expiresAt || null,
        maxViews: null,
        maxDownloads: null,
      });
      setSettings(response.shareLink);
      toast.success("Đã tạo liên kết chia sẻ.");
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tạo link chia sẻ."));
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!settings?.shareUrl) {
      await save();
      return;
    }
    await navigator.clipboard.writeText(settings.shareUrl);
    toast.success("Đã sao chép liên kết.");
  };

  const disableLink = async () => {
    if (!settings?.id) return;
    setDisabling(true);
    try {
      await workspaceLibraryApi.disableShareLink(settings.id);
      setSettings(null);
      toast.success("Đã tắt liên kết chia sẻ.");
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tắt liên kết chia sẻ."));
    } finally {
      setDisabling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg border border-line bg-surface p-6 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">Chia sẻ "{getItemName(item)}"</h2>
            <p className="mt-1 text-sm text-ink-secondary">Tạo link chia sẻ cho {item.type === "folder" ? "thư mục" : "tài liệu"}.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-ink-secondary hover:bg-canvas">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">General access</span>
            <select value={form.access} onChange={(event) => setForm({ ...form, access: event.target.value })} className="input-field">
              <option value="restricted">Restricted</option>
              <option value="anyone_with_link">Anyone with link</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">Permission</span>
            <select value={form.permission} onChange={(event) => setForm({ ...form, permission: event.target.value })} className="input-field">
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </label>
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-md border border-line p-3 text-sm text-ink-secondary">
          <input type="checkbox" checked={form.allowDownload} onChange={(event) => setForm({ ...form, allowDownload: event.target.checked })} />
          <span>Allow download</span>
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">Password</span>
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="input-field" placeholder="Không bắt buộc" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">Expiration date</span>
            <input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className="input-field" />
          </label>
        </div>
        <div className="mt-5 rounded-md border border-line bg-canvas p-3 text-sm text-ink-secondary">{settings?.shareUrl || "Chưa có link. Bấm tạo link để lấy liên kết."}</div>
        <div className="mt-6 flex justify-end gap-2">
          {settings?.id && (
            <button type="button" onClick={disableLink} disabled={disabling} className="btn-secondary border-danger text-danger hover:border-danger hover:text-danger">
              {disabling ? "Đang tắt..." : "Tắt link"}
            </button>
          )}
          <button type="button" onClick={save} disabled={saving} className="btn-secondary">{saving ? "Đang lưu..." : "Tạo/Cập nhật link"}</button>
          <button type="button" onClick={copyLink} className="btn-primary">Sao chép liên kết</button>
        </div>
      </div>
    </div>
  );
};

const MembersPanel = ({ folderId }: { folderId: number }) => {
  const [members, setMembers] = useState<FolderMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState({ user_id: "", role: "viewer" });

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await foldersApi.getFolderMembers(folderId);
      setMembers(response.data);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không tải được thành viên."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adding.user_id.trim()) return;
    try {
      await foldersApi.addFolderMember(folderId, { user_id: adding.user_id.trim(), role: adding.role });
      toast.success("Đã thêm thành viên.");
      setAdding({ user_id: "", role: "viewer" });
      loadMembers();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể thêm thành viên."));
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={addMember} className="mb-4 grid gap-3 rounded-lg border border-line bg-canvas p-4 lg:grid-cols-[1fr_180px_auto] lg:items-end">
        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">User ID</span>
          <input value={adding.user_id} onChange={(event) => setAdding({ ...adding, user_id: event.target.value })} className="input-field" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">Quyền</span>
          <select value={adding.role} onChange={(event) => setAdding({ ...adding, role: event.target.value })} className="input-field">
            {folderRoles.map((role) => <option key={role} value={role}>{roleLabel[role] || role}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-primary">
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm
        </button>
      </form>
      {loading ? (
        <div className="py-10 text-center text-sm text-ink-secondary">Đang tải thành viên...</div>
      ) : members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-ink-secondary">Chưa có thành viên.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {members.map((member) => (
            <div key={member.user_id} className="grid gap-3 border-b border-line p-4 last:border-b-0 md:grid-cols-[1fr_180px] md:items-center">
              <div>
                <p className="font-semibold text-ink">{getMemberName(member)}</p>
                <p className="text-xs text-ink-secondary">{member.user?.email || member.user_id}</p>
              </div>
              <Badge>{roleLabel[member.role] || member.role}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const InvitesPanel = ({ folderId }: { folderId: number }) => {
  const [invites, setInvites] = useState<FolderInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ invitee_email: "", role: "viewer" });

  const loadInvites = async () => {
    setLoading(true);
    try {
      const response = await foldersApi.getFolderInvites(folderId, { status: "pending", pageNumber: 1, pageSize: 30 });
      setInvites(response.data);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không tải được lời mời."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const createInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.invitee_email.trim()) return;
    try {
      await foldersApi.createFolderInvite(folderId, form);
      toast.success("Đã gửi lời mời.");
      setForm({ invitee_email: "", role: "viewer" });
      loadInvites();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tạo lời mời."));
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={createInvite} className="mb-4 grid gap-3 rounded-lg border border-line bg-canvas p-4 lg:grid-cols-[1fr_180px_auto] lg:items-end">
        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">Email</span>
          <input value={form.invitee_email} onChange={(event) => setForm({ ...form, invitee_email: event.target.value })} className="input-field" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">Quyền</span>
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="input-field">
            {folderRoles.map((role) => <option key={role} value={role}>{roleLabel[role] || role}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-primary">Gửi lời mời</button>
      </form>
      {loading ? (
        <div className="py-10 text-center text-sm text-ink-secondary">Đang tải lời mời...</div>
      ) : invites.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-ink-secondary">Không có lời mời đang chờ.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {invites.map((invite) => (
            <div key={invite.invite_id} className="grid gap-3 border-b border-line p-4 last:border-b-0 md:grid-cols-[1fr_120px_120px] md:items-center">
              <div>
                <p className="font-semibold text-ink">{invite.invitee_email || invite.invitee_user_id}</p>
                <p className="text-xs text-ink-secondary">Tạo ngày {formatDateToVN(invite.created_at)}</p>
              </div>
              <Badge>{roleLabel[invite.role] || invite.role}</Badge>
              <Badge>{invite.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SettingsPanel = ({ folder }: { folder: WorkspaceFolder }) => (
  <div className="space-y-4 p-4">
    <div className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-lg font-bold text-ink">Thông tin chung</h2>
      <p className="mt-2 text-sm text-ink-secondary">{folder.description || "Thư mục này chưa có mô tả."}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{folder.permission || "viewer"}</Badge>
        {folder.isShared && <Badge>Đang chia sẻ</Badge>}
      </div>
    </div>
  </div>
);

const FolderDetailPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const numericFolderId = Number(folderId);
  const routeTab = location.pathname.endsWith("/members") ? "members" : location.pathname.endsWith("/invites") ? "invites" : "documents";
  const activeTab = (searchParams.get("tab") || routeTab) as WorkspaceTab;
  const querySearch = searchParams.get("search") || "";
  const queryFileType = searchParams.get("fileType") || "";
  const pageNumber = Number(searchParams.get("pageNumber") || 1);

  const [folder, setFolder] = useState<WorkspaceFolder | null>(null);
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "updated_desc");
  const [fileType, setFileType] = useState(searchParams.get("fileType") || "");
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get("view") as ViewMode) || "grid");
  const [pagination, setPagination] = useState<WorkspacePagination>(defaultWorkspacePagination);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<WorkspaceItem | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const folderPermissions = getPermissions(folder);
  const visibleItems = useMemo(() => items, [items]);
  const selectedItems = useMemo(() => visibleItems.filter((item) => selectedKeys.includes(`${item.type}-${item.id}`)), [selectedKeys, visibleItems]);

  const loadFolder = async () => {
    if (!numericFolderId) {
      setError("Không tìm thấy thư mục.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await workspaceLibraryApi.getFolderItems(numericFolderId, {
        search: querySearch,
        sort,
        fileType: queryFileType,
        pageNumber,
        pageSize: 50,
      });
      setFolder(response.folder);
      setItems(response.items || []);
      setPagination(normalizeWorkspacePagination(response.pagination));
      setError("");
    } catch (error: any) {
      setError(apiMessage(error, "Không thể mở thư mục."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericFolderId, querySearch, queryFileType, pageNumber, sort]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && activeTab === "documents") {
        event.preventDefault();
        setSelectedKeys(visibleItems.map((item) => `${item.type}-${item.id}`));
      }
      if (event.key === "Escape") {
        setSelectedKeys([]);
        setPreviewItem(null);
        setDialog(null);
      }
      if (event.key === "Delete" && selectedItems.length > 0) {
        trashSelected();
      }
      if (event.key === "F2" && selectedItems.length === 1) {
        setDialog({ type: "rename", item: selectedItems[0] });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const setTab = (tab: WorkspaceTab) => {
    setSearchParams({ tab, ...(querySearch ? { search: querySearch } : {}), ...(queryFileType ? { fileType: queryFileType } : {}), view: viewMode, sort });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams({ tab: activeTab, ...(search.trim() ? { search: search.trim() } : {}), ...(fileType ? { fileType } : {}), view: viewMode, sort, pageNumber: "1" });
  };

  const toggleSelection = (item: WorkspaceItem) => {
    const key = `${item.type}-${item.id}`;
    setSelectedKeys((current) => current.includes(key) ? current.filter((itemKey) => itemKey !== key) : [...current, key]);
  };

  const closeDialogAndReload = () => {
    setDialog(null);
    setSelectedKeys([]);
    loadFolder();
  };

  const trashSelected = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Chuyển ${selectedItems.length} mục vào thùng rác?`)) return;
    try {
      const response = await workspaceLibraryApi.trashItems(toPayloadItems(selectedItems));
      if (response.failed?.length) toast.info(workspaceFailureMessage(response, "Một số mục chưa thể chuyển vào thùng rác."));
      else toast.success("Đã chuyển vào thùng rác.");
      closeDialogAndReload();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể xóa mục đã chọn."));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-ink-secondary">Đang tải thư mục...</p>
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div className="surface-card mx-auto max-w-xl p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-neutral" />
        <h1 className="mt-4 text-xl font-bold text-ink">Không thể mở thư mục</h1>
        <p className="mt-2 text-sm text-ink-secondary">{error}</p>
        <NavLink to="/library" className="btn-primary mt-6">Quay lại thư viện</NavLink>
      </div>
    );
  }

  return (
    <>
      <PageTitle title={folder.name} description={folder.description || "Thư mục DocShare"} />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <FolderWorkspaceSidebar
            folder={folder}
            activeTab={activeTab}
            onTab={setTab}
            onCreate={() => setDialog({ type: "create-folder" })}
            onUpload={() => setDialog({ type: "upload" })}
            onShare={() => setDialog({ type: "share", item: { id: folder.id || numericFolderId, type: "folder", name: folder.name, permissions: folder.permissions } as WorkspaceItem })}
          />

          <section className="relative overflow-hidden rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-4 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
                    {(folder.breadcrumb || [{ id: null, name: "Tài liệu của tôi", href: "/library" }, { id: folder.id, name: folder.name }]).map((crumb, index, arr) => (
                      <React.Fragment key={`${crumb.id}-${crumb.name}`}>
                        {crumb.href ? (
                          <NavLink to={crumb.href.replace("/documents/my", "/library").replace("/documents/folders", "/library/folders")} className="hover:text-primary">{crumb.name}</NavLink>
                        ) : (
                          <span className="font-semibold text-ink">{crumb.name}</span>
                        )}
                        {index < arr.length - 1 && <span>/</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold text-ink">{folder.name}</h1>
                    <Badge>{folder.permission || "viewer"}</Badge>
                    {folder.isShared && <Badge>Đang chia sẻ</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-ink-secondary">
                    {visibleItems.length} mục · {visibleItems.filter((item) => item.type === "folder").length} thư mục · {visibleItems.filter((item) => item.type === "document").length} tài liệu
                  </p>
                </div>
              </div>

              {activeTab === "documents" && (
                <form onSubmit={submitSearch} className="mt-4 flex max-w-3xl flex-col gap-2 sm:flex-row">
                  <label className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field pl-9" placeholder="Tìm trong thư mục hiện tại" />
                  </label>
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setSearchParams({ tab: activeTab, ...(querySearch ? { search: querySearch } : {}), ...(queryFileType ? { fileType: queryFileType } : {}), view: viewMode, sort: event.target.value, pageNumber: "1" });
                    }}
                    className="input-field sm:w-44"
                  >
                    <option value="updated_desc">Mới nhất</option>
                    <option value="updated_asc">Cũ nhất</option>
                    <option value="name_asc">Tên A-Z</option>
                    <option value="name_desc">Tên Z-A</option>
                    <option value="type">Loại</option>
                    <option value="size_desc">Kích thước</option>
                  </select>
                  <select value={fileType} onChange={(event) => setFileType(event.target.value)} className="input-field sm:w-40">
                    <option value="">Tất cả loại</option>
                    <option value="pdf">PDF</option>
                    <option value="docx">Word</option>
                    <option value="xlsx">Excel</option>
                    <option value="image">Ảnh</option>
                  </select>
                  <button type="submit" className="btn-secondary px-3">Tìm</button>
                </form>
              )}
            </div>

            {activeTab === "documents" && (
              <>
                <DocumentsToolbar
                  selectedItems={selectedItems}
                  folderPermissions={folderPermissions}
                  viewMode={viewMode}
                  onViewMode={(mode) => {
                    setViewMode(mode);
                    setSearchParams({ tab: activeTab, ...(querySearch ? { search: querySearch } : {}), view: mode, sort });
                  }}
                  onClear={() => setSelectedKeys([])}
                  onCreate={() => setDialog({ type: "create-folder" })}
                  onUpload={() => setDialog({ type: "upload" })}
                  onRename={() => selectedItems.length === 1 && setDialog({ type: "rename", item: selectedItems[0] })}
                  onMove={() => setDialog({ type: "move", mode: "move", items: selectedItems })}
                  onCopy={() => setDialog({ type: "move", mode: "copy", items: selectedItems })}
                  onMerge={() => setDialog({ type: "merge", items: selectedItems })}
                  onShare={() => selectedItems.length === 1 && setDialog({ type: "share", item: selectedItems[0] })}
                  onTrash={trashSelected}
                />
                <div className={`p-4`}>
                  {visibleItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line bg-surface px-5 py-14 text-center">
                      <Folder className="mx-auto h-10 w-10 text-neutral" />
                      <h2 className="mt-4 text-lg font-bold text-ink">Thư mục này đang trống</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">Tải file lên hoặc tạo thư mục con đầu tiên.</p>
                      {(folderPermissions.canUpload || folderPermissions.canCreateFolder) && (
                        <div className="mt-6 flex justify-center">
                          <WorkspaceCreateDropdown
                            canUpload={folderPermissions.canUpload !== false}
                            canCreateFolder={folderPermissions.canCreateFolder !== false}
                            onUpload={() => setDialog({ type: "upload" })}
                            onCreateFolder={() => setDialog({ type: "create-folder" })}
                          />
                        </div>
                      )}
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {visibleItems.map((item) => (
                        <WorkspaceItemCard
                          key={`${item.type}-${item.id}`}
                          item={item}
                          selected={selectedKeys.includes(`${item.type}-${item.id}`)}
                          onSelect={() => toggleSelection(item)}
                          onPreview={() => setPreviewItem(item)}
                          onMenu={() => {
                            setSelectedKeys([`${item.type}-${item.id}`]);
                            setDialog({ type: "share", item });
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <WorkspaceItemList
                      items={visibleItems}
                      selectedKeys={selectedKeys}
                      onToggle={toggleSelection}
                      onPreview={setPreviewItem}
                      onMenu={(item) => {
                        setSelectedKeys([`${item.type}-${item.id}`]);
                        setDialog({ type: "share", item });
                      }}
                    />
                  )}
                  <PaginationComponent
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalCount={pagination.totalCount}
                    onPageChange={(nextPage) =>
                      setSearchParams({
                        tab: activeTab,
                        ...(querySearch ? { search: querySearch } : {}),
                        ...(queryFileType ? { fileType: queryFileType } : {}),
                        view: viewMode,
                        sort,
                        pageNumber: String(nextPage),
                      })
                    }
                  />
                </div>
                <PreviewDrawer item={previewItem} onClose={() => setPreviewItem(null)} onShare={(item) => setDialog({ type: "share", item })} />
              </>
            )}

            {activeTab === "members" && <MembersPanel folderId={numericFolderId} />}
            {activeTab === "invites" && <InvitesPanel folderId={numericFolderId} />}
            {activeTab === "settings" && <SettingsPanel folder={folder} />}
          </section>
        </div>
      </div>

      {dialog?.type === "create-folder" && <CreateFolderDialog parentFolderId={numericFolderId} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "upload" && <UploadDialog parentFolderId={numericFolderId} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "rename" && <RenameDialog item={dialog.item} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "move" && <MoveCopyDialog mode={dialog.mode} items={dialog.items} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "merge" && <MergeDialog items={dialog.items} parentFolderId={numericFolderId} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "share" && <ShareDialog item={dialog.item} onClose={() => setDialog(null)} />}
    </>
  );
};

export default FolderDetailPage;
