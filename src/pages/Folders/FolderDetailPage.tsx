import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Check,
  Copy,
  Download,
  Eye,
  File,
  FilePlus,
  FileText,
  Filter,
  Folder,
  Grid3X3,
  Image,
  List,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Shield,
  Table,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import PageTitle from "components/PageTitle.js";
import documentsApi from "api/documentsApi.js";
import foldersApi, { folderRoles } from "api/foldersApi.js";
import { formatDateToVN } from "utils/formatDateToVN";
import { Badge, FolderFormDialog, apiMessage, roleLabel, visibilityLabel } from "./FolderListPage.tsx";

interface FolderPermissions {
  can_view: boolean;
  can_comment: boolean;
  can_add_document: boolean;
  can_remove_document: boolean;
  can_edit_folder: boolean;
  can_manage_members: boolean;
  can_delete_folder: boolean;
}

interface FolderDetail {
  folder_id: number;
  name: string;
  description: string | null;
  visibility: "private" | "shared" | "public";
  created_at: string;
  updated_at: string;
  document_count?: number;
  member_count?: number;
}

interface FolderDocumentItem {
  folder_id: number;
  document_id: number;
  added_at: string;
  document: {
    document_id: number;
    title: string;
    description?: string | null;
    thumbnail_url?: string;
    file_url?: string;
    file_type?: string | null;
    file_size?: number;
    uploaded_at?: string;
    uploader?: { username?: string; full_name?: string | null } | null;
  };
}

interface FolderMember {
  user_id: string;
  role: string;
  joined_at: string;
  user?: { username?: string; Username?: string; full_name?: string | null; avatar_url?: string | null; email?: string | null } | null;
}

interface FolderInvite {
  invite_id: number;
  invitee_user_id?: string | null;
  invitee_email?: string | null;
  role: string;
  status: string;
  created_at: string;
}

type ViewMode = "grid" | "list";
type WorkspaceTab = "documents" | "members" | "invites" | "settings";

const defaultPermissions: FolderPermissions = {
  can_view: false,
  can_comment: false,
  can_add_document: false,
  can_remove_document: false,
  can_edit_folder: false,
  can_manage_members: false,
  can_delete_folder: false,
};

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

const getDocumentTitle = (document: FolderDocumentItem["document"]) => document.title || "Tài liệu chưa có tiêu đề";
const getFileType = (document: FolderDocumentItem["document"]) => (document.file_type || "file").replace(".", "").toLowerCase();
const getMemberName = (member: FolderMember) =>
  member.user?.full_name || member.user?.username || member.user?.Username || member.user_id;

const formatSize = (size?: number) => {
  if (!size) return "--";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const FolderWorkspaceSidebar = ({
  folder,
  permissions,
  currentRole,
  activeTab,
  onTab,
  onUpload,
  onShare,
}: {
  folder: FolderDetail;
  permissions: FolderPermissions;
  currentRole: string | null;
  activeTab: WorkspaceTab;
  onTab: (tab: WorkspaceTab) => void;
  onUpload: () => void;
  onShare: () => void;
}) => {
  const nav = [
    { key: "documents", label: "Tài liệu", icon: Folder },
    { key: "members", label: "Thành viên", icon: Users, disabled: !permissions.can_manage_members },
    { key: "invites", label: "Lời mời", icon: UserPlus, disabled: !permissions.can_manage_members },
    { key: "settings", label: "Cài đặt", icon: Settings },
  ] as const;

  return (
    <aside className="rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Folder className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h2 className="line-clamp-2 font-bold text-ink">{folder.name}</h2>
          <p className="mt-1 text-xs text-ink-secondary">{visibilityLabel[folder.visibility]}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-secondary">{folder.description || "Thư mục này chưa có mô tả."}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{folder.document_count ?? 0} tài liệu</Badge>
        <Badge>{folder.member_count ?? 0} thành viên</Badge>
        {currentRole && <Badge>{roleLabel[currentRole] || currentRole}</Badge>}
      </div>

      <div className="mt-5 grid gap-2">
        <button type="button" onClick={onUpload} disabled={!permissions.can_add_document} className="btn-primary">
          <Upload className="mr-2 h-4 w-4" />
          Add files
        </button>
        <button type="button" onClick={onShare} disabled={!permissions.can_manage_members} className="btn-secondary">
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
        <p>{permissions.can_add_document ? "Bạn có thể thêm và quản lý tài liệu trong thư mục này." : "Bạn đang ở chế độ xem giới hạn."}</p>
      </div>
    </aside>
  );
};

const DocumentsToolbar = ({
  selectedCount,
  viewMode,
  onViewMode,
  onClear,
  onRemove,
  canRemove,
}: {
  selectedCount: number;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  onClear: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) => (
  <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
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
        <button type="button" onClick={onRemove} disabled={!canRemove} className="btn-secondary border-danger px-3 py-2 text-danger hover:border-danger hover:text-danger">
          <Trash2 className="mr-2 h-4 w-4" />
          Gỡ khỏi thư mục
        </button>
        <button type="button" onClick={onClear} className="btn-secondary px-3 py-2" title="Bỏ chọn">
          <X className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-2">
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
      <button type="button" onClick={() => onViewMode("grid")} className={`rounded px-2.5 py-2 ${viewMode === "grid" ? "bg-surface text-primary shadow-sm" : "text-ink-secondary"}`} title="Grid view">
        <Grid3X3 className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => onViewMode("list")} className={`rounded px-2.5 py-2 ${viewMode === "list" ? "bg-surface text-primary shadow-sm" : "text-ink-secondary"}`} title="List view">
        <List className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const DocumentCard = ({
  item,
  selected,
  onSelect,
  onPreview,
}: {
  item: FolderDocumentItem;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) => {
  const document = item.document;
  const type = getFileType(document);
  const Icon = fileIconMap[type] || File;

  return (
    <article className={`rounded-lg border bg-surface transition hover:-translate-y-0.5 hover:shadow-card ${selected ? "border-primary ring-2 ring-primary/20" : "border-line"}`}>
      <div className="relative">
        <button type="button" onClick={onSelect} className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary text-white" : "border-line bg-surface/95 text-ink-secondary hover:text-primary"}`} aria-label={selected ? "Bỏ chọn tài liệu" : "Chọn tài liệu"}>
          {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
        </button>
        <button type="button" className="absolute right-3 top-3 z-10 rounded-md bg-surface/95 p-2 text-ink-secondary hover:text-primary" title="Thêm">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <button type="button" onClick={onPreview} className="flex h-36 w-full items-center justify-center overflow-hidden bg-canvas">
          {document.thumbnail_url ? (
            <img src={document.thumbnail_url} alt={getDocumentTitle(document)} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm text-ink-secondary">
              <Icon className="h-10 w-10 text-primary" />
              {type.toUpperCase()}
            </span>
          )}
        </button>
      </div>
      <div className="p-4">
        <button type="button" onClick={onPreview} className="line-clamp-1 w-full text-left font-bold text-ink hover:text-primary">
          {getDocumentTitle(document)}
        </button>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-ink-secondary">{document.description || "Không có mô tả."}</p>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-ink-secondary">
          <span>{type.toUpperCase()} · {formatSize(document.file_size)}</span>
          <span>{formatDateToVN(item.added_at)}</span>
        </div>
      </div>
    </article>
  );
};

const DocumentList = ({
  documents,
  selectedIds,
  onToggle,
  onPreview,
}: {
  documents: FolderDocumentItem[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onPreview: (item: FolderDocumentItem) => void;
}) => (
  <div className="overflow-hidden rounded-lg border border-line bg-surface">
    <div className="grid grid-cols-[44px_1fr_120px_140px_48px] gap-3 border-b border-line px-4 py-3 text-xs font-semibold uppercase text-ink-secondary">
      <span />
      <span>Tên</span>
      <span>Loại</span>
      <span>Đã thêm</span>
      <span />
    </div>
    {documents.map((item) => {
      const document = item.document;
      const selected = selectedIds.includes(document.document_id);
      const Icon = fileIconMap[getFileType(document)] || File;
      return (
        <div key={document.document_id} className="grid grid-cols-[44px_1fr_120px_140px_48px] gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-canvas">
          <button type="button" onClick={() => onToggle(document.document_id)} className={`flex h-8 w-8 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary text-white" : "border-line text-ink-secondary"}`} aria-label={selected ? "Bỏ chọn tài liệu" : "Chọn tài liệu"}>
            {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
          </button>
          <button type="button" onClick={() => onPreview(item)} className="flex min-w-0 items-center gap-3 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate font-semibold text-ink hover:text-primary">{getDocumentTitle(document)}</span>
          </button>
          <span className="self-center text-sm text-ink-secondary">{getFileType(document).toUpperCase()}</span>
          <span className="self-center text-sm text-ink-secondary">{formatDateToVN(item.added_at)}</span>
          <button type="button" className="rounded-md p-2 text-ink-secondary hover:text-primary" title="Thêm">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      );
    })}
  </div>
);

const AddDocumentDialog = ({
  folderId,
  onClose,
  onDone,
}: {
  folderId: number;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowMove, setAllowMove] = useState(false);

  useEffect(() => {
    setLoading(true);
    foldersApi
      .getMyUploadedDocuments({ pageNumber: 1, sortBy: "date" })
      .then((response) => setDocuments(response.data?.data || []))
      .catch((error) => toast.error(apiMessage(error, "Không tải được tài liệu của bạn.")))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      if (allowMove) {
        await foldersApi.moveDocumentToFolder(selectedId, folderId);
        toast.success("Đã chuyển tài liệu vào thư mục.");
      } else {
        await foldersApi.addDocumentToFolder(folderId, selectedId);
        toast.success("Đã thêm tài liệu vào thư mục.");
      }
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể thêm tài liệu."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-xl rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Thêm tài liệu có sẵn</h2>
        {loading ? (
          <div className="flex items-center gap-3 py-8 text-sm text-ink-secondary">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            Đang tải tài liệu...
          </div>
        ) : (
          <>
            <label className="mt-5 block">
              <span className="mb-1 block text-sm font-semibold text-ink">Tài liệu đã tải lên</span>
              <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="input-field">
                <option value="">Chọn tài liệu</option>
                {documents.map((doc) => (
                  <option key={doc.document_id} value={doc.document_id}>
                    {doc.title || doc.Title || `Tài liệu #${doc.document_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 flex items-start gap-3 rounded-md border border-line p-3 text-sm text-ink-secondary">
              <input type="checkbox" checked={allowMove} onChange={(event) => setAllowMove(event.target.checked)} className="mt-1" />
              <span>Chuyển tài liệu sang thư mục này nếu tài liệu đang thuộc thư mục khác.</span>
            </label>
          </>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving || loading || !selectedId} className="btn-primary">
            {saving ? "Đang thêm..." : "Thêm"}
          </button>
        </div>
      </form>
    </div>
  );
};

const PreviewDrawer = ({ item, onClose }: { item: FolderDocumentItem | null; onClose: () => void }) => {
  if (!item) return null;
  const document = item.document;
  const type = getFileType(document);
  const Icon = fileIconMap[type] || FileText;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line bg-surface shadow-card lg:absolute lg:inset-y-0 lg:right-0">
      <div className="flex items-center justify-between border-b border-line p-4">
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{getDocumentTitle(document)}</p>
          <p className="text-xs text-ink-secondary">{type.toUpperCase()} · {formatSize(document.file_size)}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-2 text-ink-secondary hover:bg-canvas hover:text-ink" title="Đóng">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex h-72 items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas">
          {document.thumbnail_url ? (
            <img src={document.thumbnail_url} alt={getDocumentTitle(document)} className="h-full w-full object-contain" />
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
            <dd className="mt-1 text-ink-secondary">{document.description || "Không có mô tả."}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Đã thêm vào thư mục</dt>
            <dd className="mt-1 text-ink-secondary">{formatDateToVN(item.added_at)}</dd>
          </div>
        </dl>
      </div>
    </aside>
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

const SettingsPanel = ({
  folder,
  permissions,
  currentRole,
  onUpdated,
}: {
  folder: FolderDetail;
  permissions: FolderPermissions;
  currentRole: string | null;
  onUpdated: () => void;
}) => {
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);

  const updateFolder = async (payload: any) => {
    await foldersApi.updateFolder(folder.folder_id, payload);
    toast.success("Đã cập nhật thư mục.");
    setShowEdit(false);
    onUpdated();
  };

  const deleteFolder = async () => {
    if (!window.confirm("Xóa thư mục này? Tài liệu gốc vẫn được giữ lại.")) return;
    try {
      await foldersApi.deleteFolder(folder.folder_id);
      toast.success("Đã xóa thư mục.");
      navigate("/library");
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể xóa thư mục."));
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-lg font-bold text-ink">Thông tin chung</h2>
        <p className="mt-2 text-sm text-ink-secondary">{folder.description || "Thư mục này chưa có mô tả."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{visibilityLabel[folder.visibility]}</Badge>
          <Badge>Cập nhật {formatDateToVN(folder.updated_at)}</Badge>
          {currentRole && <Badge>{roleLabel[currentRole] || currentRole}</Badge>}
        </div>
        {permissions.can_edit_folder && (
          <button type="button" onClick={() => setShowEdit(true)} className="btn-primary mt-5">
            Chỉnh sửa
          </button>
        )}
      </div>
      {permissions.can_delete_folder && (
        <div className="rounded-lg border border-danger/30 bg-red-50 p-5">
          <h2 className="text-lg font-bold text-danger">Danger zone</h2>
          <p className="mt-2 text-sm text-ink-secondary">Xóa thư mục chỉ xóa liên kết quản lý, không xóa tài liệu gốc.</p>
          <button type="button" onClick={deleteFolder} className="mt-5 inline-flex items-center rounded-md bg-danger px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa thư mục
          </button>
        </div>
      )}
      {showEdit && (
        <FolderFormDialog
          title="Chỉnh sửa thư mục"
          initialValue={{ name: folder.name, description: folder.description || "", visibility: folder.visibility }}
          onClose={() => setShowEdit(false)}
          onSubmit={updateFolder}
        />
      )}
    </div>
  );
};

const FolderDetailPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [folder, setFolder] = useState<FolderDetail | null>(null);
  const [permissions, setPermissions] = useState<FolderPermissions>(defaultPermissions);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [documents, setDocuments] = useState<FolderDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get("view") as ViewMode) || "grid");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewItem, setPreviewItem] = useState<FolderDocumentItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const numericFolderId = Number(folderId);
  const routeTab = location.pathname.endsWith("/members")
    ? "members"
    : location.pathname.endsWith("/invites")
      ? "invites"
      : "documents";
  const activeTab = (searchParams.get("tab") || routeTab) as WorkspaceTab;
  const querySearch = searchParams.get("search") || "";

  const loadDetail = async () => {
    if (!numericFolderId) {
      setError("Không tìm thấy thư mục.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await foldersApi.getFolderDetail(numericFolderId);
      setFolder(response.folder ?? response.data?.folder ?? response);
      setPermissions(response.permissions ?? defaultPermissions);
      setCurrentRole(response.current_user_role ?? null);
      setError("");
    } catch (error: any) {
      setError(apiMessage(error, "Không thể mở thư mục."));
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!numericFolderId) return;
    setDocumentsLoading(true);
    try {
      const response = await foldersApi.getFolderDocuments(numericFolderId, {
        search: querySearch,
        sortBy: "added_at",
        pageNumber: 1,
        pageSize: 48,
      });
      setDocuments(response.data);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không tải được tài liệu trong thư mục."));
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericFolderId, querySearch]);

  const visibleDocuments = useMemo(() => {
    if (!querySearch) return documents;
    const needle = querySearch.toLowerCase().trim();
    return documents.filter((item) => `${getDocumentTitle(item.document)} ${item.document.description || ""} ${getFileType(item.document)}`.toLowerCase().includes(needle));
  }, [documents, querySearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && activeTab === "documents") {
        event.preventDefault();
        setSelectedIds(visibleDocuments.map((item) => item.document.document_id));
      }
      if (event.key === "Escape") {
        setSelectedIds([]);
        setPreviewItem(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab, visibleDocuments]);

  const setTab = (tab: WorkspaceTab) => {
    setSearchParams({ tab, ...(querySearch ? { search: querySearch } : {}), view: viewMode });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams({ tab: activeTab, search: search.trim(), view: viewMode });
  };

  const toggleSelection = (documentId: number) => {
    setSelectedIds((current) => current.includes(documentId) ? current.filter((id) => id !== documentId) : [...current, documentId]);
  };

  const removeSelected = async () => {
    if (!permissions.can_remove_document || selectedIds.length === 0) return;
    if (!window.confirm(`Gỡ ${selectedIds.length} tài liệu khỏi thư mục? Tài liệu gốc sẽ không bị xóa.`)) return;
    try {
      await Promise.all(selectedIds.map((documentId) => foldersApi.removeDocumentFromFolder(numericFolderId, documentId)));
      toast.success("Đã gỡ tài liệu khỏi thư mục.");
      setDocuments((current) => current.filter((item) => !selectedIds.includes(item.document.document_id)));
      setSelectedIds([]);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể gỡ tài liệu."));
    }
  };

  const uploadDocumentToFolder = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !folder) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      await documentsApi.postDocument(formData, folder.folder_id);
      toast.success("Tải tài liệu vào thư mục thành công.");
      loadDocuments();
      loadDetail();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tải tài liệu vào thư mục."));
    } finally {
      setUploading(false);
    }
  };

  const updateFolder = async (payload: any) => {
    if (!folder) return;
    await foldersApi.updateFolder(folder.folder_id, payload);
    toast.success("Đã cập nhật thư mục.");
    setShowEdit(false);
    loadDetail();
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
            permissions={permissions}
            currentRole={currentRole}
            activeTab={activeTab}
            onTab={setTab}
            onUpload={() => fileInputRef.current?.click()}
            onShare={() => permissions.can_manage_members ? setTab("members") : toast.info("Bạn không có quyền chia sẻ thư mục này.")}
          />

          <section className="relative overflow-hidden rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-4 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
                    <NavLink to="/library" className="hover:text-primary">Tài liệu của tôi</NavLink>
                    <span>/</span>
                    <span className="font-semibold text-ink">{folder.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold text-ink">{folder.name}</h1>
                    <Badge>{visibilityLabel[folder.visibility]}</Badge>
                    {currentRole && <Badge>{roleLabel[currentRole] || currentRole}</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-ink-secondary">
                    {visibleDocuments.length} tài liệu · cập nhật {formatDateToVN(folder.updated_at)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={uploadDocumentToFolder} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!permissions.can_add_document || uploading} className="btn-primary">
                    {uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {uploading ? "Đang tải..." : "Tải lên"}
                  </button>
                  <button type="button" onClick={() => setShowAdd(true)} disabled={!permissions.can_add_document} className="btn-secondary">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Thêm có sẵn
                  </button>
                  <button type="button" onClick={() => setShowEdit(true)} disabled={!permissions.can_edit_folder} className="btn-secondary">
                    <Settings className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </button>
                </div>
              </div>

              {activeTab === "documents" && (
                <form onSubmit={submitSearch} className="mt-4 flex max-w-2xl gap-2">
                  <label className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field pl-9" placeholder="Tìm trong thư mục hiện tại" />
                  </label>
                  <button type="submit" className="btn-secondary px-3">Tìm</button>
                </form>
              )}
            </div>

            {activeTab === "documents" && (
              <>
                <DocumentsToolbar
                  selectedCount={selectedIds.length}
                  viewMode={viewMode}
                  onViewMode={(mode) => {
                    setViewMode(mode);
                    setSearchParams({ tab: activeTab, ...(querySearch ? { search: querySearch } : {}), view: mode });
                  }}
                  onClear={() => setSelectedIds([])}
                  onRemove={removeSelected}
                  canRemove={permissions.can_remove_document}
                />
                <div className={`p-4 ${previewItem ? "lg:pr-[28rem]" : ""}`}>
                  {documentsLoading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                      <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                      <p className="text-sm text-ink-secondary">Đang tải tài liệu...</p>
                    </div>
                  ) : visibleDocuments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line bg-surface px-5 py-14 text-center">
                      <Folder className="mx-auto h-10 w-10 text-neutral" />
                      <h2 className="mt-4 text-lg font-bold text-ink">Thư mục này đang trống</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">Kéo thả file vào đây hoặc thêm tài liệu đầu tiên.</p>
                      {permissions.can_add_document && (
                        <div className="mt-6 flex justify-center gap-2">
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-primary">
                            <Upload className="mr-2 h-4 w-4" />
                            Tải lên
                          </button>
                          <button type="button" onClick={() => setShowAdd(true)} className="btn-secondary">
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm tài liệu
                          </button>
                        </div>
                      )}
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {visibleDocuments.map((item) => (
                        <DocumentCard
                          key={item.document.document_id}
                          item={item}
                          selected={selectedIds.includes(item.document.document_id)}
                          onSelect={() => toggleSelection(item.document.document_id)}
                          onPreview={() => setPreviewItem(item)}
                        />
                      ))}
                    </div>
                  ) : (
                    <DocumentList documents={visibleDocuments} selectedIds={selectedIds} onToggle={toggleSelection} onPreview={setPreviewItem} />
                  )}
                </div>
                <PreviewDrawer item={previewItem} onClose={() => setPreviewItem(null)} />
              </>
            )}

            {activeTab === "members" && <MembersPanel folderId={folder.folder_id} />}
            {activeTab === "invites" && <InvitesPanel folderId={folder.folder_id} />}
            {activeTab === "settings" && (
              <SettingsPanel folder={folder} permissions={permissions} currentRole={currentRole} onUpdated={loadDetail} />
            )}
          </section>
        </div>
      </div>

      {showAdd && <AddDocumentDialog folderId={folder.folder_id} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); loadDocuments(); loadDetail(); }} />}
      {showEdit && (
        <FolderFormDialog
          title="Chỉnh sửa thư mục"
          initialValue={{ name: folder.name, description: folder.description || "", visibility: folder.visibility }}
          onClose={() => setShowEdit(false)}
          onSubmit={updateFolder}
        />
      )}
    </>
  );
};

export default FolderDetailPage;
