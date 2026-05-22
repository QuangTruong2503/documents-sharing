import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import {
  Check,
  Clock3,
  Copy,
  Download,
  Eye,
  File,
  FileText,
  Folder,
  FolderOpen,
  Grid3X3,
  Heart,
  Image,
  Link2,
  List,
  MoreHorizontal,
  MoveRight,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  Star,
  Table,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import PageTitle from "components/PageTitle.js";
import workspaceLibraryApi, {
  WorkspaceFolder,
  WorkspaceItem,
  WorkspaceItemType,
  WorkspacePermissions,
} from "api/workspaceLibraryApi.ts";
import PaginationComponent from "components/Pagination/Pagination.tsx";
import WorkspaceCreateDropdown from "components/Workspace/WorkspaceCreateDropdown.tsx";
import WorkspaceConfirmDialog from "components/Workspace/WorkspaceConfirmDialog.tsx";
import WorkspaceLoadingSkeleton from "components/Workspace/WorkspaceLoadingSkeleton.tsx";
import { formatDateToVN } from "utils/formatDateToVN";
import {
  canEvery,
  defaultWorkspacePagination,
  downloadWorkspaceDocument,
  normalizeWorkspacePagination,
  toDateTimeLocalValue,
  workspaceBatchMessage,
  WorkspacePagination,
  workspaceFailureMessage,
} from "utils/workspaceLibraryHelpers.ts";
import { copyTextToClipboard, copyWorkspaceItemLink } from "utils/workspaceItemLinks.ts";
import { apiMessage } from "pages/Folders/FolderListPage.tsx";

type ViewMode = "grid" | "list";
type LibraryArea = "my" | "shared" | "team" | "recent" | "favorites" | "shared-links" | "trash";
type ConfirmActionState =
  | {
      title: string;
      message: string;
      confirmLabel: string;
      variant?: "danger" | "primary";
      onConfirm: () => Promise<void>;
    }
  | null;
type DialogState =
  | { type: "create-folder" }
  | { type: "upload" }
  | { type: "rename"; item: WorkspaceItem }
  | { type: "move"; mode: "move" | "copy"; items: WorkspaceItem[] }
  | { type: "merge"; items: WorkspaceItem[] }
  | { type: "share"; item: WorkspaceItem }
  | null;

interface WorkspaceListResponse {
  folder?: WorkspaceFolder;
  items?: WorkspaceItem[];
  pagination?: WorkspacePagination;
  counts?: Record<string, number>;
  storage?: { usedBytes?: number; limitBytes?: number };
  message?: string;
}

interface ShareLinkRow {
  id: string;
  itemId: number;
  itemType: WorkspaceItemType;
  itemName?: string | null;
  shareUrl: string;
  access: string;
  permission: string;
  views?: number;
  downloads?: number;
  expiresAt?: string | null;
  createdAt?: string;
}

const navItems = [
  { key: "my", label: "Tài liệu của tôi", icon: FolderOpen, href: "/library" },
  { key: "shared", label: "Được chia sẻ với tôi", icon: Users, href: "/library?area=shared" },
  { key: "team", label: "Thư viện nhóm", icon: Folder, href: "/library?area=team" },
  { key: "recent", label: "Gần đây", icon: Clock3, href: "/library?area=recent" },
  { key: "favorites", label: "Yêu thích", icon: Star, href: "/library?area=favorites" },
  { key: "shared-links", label: "Liên kết đã chia sẻ", icon: Link2, href: "/library?area=shared-links" },
  { key: "trash", label: "Thùng rác", icon: Trash2, href: "/library?area=trash" },
];

const fileIconMap: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: Table,
  xlsx: Table,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
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

const getItemName = (item: WorkspaceItem) => item.title || item.name || `${item.type} #${item.id}`;
const getExtension = (item: WorkspaceItem) => (item.extension || item.mimeType || "file").replace(".", "").toLowerCase();
const getPermissions = (item?: WorkspaceItem | WorkspaceFolder | null) => ({ ...defaultPermissions, ...(item?.permissions || {}) });
const toPayloadItems = (items: WorkspaceItem[]) => items.map((item) => ({ id: item.id, type: item.type }));

const formatSize = (size?: number) => {
  if (!size) return "--";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 B";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const EmptyState = ({ area, canCreate, canUpload, onCreate, onUpload }: { area: LibraryArea; canCreate: boolean; canUpload: boolean; onCreate: () => void; onUpload: () => void }) => {
  const copy =
    area === "trash"
      ? ["Thùng rác đang trống", "Các tài liệu đã xóa sẽ xuất hiện ở đây."]
      : area === "shared"
        ? ["Chưa có nội dung được chia sẻ", "Folder hoặc tài liệu được mời truy cập sẽ nằm tại đây."]
        : area === "shared-links"
          ? ["Chưa có liên kết chia sẻ", "Các link bạn tạo sẽ xuất hiện ở đây."]
          : ["Thư mục này đang trống", "Kéo thả file vào đây hoặc tạo thư mục đầu tiên."];

  return (
    <div className="rounded-lg border border-dashed border-line bg-surface px-5 py-14 text-center">
      <FolderOpen className="mx-auto h-10 w-10 text-neutral" />
      <h2 className="mt-4 text-lg font-bold text-ink">{copy[0]}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">{copy[1]}</p>
      {(canCreate || canUpload) && (
        <div className="mt-6 flex justify-center">
          <WorkspaceCreateDropdown
            canUpload={canUpload}
            canCreateFolder={canCreate}
            onUpload={onUpload}
            onCreateFolder={onCreate}
          />
        </div>
      )}
    </div>
  );
};

const LibrarySidebar = ({
  activeArea,
  counts,
  storage,
}: {
  activeArea: string;
  counts: Record<string, number>;
  storage: { usedBytes?: number; limitBytes?: number };
}) => {
  const storagePercent = storage.limitBytes ? Math.min(100, Math.round(((storage.usedBytes || 0) / storage.limitBytes) * 100)) : 0;

  return (
    <aside className="rounded-lg border border-line bg-surface p-3 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
          <FolderOpen className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">DocShare</p>
          <p className="text-xs text-ink-secondary">File workspace</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeArea === item.key;
          return (
            <NavLink
              key={item.key}
              to={item.href}
              className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-primary-soft text-primary" : "text-ink-secondary hover:bg-canvas hover:text-ink"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {counts[item.key] > 0 && <span className="text-xs">{counts[item.key]}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 rounded-md border border-line bg-canvas p-3">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary">
          <span>Dung lượng</span>
          <span>{storagePercent}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-line">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${storagePercent}%` }} />
        </div>
        <p className="mt-2 text-xs text-ink-secondary">
          Đang dùng {formatBytes(storage.usedBytes)} / {formatBytes(storage.limitBytes)}
        </p>
      </div>
    </aside>
  );
};

const WorkspaceToolbar = ({
  selectedItems,
  area,
  folderPermissions,
  viewMode,
  onViewMode,
  onClear,
  onCreate,
  onUpload,
  onRename,
  onMove,
  onCopy,
  onCopyLink,
  onMerge,
  onShare,
  onFavorite,
  onTrash,
  onRestore,
  onDeleteForever,
}: {
  selectedItems: WorkspaceItem[];
  area: LibraryArea;
  folderPermissions: WorkspacePermissions;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  onClear: () => void;
  onCreate: () => void;
  onUpload: () => void;
  onRename: () => void;
  onMove: () => void;
  onCopy: () => void;
  onCopyLink: () => void;
  onMerge: () => void;
  onShare: () => void;
  onFavorite: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}) => {
  const selectedCount = selectedItems.length;
  const single = selectedCount === 1;
  const allDocuments = selectedItems.length > 0 && selectedItems.every((item) => item.type === "document");
  const canRename = single && selectedItems[0].permissions?.canRename !== false;
  const canMove = canEvery(selectedItems, "canMove");
  const canCopy = canEvery(selectedItems, "canCopy");
  const canShare = single && selectedItems[0].permissions?.canShare !== false;
  const canDelete = canEvery(selectedItems, "canDelete");

  return (
    <div className="flex flex-col gap-3 border-b border-line bg-surface px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">{selectedCount} mục đã chọn</span>
          {area === "trash" ? (
            <>
              <button type="button" onClick={onRestore} className="btn-secondary px-3 py-2">
                <RotateCcw className="mr-2 h-4 w-4" />
                Khôi phục
              </button>
              <button type="button" onClick={onDeleteForever} disabled={!canDelete} className="btn-secondary border-danger px-3 py-2 text-danger hover:border-danger hover:text-danger">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa vĩnh viễn
              </button>
            </>
          ) : (
            <>
              {single && (
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
              {single && (
                <button type="button" onClick={onCopyLink} className="btn-secondary px-3 py-2">
                  <Link2 className="mr-2 h-4 w-4" />
                  Copy link
                </button>
              )}
              {allDocuments && selectedCount > 1 && (
                <button type="button" onClick={onMerge} className="btn-secondary px-3 py-2">
                  <Folder className="mr-2 h-4 w-4" />
                  Gom vào thư mục
                </button>
              )}
              {single && (
                <button type="button" onClick={onShare} disabled={!canShare} className="btn-secondary px-3 py-2">
                  <Share2 className="mr-2 h-4 w-4" />
                  Chia sẻ
                </button>
              )}
              {single && (
                <button type="button" onClick={onFavorite} className="btn-secondary px-3 py-2">
                  <Heart className="mr-2 h-4 w-4" />
                  Yêu thích
                </button>
              )}
              <button type="button" onClick={onTrash} disabled={!canDelete} className="btn-secondary border-danger px-3 py-2 text-danger hover:border-danger hover:text-danger">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </button>
            </>
          )}
          <button type="button" onClick={onClear} className="btn-secondary px-3 py-2" title="Bỏ chọn">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <></>
        </div>
      )}
      <div className="inline-flex w-fit rounded-md border border-line bg-canvas p-1">
        <button
          type="button"
          onClick={() => onViewMode("grid")}
          className={`rounded px-2.5 py-2 ${viewMode === "grid" ? "bg-surface text-primary shadow-sm" : "text-ink-secondary"}`}
          title="Xem dạng lưới"
          aria-label="Xem dạng lưới"
          aria-pressed={viewMode === "grid"}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewMode("list")}
          className={`rounded px-2.5 py-2 ${viewMode === "list" ? "bg-surface text-primary shadow-sm" : "text-ink-secondary"}`}
          title="Xem dạng danh sách"
          aria-label="Xem dạng danh sách"
          aria-pressed={viewMode === "list"}
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const ItemActionDropdown = ({
  item,
  area,
  onCopyLink,
  onRename,
  onMove,
  onTrash,
  onRestore,
  onDeleteForever,
}: {
  item: WorkspaceItem;
  area: LibraryArea;
  onCopyLink: () => void;
  onRename: () => void;
  onMove: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}) => {
  const permissions = getPermissions(item);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-surface/95 text-ink-secondary hover:text-primary"
        title="Thao tác"
        aria-label={`Mở thao tác cho ${getItemName(item)}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-card" role="menu">
        {area === "trash" ? (
          <>
            <button type="button" onClick={() => runAction(onRestore)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary" role="menuitem">
              <RotateCcw className="h-4 w-4" />
              Khôi phục
            </button>
            <button type="button" onClick={() => runAction(onDeleteForever)} disabled={permissions.canDelete === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 disabled:pointer-events-none disabled:opacity-40" role="menuitem">
              <Trash2 className="h-4 w-4" />
              Xóa vĩnh viễn
            </button>
          </>
        ) : (
          <>
        <button type="button" onClick={() => runAction(onCopyLink)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary" role="menuitem">
          <Link2 className="h-4 w-4" />
          Copy link
        </button>
        <button type="button" onClick={() => runAction(onRename)} disabled={permissions.canRename === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary disabled:pointer-events-none disabled:opacity-40" role="menuitem">
          <Pencil className="h-4 w-4" />
          Đổi tên
        </button>
        <button type="button" onClick={() => runAction(onMove)} disabled={permissions.canMove === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary disabled:pointer-events-none disabled:opacity-40" role="menuitem">
          <MoveRight className="h-4 w-4" />
          Di chuyển
        </button>
        <button type="button" onClick={() => runAction(onTrash)} disabled={permissions.canDelete === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 disabled:pointer-events-none disabled:opacity-40" role="menuitem">
          <Trash2 className="h-4 w-4" />
          Xóa
        </button>
          </>
        )}
      </div>}
    </div>
  );
};

const WorkspaceItemCard = ({
  item,
  area,
  selected,
  onSelect,
  onPreview,
  onCopyLink,
  onRename,
  onMove,
  onTrash,
  onRestore,
  onDeleteForever,
}: {
  item: WorkspaceItem;
  area: LibraryArea;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onCopyLink: () => void;
  onRename: () => void;
  onMove: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}) => {
  const isFolder = item.type === "folder";
  const isTrash = area === "trash";
  const ext = getExtension(item);
  const Icon = isFolder ? Folder : fileIconMap[ext] || File;

  return (
    <article className={`group rounded-lg border bg-surface transition hover:-translate-y-0.5 hover:shadow-card ${selected ? "border-primary ring-2 ring-primary/20" : "border-line"}`}>
      <div className="relative">
        <button
          type="button"
          onClick={onSelect}
          className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border ${
            selected ? "border-primary bg-primary text-white" : "border-line bg-surface/95 text-ink-secondary hover:text-primary"
          } ${selected ? "opacity-100" : "opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"}`}
          aria-label={selected ? "Bỏ chọn mục" : "Chọn mục"}
        >
          {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
        </button>
        <div className="absolute right-3 top-3 z-20 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <ItemActionDropdown item={item} area={area} onCopyLink={onCopyLink} onRename={onRename} onMove={onMove} onTrash={onTrash} onRestore={onRestore} onDeleteForever={onDeleteForever} />
        </div>
        {isFolder && !isTrash ? (
          <NavLink to={`/library/folders/${item.id}`} className="flex h-36 items-center justify-center bg-primary-soft">
            <Icon className="h-14 w-14 text-primary" />
          </NavLink>
        ) : isFolder ? (
          <div className="flex h-36 items-center justify-center bg-primary-soft">
            <Icon className="h-14 w-14 text-primary" />
          </div>
        ) : (
          <button type="button" onClick={isTrash ? onSelect : onPreview} className="flex h-36 w-full items-center justify-center overflow-hidden bg-canvas text-left">
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
          {isFolder && !isTrash ? (
            <NavLink to={`/library/folders/${item.id}`} className="line-clamp-1 min-w-0 flex-1 font-bold text-ink hover:text-primary">
              {getItemName(item)}
            </NavLink>
          ) : isFolder ? (
            <button type="button" onClick={onSelect} className="line-clamp-1 min-w-0 flex-1 text-left font-bold text-ink hover:text-primary">
              {getItemName(item)}
            </button>
          ) : (
            <button type="button" onClick={isTrash ? onSelect : onPreview} className="line-clamp-1 min-w-0 flex-1 text-left font-bold text-ink hover:text-primary">
              {getItemName(item)}
            </button>
          )}
          {item.isFavorite && <Star className="h-4 w-4 shrink-0 fill-warning text-warning" />}
        </div>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-ink-secondary">
          {isFolder ? item.description || `${item.childrenCount ?? 0} mục` : item.description || "Không có mô tả."}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-ink-secondary">
          <span>{isFolder ? `${item.folderCount ?? 0} thư mục · ${item.documentCount ?? 0} file` : `${ext.toUpperCase()} · ${formatSize(item.size)}`}</span>
          <span>{isTrash ? (item.trashedAt ? formatDateToVN(item.trashedAt) : "--") : item.updatedAt ? formatDateToVN(item.updatedAt) : ""}</span>
        </div>
      </div>
    </article>
  );
};

const WorkspaceItemList = ({
  items,
  area,
  selectedIds,
  onToggle,
  onPreview,
  onCopyLink,
  onRename,
  onMove,
  onTrash,
  onRestore,
  onDeleteForever,
}: {
  items: WorkspaceItem[];
  area: LibraryArea;
  selectedIds: string[];
  onToggle: (item: WorkspaceItem) => void;
  onPreview: (item: WorkspaceItem) => void;
  onCopyLink: (item: WorkspaceItem) => void;
  onRename: (item: WorkspaceItem) => void;
  onMove: (item: WorkspaceItem) => void;
  onTrash: (item: WorkspaceItem) => void;
  onRestore: (item: WorkspaceItem) => void;
  onDeleteForever: (item: WorkspaceItem) => void;
}) => (
  <div className="overflow-x-auto rounded-lg border border-line bg-surface">
    <div className="grid min-w-[800px] grid-cols-[44px_1fr_120px_120px_150px_88px] gap-3 border-b border-line px-4 py-3 text-xs font-semibold uppercase text-ink-secondary">
      <span />
      <span>Tên</span>
      <span>Loại</span>
      <span>Kích thước</span>
      <span>{area === "trash" ? "Đã xóa" : "Cập nhật"}</span>
      <span />
    </div>
    {items.map((item) => {
      const selected = selectedIds.includes(`${item.type}-${item.id}`);
      const Icon = item.type === "folder" ? Folder : fileIconMap[getExtension(item)] || File;
      return (
        <div key={`${item.type}-${item.id}`} className="group grid min-w-[800px] grid-cols-[44px_1fr_120px_120px_150px_88px] gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-canvas">
          <button
            type="button"
            onClick={() => onToggle(item)}
            className={`flex h-8 w-8 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary text-white opacity-100" : "border-line text-ink-secondary opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"}`}
            aria-label={selected ? "Bỏ chọn mục" : "Chọn mục"}
          >
            {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {item.type === "folder" && area !== "trash" ? (
              <NavLink to={`/library/folders/${item.id}`} className="truncate font-semibold text-ink hover:text-primary">
                {getItemName(item)}
              </NavLink>
            ) : item.type === "folder" ? (
              <button type="button" onClick={() => onToggle(item)} className="truncate text-left font-semibold text-ink hover:text-primary">
                {getItemName(item)}
              </button>
            ) : (
              <button type="button" onClick={() => area === "trash" ? onToggle(item) : onPreview(item)} className="truncate text-left font-semibold text-ink hover:text-primary">
                {getItemName(item)}
              </button>
            )}
          </div>
          <span className="self-center text-sm text-ink-secondary">{item.type === "folder" ? "Folder" : getExtension(item).toUpperCase()}</span>
          <span className="self-center text-sm text-ink-secondary">{item.type === "folder" ? formatSize(item.totalSize) : formatSize(item.size)}</span>
          <span className="self-center text-sm text-ink-secondary">{area === "trash" ? (item.trashedAt ? formatDateToVN(item.trashedAt) : "--") : item.updatedAt ? formatDateToVN(item.updatedAt) : "--"}</span>
          <div className="flex items-center justify-end opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
            <ItemActionDropdown item={item} area={area} onCopyLink={() => onCopyLink(item)} onRename={() => onRename(item)} onMove={() => onMove(item)} onTrash={() => onTrash(item)} onRestore={() => onRestore(item)} onDeleteForever={() => onDeleteForever(item)} />
          </div>
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
    workspaceLibraryApi
      .getDocumentPreview(item.id)
      .then((response) => setPreview(response))
      .catch(() => setPreview(null));
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
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line bg-surface shadow-card lg:inset-y-0 lg:right-0">
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
          <div>
            <dt className="font-semibold text-ink">Trạng thái</dt>
            <dd className="mt-1 text-ink-secondary">{document.status || "ready"}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
};

const CreateFolderDialog = ({ parentFolderId, onClose, onDone }: { parentFolderId: number | null; onClose: () => void; onDone: () => void }) => {
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await workspaceLibraryApi.createFolder({
        name: form.name.trim(),
        description: form.description.trim(),
        parentFolderId,
        color: null,
      });
      toast.success("Đã tạo thư mục.");
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tạo thư mục."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Tạo thư mục</h2>
        <p className="mt-1 text-sm text-ink-secondary">{parentFolderId ? "Thư mục mới sẽ nằm trong folder hiện tại." : "Thư mục mới sẽ nằm ở thư viện gốc."}</p>
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

const UploadDialog = ({ parentFolderId, onClose, onDone }: { parentFolderId: number | null; onClose: () => void; onDone: () => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length === 0) return;
    setUploading(true);
    try {
      const response = await workspaceLibraryApi.uploadDocuments(files, parentFolderId);
      if (response.failed?.length) {
        toast.warning(`${response.documents?.length || 0} file tải lên thành công, ${response.failed.length} file lỗi.`);
      } else {
        toast.success("Đã tải file lên.");
      }
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
        <h2 className="text-xl font-bold text-ink">Tải tài liệu</h2>
        <p className="mt-1 text-sm text-ink-secondary">{parentFolderId ? "File sẽ được tải vào folder hiện tại." : "File sẽ được tải vào thư viện gốc."}</p>
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

const MoveCopyDialog = ({
  mode,
  items,
  onClose,
  onDone,
}: {
  mode: "move" | "copy";
  items: WorkspaceItem[];
  onClose: () => void;
  onDone: () => void;
}) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    workspaceLibraryApi
      .getFolderTree({ root: "my", includeShared: true })
      .then((response) => setNodes(response.nodes || []))
      .catch((error) => toast.error(apiMessage(error, "Không tải được cây thư mục.")));
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
      if (response.failed?.length) {
        toast.info(workspaceFailureMessage(response, "Một số mục chưa xử lý được."));
      } else {
        toast.success(mode === "move" ? "Đã di chuyển." : "Đã sao chép.");
      }
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

const MergeDialog = ({ items, parentFolderId, onClose, onDone }: { items: WorkspaceItem[]; parentFolderId: number | null; onClose: () => void; onDone: () => void }) => {
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
        <h2 className="text-xl font-bold text-ink">Gom vào thư mục</h2>
        <p className="mt-1 text-sm text-ink-secondary">{items.length} tài liệu sẽ được chuyển vào folder mới.</p>
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
  const [form, setForm] = useState({
    access: "anyone_with_link",
    permission: "viewer",
    allowDownload: true,
    password: "",
    expiresAt: "",
  });

  useEffect(() => {
    workspaceLibraryApi
      .getShareLinkSettings({ itemId: item.id, itemType: item.type })
      .then((response) => {
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
      })
      .catch(() => undefined);
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
    await copyTextToClipboard(settings.shareUrl);
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
        <div className="mt-5 rounded-md border border-line bg-canvas p-3 text-sm text-ink-secondary">
          {settings?.shareUrl || "Chưa có link. Bấm tạo link để lấy liên kết."}
        </div>
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

const SharedLinksView = ({ rows }: { rows: ShareLinkRow[] }) => {
  if (rows.length === 0) {
    return <EmptyState area="shared-links" canCreate={false} canUpload={false} onCreate={() => undefined} onUpload={() => undefined} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <div className="grid min-w-[760px] grid-cols-[1fr_120px_110px_110px_170px] gap-3 border-b border-line px-4 py-3 text-xs font-semibold uppercase text-ink-secondary">
        <span>Tên</span>
        <span>Loại</span>
        <span>Lượt xem</span>
        <span>Tải xuống</span>
        <span>Tạo ngày</span>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="grid min-w-[760px] grid-cols-[1fr_120px_110px_110px_170px] gap-3 border-b border-line px-4 py-3 last:border-b-0">
          <a href={row.shareUrl} target="_blank" rel="noreferrer" className="truncate font-semibold text-ink hover:text-primary">
            {row.itemName || row.shareUrl}
          </a>
          <span className="text-sm text-ink-secondary">{row.itemType}</span>
          <span className="text-sm text-ink-secondary">{row.views ?? 0}</span>
          <span className="text-sm text-ink-secondary">{row.downloads ?? 0}</span>
          <span className="text-sm text-ink-secondary">{row.createdAt ? formatDateToVN(row.createdAt) : "--"}</span>
        </div>
      ))}
    </div>
  );
};

const MyLibraryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const area = (searchParams.get("area") || (searchParams.get("tab") === "shared" ? "shared" : "my")) as LibraryArea;
  const defaultSort = area === "trash" ? "deleted_desc" : "updated_desc";
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || defaultSort);
  const [fileType, setFileType] = useState(searchParams.get("fileType") || "");
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get("view") as ViewMode) || "grid");
  const [folder, setFolder] = useState<WorkspaceFolder | null>(null);
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLinkRow[]>([]);
  const [pagination, setPagination] = useState<WorkspacePagination>(defaultWorkspacePagination);
  const [workspaceCounts, setWorkspaceCounts] = useState<Record<string, number>>({});
  const [storage, setStorage] = useState<{ usedBytes?: number; limitBytes?: number }>({});
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<WorkspaceItem | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const querySearch = searchParams.get("search") || "";
  const queryFileType = searchParams.get("fileType") || "";
  const pageNumber = Number(searchParams.get("pageNumber") || 1);
  const folderPermissions = getPermissions(folder);

  useEffect(() => {
    const nextSort = searchParams.get("sort") || (area === "trash" ? "deleted_desc" : "updated_desc");
    setSort((current) => (current === nextSort ? current : nextSort));
  }, [area, searchParams]);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const params = { search: querySearch, sort, ...(area !== "trash" ? { fileType: queryFileType } : {}), pageNumber, pageSize: 50 };
      if (area === "shared-links") {
        const response = await workspaceLibraryApi.getMyShareLinks(params);
        setShareLinks(response.shareLinks || []);
        setPagination(normalizeWorkspacePagination(response.pagination));
        setItems([]);
        setFolder(null);
        setWorkspaceCounts({});
        setStorage({});
        return;
      }

      const response: WorkspaceListResponse =
        area === "shared"
          ? await workspaceLibraryApi.getSharedWithMe(params)
          : area === "recent"
            ? await workspaceLibraryApi.getRecent(params)
            : area === "favorites"
              ? await workspaceLibraryApi.getFavorites(params)
              : area === "trash"
                ? await workspaceLibraryApi.getTrash(params)
                : area === "team"
                  ? await workspaceLibraryApi.getTeam(params)
                  : await workspaceLibraryApi.getMyLibrary(params);

      setFolder(response.folder || null);
      setItems(response.items || []);
      setShareLinks([]);
      setPagination(normalizeWorkspacePagination(response.pagination));
      setWorkspaceCounts(response.counts || {});
      setStorage(response.storage || {});
      if (response.message) toast.info(response.message);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không tải được thư viện."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, querySearch, queryFileType, pageNumber, sort]);

  const visibleItems = useMemo(() => items, [items]);
  const selectedItems = useMemo(
    () => visibleItems.filter((item) => selectedKeys.includes(`${item.type}-${item.id}`)),
    [selectedKeys, visibleItems]
  );
  const activeLabel = navItems.find((item) => item.key === area)?.label || "Tài liệu của tôi";
  const canCreate = area === "my";

  const counts = {
    my: (workspaceCounts.folders || 0) + (workspaceCounts.documents || 0),
    shared: workspaceCounts.shared || 0,
    recent: area === "recent" ? visibleItems.length : 0,
    favorites: workspaceCounts.favorites || 0,
    "shared-links": shareLinks.length,
    trash: workspaceCounts.trash || 0,
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && area !== "shared-links") {
        event.preventDefault();
        setSelectedKeys(visibleItems.map((item) => `${item.type}-${item.id}`));
      }
      if (event.key === "Escape") {
        setSelectedKeys([]);
        setPreviewItem(null);
        setDialog(null);
        setConfirmAction(null);
      }
      if (event.key === "/" && document.activeElement !== searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Delete" && selectedItems.length > 0 && area !== "trash") {
        trashSelected();
      }
      if (event.key === "F2" && selectedItems.length === 1) {
        setDialog({ type: "rename", item: selectedItems[0] });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const setQuery = (next: Record<string, string>) => {
    setSearchParams({ area, view: viewMode, sort, ...(querySearch ? { search: querySearch } : {}), ...(area !== "trash" && queryFileType ? { fileType: queryFileType } : {}), ...next });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams({ area, ...(search.trim() ? { search: search.trim() } : {}), ...(area !== "trash" && fileType ? { fileType } : {}), view: viewMode, sort, pageNumber: "1" });
  };

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    setQuery({ view: mode });
  };

  const changeSort = (value: string) => {
    setSort(value);
    setSearchParams({ area, ...(querySearch ? { search: querySearch } : {}), ...(area !== "trash" && queryFileType ? { fileType: queryFileType } : {}), view: viewMode, sort: value, pageNumber: "1" });
  };

  const toggleSelection = (item: WorkspaceItem) => {
    const key = `${item.type}-${item.id}`;
    setSelectedKeys((current) => current.includes(key) ? current.filter((itemKey) => itemKey !== key) : [...current, key]);
  };

  const closeDialogAndReload = () => {
    setDialog(null);
    setSelectedKeys([]);
    loadLibrary();
  };

  const openSingleAction = (type: "rename" | "share") => {
    if (selectedItems.length !== 1) return;
    setDialog({ type, item: selectedItems[0] } as DialogState);
  };

  const copyItemLink = async (item: WorkspaceItem) => {
    try {
      await copyWorkspaceItemLink(item);
      toast.success(`Đã sao chép link ${item.type === "folder" ? "thư mục" : "tài liệu"}.`);
    } catch {
      toast.error("Không thể sao chép link.");
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const performTrashItems = async (itemsToTrash: WorkspaceItem[]) => {
    if (itemsToTrash.length === 0) return;
    try {
      const response = await workspaceLibraryApi.trashItems(toPayloadItems(itemsToTrash));
      if (response.failed?.length) {
        toast.info(workspaceBatchMessage(response, "trashed", "Đã chuyển vào thùng rác.", "Một số mục chưa thể chuyển vào thùng rác."));
      } else {
        toast.success("Đã chuyển vào thùng rác.");
      }
      closeDialogAndReload();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể xóa mục đã chọn."));
    }
  };

  const trashItems = (itemsToTrash: WorkspaceItem[]) => {
    if (itemsToTrash.length === 0) return;
    setConfirmAction({
      title: "Chuyển vào thùng rác?",
      message: `${itemsToTrash.length} mục sẽ được chuyển vào thùng rác. Bạn có thể khôi phục lại trong mục Thùng rác.`,
      confirmLabel: "Chuyển vào thùng rác",
      onConfirm: () => performTrashItems(itemsToTrash),
    });
  };

  const trashSelected = () => trashItems(selectedItems);
  const restoreItems = async (itemsToRestore: WorkspaceItem[]) => {
    if (itemsToRestore.length === 0) return;
    try {
      const response = await workspaceLibraryApi.restoreItems(toPayloadItems(itemsToRestore));
      if (response.failed?.length) toast.info(workspaceBatchMessage(response, "restored", "Đã khôi phục.", "Một số mục chưa thể khôi phục."));
      else toast.success("Đã khôi phục.");
      closeDialogAndReload();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể khôi phục."));
    }
  };

  const performDeleteForeverItems = async (itemsToDelete: WorkspaceItem[]) => {
    if (itemsToDelete.length === 0) return;
    try {
      const response = await workspaceLibraryApi.deleteItemsForever(toPayloadItems(itemsToDelete));
      if (response.failed?.length) toast.info(workspaceBatchMessage(response, "deleted", "Đã xóa vĩnh viễn.", "Một số mục chưa thể xóa vĩnh viễn."));
      else toast.success("Đã xóa vĩnh viễn.");
      closeDialogAndReload();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể xóa vĩnh viễn."));
    }
  };

  const deleteForeverItems = (itemsToDelete: WorkspaceItem[]) => {
    if (itemsToDelete.length === 0) return;
    setConfirmAction({
      title: "Xóa vĩnh viễn?",
      message: `${itemsToDelete.length} mục sẽ bị xóa vĩnh viễn và không thể khôi phục.`,
      confirmLabel: "Xóa vĩnh viễn",
      onConfirm: () => performDeleteForeverItems(itemsToDelete),
    });
  };

  const moveSingleItem = (item: WorkspaceItem) => {
    setSelectedKeys([`${item.type}-${item.id}`]);
    setDialog({ type: "move", mode: "move", items: [item] });
  };

  const restoreSelected = () => restoreItems(selectedItems);

  const deleteForeverSelected = () => deleteForeverItems(selectedItems);

  const favoriteSelected = async () => {
    if (selectedItems.length !== 1) return;
    const item = selectedItems[0];
    try {
      const response = await workspaceLibraryApi.setFavorite(item.id, { type: item.type, favorite: !item.isFavorite });
      if (response.message) toast.info(response.message);
      else toast.success(item.isFavorite ? "Đã bỏ yêu thích." : "Đã thêm vào yêu thích.");
      loadLibrary();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể cập nhật yêu thích."));
    }
  };

  return (
    <>
      <PageTitle title="Tài liệu của tôi" description="Không gian quản lý tài liệu và thư mục DocShare." />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <LibrarySidebar activeArea={area} counts={counts} storage={storage} />
          <section className="relative overflow-hidden rounded-lg border border-line bg-surface">
            <div className="border-b border-line bg-surface px-4 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
                    <NavLink to="/library" className="hover:text-primary">Tài liệu của tôi</NavLink>
                    {area !== "my" && <span>/</span>}
                    {area !== "my" && <span className="font-semibold text-ink">{activeLabel}</span>}
                  </div>
                  <h1 className="text-3xl font-bold text-ink">{activeLabel}</h1>
                  <p className="mt-2 text-sm text-ink-secondary">
                    {area === "shared-links"
                      ? `${shareLinks.length} liên kết`
                      : `${visibleItems.length} mục · ${visibleItems.filter((item) => item.type === "folder").length} thư mục · ${visibleItems.filter((item) => item.type === "document").length} tài liệu`}
                  </p>
                </div>
                {canCreate && (
                  <WorkspaceCreateDropdown
                    canUpload={canCreate}
                    canCreateFolder={canCreate}
                    onUpload={() => setDialog({ type: "upload" })}
                    onCreateFolder={() => setDialog({ type: "create-folder" })}
                  />
                )}
              </div>
              <form onSubmit={submitSearch} className="mt-4 flex max-w-3xl flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
                  <input
                    ref={searchInputRef}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="input-field pl-9"
                    placeholder="Tìm theo tên file, thư mục, loại file"
                    aria-label="Tìm trong thư viện"
                  />
                </label>
                <select value={sort} onChange={(event) => changeSort(event.target.value)} className="input-field sm:w-44">
                  {area === "trash" ? (
                    <>
                      <option value="deleted_desc">Xóa mới nhất</option>
                      <option value="deleted_asc">Xóa cũ nhất</option>
                    </>
                  ) : (
                    <>
                      <option value="updated_desc">Mới nhất</option>
                      <option value="updated_asc">Cũ nhất</option>
                    </>
                  )}
                  <option value="name_asc">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                  {area !== "trash" && (
                    <>
                      <option value="type">Loại</option>
                      <option value="size_desc">Kích thước</option>
                    </>
                  )}
                </select>
                {area !== "trash" && (
                  <select value={fileType} onChange={(event) => setFileType(event.target.value)} className="input-field sm:w-40">
                    <option value="">Tất cả loại</option>
                    <option value="pdf">PDF</option>
                    <option value="docx">Word</option>
                    <option value="xlsx">Excel</option>
                    <option value="image">Ảnh</option>
                  </select>
                )}
                <button type="submit" className="btn-secondary px-3">Tìm</button>
              </form>
            </div>

            {area !== "shared-links" && (
              <WorkspaceToolbar
                selectedItems={selectedItems}
                area={area}
                folderPermissions={folderPermissions}
                viewMode={viewMode}
                onViewMode={changeViewMode}
                onClear={() => setSelectedKeys([])}
                onCreate={() => setDialog({ type: "create-folder" })}
                onUpload={() => setDialog({ type: "upload" })}
                onRename={() => openSingleAction("rename")}
                onMove={() => setDialog({ type: "move", mode: "move", items: selectedItems })}
                onCopy={() => setDialog({ type: "move", mode: "copy", items: selectedItems })}
                onCopyLink={() => selectedItems.length === 1 && copyItemLink(selectedItems[0])}
                onMerge={() => setDialog({ type: "merge", items: selectedItems })}
                onShare={() => openSingleAction("share")}
                onFavorite={favoriteSelected}
                onTrash={trashSelected}
                onRestore={restoreSelected}
                onDeleteForever={deleteForeverSelected}
              />
            )}

            <div className="p-4">
              {loading ? (
                <WorkspaceLoadingSkeleton />
              ) : area === "shared-links" ? (
                <SharedLinksView rows={shareLinks} />
              ) : visibleItems.length === 0 ? (
                <EmptyState
                  area={area}
                  canCreate={canCreate}
                  canUpload={canCreate}
                  onCreate={() => setDialog({ type: "create-folder" })}
                  onUpload={() => setDialog({ type: "upload" })}
                />
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visibleItems.map((item) => (
                    <WorkspaceItemCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      area={area}
                      selected={selectedKeys.includes(`${item.type}-${item.id}`)}
                      onSelect={() => toggleSelection(item)}
                      onPreview={() => setPreviewItem(item)}
                      onCopyLink={() => copyItemLink(item)}
                      onRename={() => setDialog({ type: "rename", item })}
                      onMove={() => moveSingleItem(item)}
                      onTrash={() => trashItems([item])}
                      onRestore={() => restoreItems([item])}
                      onDeleteForever={() => deleteForeverItems([item])}
                    />
                  ))}
                </div>
              ) : (
                <WorkspaceItemList
                  items={visibleItems}
                  area={area}
                  selectedIds={selectedKeys}
                  onToggle={toggleSelection}
                  onPreview={setPreviewItem}
                  onCopyLink={copyItemLink}
                  onRename={(item) => setDialog({ type: "rename", item })}
                  onMove={moveSingleItem}
                  onTrash={(item) => trashItems([item])}
                  onRestore={(item) => restoreItems([item])}
                  onDeleteForever={(item) => deleteForeverItems([item])}
                />
              )}
              <PaginationComponent
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                onPageChange={(nextPage) => setQuery({ pageNumber: String(nextPage) })}
              />
            </div>

            <PreviewDrawer item={previewItem} onClose={() => setPreviewItem(null)} onShare={(item) => setDialog({ type: "share", item })} />
          </section>
        </div>
      </div>

      {dialog?.type === "create-folder" && <CreateFolderDialog parentFolderId={null} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "upload" && <UploadDialog parentFolderId={null} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "rename" && <RenameDialog item={dialog.item} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "move" && <MoveCopyDialog mode={dialog.mode} items={dialog.items} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "merge" && <MergeDialog items={dialog.items} parentFolderId={null} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "share" && <ShareDialog item={dialog.item} onClose={() => setDialog(null)} />}
      {confirmAction && (
        <WorkspaceConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          variant={confirmAction.variant}
          loading={confirmLoading}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmAction}
        />
      )}
    </>
  );
};

export default MyLibraryPage;
