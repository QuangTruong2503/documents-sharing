import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  Clock3,
  Copy,
  Download,
  Eye,
  File,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  Grid3X3,
  Image,
  Link2,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
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
import documentsApi from "api/documentsApi.js";
import foldersApi from "api/foldersApi.js";
import { formatDateToVN } from "utils/formatDateToVN";
import { FolderFormDialog, apiMessage } from "pages/Folders/FolderListPage.tsx";

interface FolderItem {
  folder_id: number;
  name: string;
  description: string | null;
  visibility: "private" | "shared" | "public";
  created_at?: string;
  updated_at?: string;
  document_count?: number;
  member_count?: number;
  current_user_role?: string;
  role?: string;
  owner?: { username?: string; Username?: string; full_name?: string | null } | null;
}

interface DocumentItem {
  document_id: number;
  title?: string;
  Title?: string;
  description?: string | null;
  Description?: string | null;
  thumbnail_url?: string;
  file_type?: string | null;
  file_size?: number;
  uploaded_at?: string;
  file_url?: string;
  is_public?: boolean;
  uploader?: { username?: string; full_name?: string | null } | null;
}

type ViewMode = "grid" | "list";
type LibraryArea = "my" | "shared" | "recent" | "favorites" | "shared-links" | "trash";
type LibraryItem =
  | { key: string; itemType: "folder"; id: number; name: string; updatedAt?: string; folder: FolderItem }
  | { key: string; itemType: "document"; id: number; name: string; updatedAt?: string; document: DocumentItem };

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

const normalizeText = (value?: string | null) => (value || "").toLowerCase().trim();

const getDocumentTitle = (document: DocumentItem) => document.title || document.Title || "Tài liệu chưa có tiêu đề";
const getDocumentDescription = (document: DocumentItem) => document.description || document.Description || "Không có mô tả.";
const getFileType = (document: DocumentItem) => (document.file_type || "file").replace(".", "").toLowerCase();

const formatSize = (size?: number) => {
  if (!size) return "--";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const itemMatches = (item: LibraryItem, query: string) => {
  if (!query) return true;
  const needle = normalizeText(query);
  if (item.itemType === "folder") {
    return `${item.folder.name} ${item.folder.description || ""}`.toLowerCase().includes(needle);
  }
  return `${getDocumentTitle(item.document)} ${getDocumentDescription(item.document)} ${getFileType(item.document)}`
    .toLowerCase()
    .includes(needle);
};

const EmptyState = ({ area, canCreate, onCreate }: { area: LibraryArea; canCreate: boolean; onCreate: () => void }) => {
  const copy =
    area === "trash"
      ? ["Thùng rác đang trống", "Các tài liệu đã xóa sẽ xuất hiện ở đây."]
      : area === "shared"
        ? ["Chưa có nội dung được chia sẻ", "Folder hoặc tài liệu được mời truy cập sẽ nằm tại đây."]
        : ["Thư mục này đang trống", "Kéo thả file vào đây hoặc tạo thư mục đầu tiên."];

  return (
    <div className="rounded-lg border border-dashed border-line bg-surface px-5 py-14 text-center">
      <FolderOpen className="mx-auto h-10 w-10 text-neutral" />
      <h2 className="mt-4 text-lg font-bold text-ink">{copy[0]}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">{copy[1]}</p>
      {canCreate && (
        <div className="mt-6 flex justify-center gap-2">
          <NavLink to="/upload-document" className="btn-primary">
            <Upload className="mr-2 h-4 w-4" />
            Tải lên
          </NavLink>
          <button type="button" onClick={onCreate} className="btn-secondary">
            <Plus className="mr-2 h-4 w-4" />
            Thư mục mới
          </button>
        </div>
      )}
    </div>
  );
};

const LibrarySidebar = ({ activeArea, counts }: { activeArea: string; counts: Record<string, number> }) => (
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
        <span>42%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-line">
        <div className="h-2 w-[42%] rounded-full bg-primary" />
      </div>
      <p className="mt-2 text-xs text-ink-secondary">Đang dùng 4.2 GB / 10 GB</p>
    </div>
  </aside>
);

const Toolbar = ({
  selectedCount,
  viewMode,
  onViewMode,
  onClear,
  onDelete,
}: {
  selectedCount: number;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  onClear: () => void;
  onDelete: () => void;
}) => (
  <div className="flex flex-col gap-3 border-b border-line bg-surface px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
    {selectedCount > 0 ? (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink">{selectedCount} mục đã chọn</span>
        <button type="button" className="btn-secondary px-3 py-2">
          <Download className="mr-2 h-4 w-4" />
          Tải xuống
        </button>
        <button type="button" className="btn-secondary px-3 py-2">
          <Copy className="mr-2 h-4 w-4" />
          Sao chép
        </button>
        <button type="button" className="btn-secondary px-3 py-2">
          <Share2 className="mr-2 h-4 w-4" />
          Chia sẻ
        </button>
        <button type="button" onClick={onDelete} className="btn-secondary border-danger px-3 py-2 text-danger hover:border-danger hover:text-danger">
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa
        </button>
        <button type="button" onClick={onClear} className="btn-secondary px-3 py-2" title="Bỏ chọn">
          <X className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-2">
        <NavLink to="/upload-document" className="btn-primary px-3 py-2">
          <Upload className="mr-2 h-4 w-4" />
          Tải lên
        </NavLink>
        <button type="button" className="btn-secondary px-3 py-2">
          <Filter className="mr-2 h-4 w-4" />
          Lọc
        </button>
        <button type="button" className="btn-secondary px-3 py-2">
          Mới nhất
        </button>
      </div>
    )}
    <div className="inline-flex w-fit rounded-md border border-line bg-canvas p-1">
      <button
        type="button"
        onClick={() => onViewMode("grid")}
        className={`rounded px-2.5 py-2 ${viewMode === "grid" ? "bg-surface text-primary shadow-sm" : "text-ink-secondary"}`}
        title="Grid view"
      >
        <Grid3X3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onViewMode("list")}
        className={`rounded px-2.5 py-2 ${viewMode === "list" ? "bg-surface text-primary shadow-sm" : "text-ink-secondary"}`}
        title="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const LibraryItemCard = ({
  item,
  selected,
  onSelect,
  onPreview,
}: {
  item: LibraryItem;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) => {
  const isFolder = item.itemType === "folder";
  const fileType = isFolder ? "" : getFileType(item.document);
  const Icon = isFolder ? Folder : fileIconMap[fileType] || File;

  return (
    <article className={`rounded-lg border bg-surface transition hover:-translate-y-0.5 hover:shadow-card ${selected ? "border-primary ring-2 ring-primary/20" : "border-line"}`}>
      <div className="relative">
        <button
          type="button"
          onClick={onSelect}
          className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border ${
            selected ? "border-primary bg-primary text-white" : "border-line bg-surface/95 text-ink-secondary hover:text-primary"
          }`}
          aria-label={selected ? "Bỏ chọn mục" : "Chọn mục"}
        >
          {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
        </button>
        <button type="button" className="absolute right-3 top-3 z-10 rounded-md bg-surface/95 p-2 text-ink-secondary hover:text-primary" title="Thêm">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {isFolder ? (
          <NavLink to={`/library/folders/${item.id}`} className="flex h-36 items-center justify-center bg-primary-soft">
            <Icon className="h-14 w-14 text-primary" />
          </NavLink>
        ) : (
          <button type="button" onClick={onPreview} className="flex h-36 w-full items-center justify-center overflow-hidden bg-canvas text-left">
            {item.document.thumbnail_url ? (
              <img src={item.document.thumbnail_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-ink-secondary">
                <Icon className="h-10 w-10 text-primary" />
                {fileType.toUpperCase()}
              </span>
            )}
          </button>
        )}
      </div>
      <div className="p-4">
        {isFolder ? (
          <NavLink to={`/library/folders/${item.id}`} className="line-clamp-1 font-bold text-ink hover:text-primary">
            {item.name}
          </NavLink>
        ) : (
          <button type="button" onClick={onPreview} className="line-clamp-1 w-full text-left font-bold text-ink hover:text-primary">
            {item.name}
          </button>
        )}
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-ink-secondary">
          {isFolder ? item.folder.description || `${item.folder.document_count ?? 0} tài liệu` : getDocumentDescription(item.document)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-ink-secondary">
          <span>{isFolder ? `${item.folder.member_count ?? 0} thành viên` : `${fileType.toUpperCase()} · ${formatSize(item.document.file_size)}`}</span>
          <span>{item.updatedAt ? formatDateToVN(item.updatedAt) : ""}</span>
        </div>
      </div>
    </article>
  );
};

const LibraryItemList = ({
  items,
  selectedKeys,
  onToggle,
  onPreview,
}: {
  items: LibraryItem[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  onPreview: (item: LibraryItem) => void;
}) => (
  <div className="overflow-hidden rounded-lg border border-line bg-surface">
    <div className="grid grid-cols-[44px_1fr_120px_140px_48px] gap-3 border-b border-line px-4 py-3 text-xs font-semibold uppercase text-ink-secondary">
      <span />
      <span>Tên</span>
      <span>Loại</span>
      <span>Cập nhật</span>
      <span />
    </div>
    {items.map((item) => {
      const selected = selectedKeys.includes(item.key);
      const Icon = item.itemType === "folder" ? Folder : fileIconMap[getFileType(item.document)] || File;
      return (
        <div key={item.key} className="grid grid-cols-[44px_1fr_120px_140px_48px] gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-canvas">
          <button
            type="button"
            onClick={() => onToggle(item.key)}
            className={`flex h-8 w-8 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary text-white" : "border-line text-ink-secondary"}`}
            aria-label={selected ? "Bỏ chọn mục" : "Chọn mục"}
          >
            {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {item.itemType === "folder" ? (
              <NavLink to={`/library/folders/${item.id}`} className="truncate font-semibold text-ink hover:text-primary">
                {item.name}
              </NavLink>
            ) : (
              <button type="button" onClick={() => onPreview(item)} className="truncate text-left font-semibold text-ink hover:text-primary">
                {item.name}
              </button>
            )}
          </div>
          <span className="self-center text-sm text-ink-secondary">{item.itemType === "folder" ? "Folder" : getFileType(item.document).toUpperCase()}</span>
          <span className="self-center text-sm text-ink-secondary">{item.updatedAt ? formatDateToVN(item.updatedAt) : "--"}</span>
          <button type="button" className="rounded-md p-2 text-ink-secondary hover:text-primary" title="Thêm">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      );
    })}
  </div>
);

const PreviewDrawer = ({ item, onClose }: { item: LibraryItem | null; onClose: () => void }) => {
  if (!item || item.itemType !== "document") return null;
  const document = item.document;
  const type = getFileType(document);
  const Icon = fileIconMap[type] || FileText;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line bg-surface shadow-card lg:absolute lg:inset-y-0 lg:right-0">
      <div className="flex items-center justify-between border-b border-line p-4">
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{item.name}</p>
          <p className="text-xs text-ink-secondary">{type.toUpperCase()} · {formatSize(document.file_size)}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-2 text-ink-secondary hover:bg-canvas hover:text-ink" title="Đóng">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex h-72 items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas">
          {document.thumbnail_url ? (
            <img src={document.thumbnail_url} alt={item.name} className="h-full w-full object-contain" />
          ) : (
            <div className="text-center text-ink-secondary">
              <Icon className="mx-auto h-14 w-14 text-primary" />
              <p className="mt-3 text-sm">Chưa có preview</p>
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <NavLink to={`/document/${document.document_id}`} className="btn-primary">
            <Eye className="mr-2 h-4 w-4" />
            Chi tiết
          </NavLink>
          {document.file_url ? (
            <a href={document.file_url} className="btn-secondary">
              <Download className="mr-2 h-4 w-4" />
              Tải xuống
            </a>
          ) : (
            <button type="button" className="btn-secondary">
              <Share2 className="mr-2 h-4 w-4" />
              Chia sẻ
            </button>
          )}
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-ink">Mô tả</dt>
            <dd className="mt-1 text-ink-secondary">{getDocumentDescription(document)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Ngày tải lên</dt>
            <dd className="mt-1 text-ink-secondary">{document.uploaded_at ? formatDateToVN(document.uploaded_at) : "--"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Trạng thái</dt>
            <dd className="mt-1 text-ink-secondary">{document.is_public === false ? "Riêng tư" : "Có thể chia sẻ"}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
};

const MyLibraryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const area = (searchParams.get("area") || (searchParams.get("tab") === "shared" ? "shared" : "my")) as LibraryArea;
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get("view") as ViewMode) || "grid");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [sharedFolders, setSharedFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const querySearch = searchParams.get("search") || "";

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const [documentResponse, myFolderResponse, sharedFolderResponse] = await Promise.all([
        documentsApi.getMyUploadedDocument({ pageNumber: 1, sortBy: "date" }),
        foldersApi.getMyFolders({ search: querySearch, pageNumber: 1, pageSize: 48 }),
        foldersApi.getSharedFolders({ search: querySearch, pageNumber: 1, pageSize: 48 }),
      ]);
      setDocuments(documentResponse.data?.data || []);
      setFolders(myFolderResponse.data);
      setSharedFolders(sharedFolderResponse.data);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không tải được thư viện."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setSelectedKeys(visibleItems.map((item) => item.key));
      }
      if (event.key === "Escape") {
        setSelectedKeys([]);
        setPreviewItem(null);
      }
      if (event.key === "/" && document.activeElement !== searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const allItems = useMemo<LibraryItem[]>(() => {
    const folderSource = area === "shared" ? sharedFolders : area === "my" ? folders : area === "recent" ? [...folders, ...sharedFolders] : [];
    const folderItems = folderSource.map((folder) => ({
      key: `folder-${folder.folder_id}`,
      itemType: "folder" as const,
      id: folder.folder_id,
      name: folder.name,
      updatedAt: folder.updated_at || folder.created_at,
      folder,
    }));
    const documentItems = area === "my" || area === "recent"
      ? documents.map((document) => ({
          key: `document-${document.document_id}`,
          itemType: "document" as const,
          id: document.document_id,
          name: getDocumentTitle(document),
          updatedAt: document.uploaded_at,
          document,
        }))
      : [];
    return [...folderItems, ...documentItems].sort((a, b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || ""));
  }, [area, documents, folders, sharedFolders]);

  const visibleItems = useMemo(() => allItems.filter((item) => itemMatches(item, querySearch)), [allItems, querySearch]);
  const selectedDocuments = selectedKeys
    .filter((key) => key.startsWith("document-"))
    .map((key) => Number(key.replace("document-", "")));
  const activeLabel = navItems.find((item) => item.key === area)?.label || "Tài liệu của tôi";
  const canCreate = area === "my";

  const counts = {
    my: folders.length + documents.length,
    shared: sharedFolders.length,
    recent: folders.length + sharedFolders.length + documents.length,
    favorites: 0,
    "shared-links": 0,
    trash: 0,
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams({ area, search: search.trim(), view: viewMode });
  };

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    setSearchParams({ area, ...(querySearch ? { search: querySearch } : {}), view: mode });
  };

  const createFolder = async (payload: any) => {
    const folder = await foldersApi.createFolder(payload);
    toast.success("Đã tạo thư mục.");
    setShowCreateFolder(false);
    if (folder?.folder_id) {
      navigate(`/library/folders/${folder.folder_id}`);
    } else {
      loadLibrary();
    }
  };

  const toggleSelection = (key: string) => {
    setSelectedKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const deleteSelected = async () => {
    if (selectedDocuments.length === 0) {
      toast.info("Hiện tại chỉ hỗ trợ xóa hàng loạt tài liệu.");
      return;
    }
    if (!window.confirm(`Chuyển ${selectedDocuments.length} tài liệu vào thùng rác?`)) return;
    setDeleting(true);
    try {
      await documentsApi.deleteDocuments(selectedDocuments);
      toast.success("Đã chuyển vào thùng rác.");
      setDocuments((current) => current.filter((document) => !selectedDocuments.includes(document.document_id)));
      setSelectedKeys((current) => current.filter((key) => !key.startsWith("document-")));
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể xóa tài liệu đã chọn."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageTitle title="Tài liệu của tôi" description="Không gian quản lý tài liệu và thư mục DocShare." />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <LibrarySidebar activeArea={area} counts={counts} />
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
                    {visibleItems.length} mục · {folders.length + sharedFolders.length} thư mục · {documents.length} tài liệu
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => setShowCreateFolder(true)} disabled={!canCreate} className="btn-secondary">
                    <Plus className="mr-2 h-4 w-4" />
                    Thư mục mới
                  </button>
                  <NavLink to="/upload-document" className="btn-primary">
                    <Upload className="mr-2 h-4 w-4" />
                    Tải lên
                  </NavLink>
                </div>
              </div>
              <form onSubmit={submitSearch} className="mt-4 flex max-w-2xl gap-2">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
                  <input
                    ref={searchInputRef}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="input-field pl-9"
                    placeholder="Tìm theo tên file, thư mục, loại file"
                  />
                </label>
                <button type="submit" className="btn-secondary px-3">Tìm</button>
              </form>
            </div>

            <Toolbar
              selectedCount={selectedKeys.length}
              viewMode={viewMode}
              onViewMode={changeViewMode}
              onClear={() => setSelectedKeys([])}
              onDelete={deleting ? () => undefined : deleteSelected}
            />

            <div className={`p-4 ${previewItem ? "lg:pr-[28rem]" : ""}`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                  <p className="text-sm text-ink-secondary">Đang tải thư viện...</p>
                </div>
              ) : visibleItems.length === 0 ? (
                <EmptyState area={area} canCreate={canCreate} onCreate={() => setShowCreateFolder(true)} />
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visibleItems.map((item) => (
                    <LibraryItemCard
                      key={item.key}
                      item={item}
                      selected={selectedKeys.includes(item.key)}
                      onSelect={() => toggleSelection(item.key)}
                      onPreview={() => setPreviewItem(item)}
                    />
                  ))}
                </div>
              ) : (
                <LibraryItemList
                  items={visibleItems}
                  selectedKeys={selectedKeys}
                  onToggle={toggleSelection}
                  onPreview={setPreviewItem}
                />
              )}
            </div>

            <PreviewDrawer item={previewItem} onClose={() => setPreviewItem(null)} />
          </section>
        </div>
      </div>

      {showCreateFolder && (
        <FolderFormDialog title="Tạo thư mục" onClose={() => setShowCreateFolder(false)} onSubmit={createFolder} />
      )}
    </>
  );
};

export default MyLibraryPage;
