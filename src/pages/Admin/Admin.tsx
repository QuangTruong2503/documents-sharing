import React, { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { Navigate, NavLink, useParams } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  ClipboardList,
  FileText,
  FolderTree,
  Globe2,
  HardDrive,
  ImageOff,
  LayoutDashboard,
  Library,
  MoreVertical,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Save,
  Search,
  ShieldAlert,
  Tags,
  Trash2,
  X,
  UserCog,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import adminApi from "api/adminApi";
import featureUpgradesApi from "api/featureUpgradesApi.ts";
import PageTitle from "components/PageTitle";
import { normalizeUser } from "utils/userMapper";

const PAGE_SIZE = 8;
const TAXONOMY_PAGE_SIZE = 10;

const tabs = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "documents", label: "Tài liệu", icon: FileText },
  { id: "reports", label: "Báo cáo", icon: ShieldAlert },
  { id: "categories", label: "Chuyên mục", icon: FolderTree },
  { id: "tags", label: "Thẻ", icon: Tags },
  { id: "collections", label: "Bộ sưu tập", icon: Library },
  { id: "analytics", label: "Thống kê", icon: BarChart3 },
  { id: "engagement", label: "Tương tác", icon: BarChart3 },
  { id: "audit", label: "Audit logs", icon: ClipboardList },
  { id: "seo", label: "SEO", icon: Globe2 },
];

const reportStatuses = ["Chờ giải quyết", "Đang xử lý", "Đã xử lý", "Từ chối"];
const reportStatusTones: Record<string, string> = {
  "Chờ giải quyết": "warning",
  "Đang xử lý": "info",
  "Đã xử lý": "success",
  "Từ chối": "danger",
};

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? null;
const unwrapList = (response: any) => {
  const body = response?.data ?? {};
  return {
    data: body.data ?? [],
    pagination: body.pagination ?? {
      currentPage: 1,
      pageSize: PAGE_SIZE,
      totalCount: Array.isArray(body.data) ? body.data.length : 0,
      totalPages: 1,
    },
  };
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatNumber = (value?: number) => (value ?? 0).toLocaleString("vi-VN");
const ownerName = (owner: any) => owner?.full_name || owner?.username || owner?.email || "-";
const storageUnits = {
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
};
const formatStorageLimit = (bytes?: number | null) => {
  if (!bytes) return "Chưa thiết lập";
  if (bytes >= storageUnits.GB) {
    return `${(bytes / storageUnits.GB).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} GB`;
  }
  return `${(bytes / storageUnits.MB).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} MB`;
};

const canAccessAdmin = () => {
  const token = Cookies.get("token");
  const userStr = Cookies.get("user");

  if (!token || !userStr) return false;

  try {
    const user = normalizeUser(JSON.parse(userStr));
    return user.role?.toLowerCase() === "admin";
  } catch {
    Cookies.remove("user");
    return false;
  }
};

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-amber-50 text-amber-700 ring-amber-100",
    danger: "bg-red-50 text-red-700 ring-red-100",
    info: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    neutral: "bg-gray-50 text-gray-700 ring-gray-100",
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-ink-secondary">
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <RefreshCw className="h-7 w-7 animate-spin text-primary" />
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-field pl-9"
      />
    </label>
  );
}

function PaginationBar({ pagination, onPageChange }: { pagination: any; onPageChange: (page: number) => void }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary">
      <span>
        Trang {pagination.currentPage}/{pagination.totalPages} - {formatNumber(pagination.totalCount)} mục
      </span>
      <div className="flex gap-2">
        <button
          className="btn-secondary px-3 py-2"
          disabled={pagination.currentPage <= 1}
          onClick={() => onPageChange(pagination.currentPage - 1)}
          title="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
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
}

function AdminTable({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getDashboard()
      .then((response) => setData(unwrap(response)))
      .catch(() => toast.error("Không tải được dữ liệu tổng quan"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const totals = data?.totals ?? {};
  const last30Days = data?.last30Days ?? {};
  const cards = [
    ["Người dùng", totals.users, `+${formatNumber(last30Days.newUsers)} trong 30 ngày`, Users],
    ["Tài liệu", totals.documents, `${formatNumber(totals.publicDocuments)} công khai`, FileText],
    ["Báo cáo", totals.reports, `${formatNumber(totals.pendingReports)} đang chờ`, ShieldAlert],
    ["Lượt tải", totals.downloads, `${formatNumber(totals.collections)} bộ sưu tập`, Boxes],
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, hint, Icon]: any) => (
          <div key={label} className="surface-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink-secondary">{label}</p>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold text-ink">{formatNumber(value)}</p>
            <p className="mt-1 text-sm text-ink-secondary">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Tài liệu mới</h2>
          <div className="space-y-3">
            {(data?.recentDocuments ?? []).map((doc: any) => (
              <div key={doc.document_id} className="flex items-center gap-3 rounded-md border border-line p-3">
                <img src={doc.thumbnail_url || "/logo.ico"} alt="" className="h-14 w-11 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{doc.title}</p>
                  <p className="text-sm text-ink-secondary">{ownerName(doc.owner)} - {formatDate(doc.uploaded_at)}</p>
                </div>
                <Badge tone={doc.is_public ? "success" : "neutral"}>{doc.is_public ? "Công khai" : "Riêng tư"}</Badge>
              </div>
            ))}
            {(data?.recentDocuments ?? []).length === 0 && <EmptyState message="Chưa có tài liệu mới." />}
          </div>
        </section>

        <section className="surface-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Báo cáo gần đây</h2>
          <div className="space-y-3">
            {(data?.recentReports ?? []).map((report: any) => (
              <div key={report.report_id} className="rounded-md border border-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{report.document?.title}</p>
                  <Badge tone="warning">{report.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-secondary">{report.reason}</p>
                <p className="mt-2 text-xs text-neutral">{formatDate(report.created_at)}</p>
              </div>
            ))}
            {(data?.recentReports ?? []).length === 0 && <EmptyState message="Không có báo cáo gần đây." />}
          </div>
        </section>
      </div>
    </div>
  );
}

function UsersView() {
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [quotaModal, setQuotaModal] = useState<{ user: any; value: string; unit: "MB" | "GB" } | null>(null);
  const [renameModal, setRenameModal] = useState<{ user: any; fullName: string } | null>(null);
  const [actionMenu, setActionMenu] = useState<{ userId: string; top: number; left: number } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .getUsers({ PageNumber: page, PageSize: PAGE_SIZE, search, role, sortBy: "created_at", sortDirection: "desc" })
      .then((response) => {
        const result = unwrapList(response);
        setRows(result.data);
        setPagination(result.pagination);
      })
      .catch(() => toast.error("Không tải được danh sách người dùng"))
      .finally(() => setLoading(false));
  }, [page, role, search]);

  useEffect(load, [load]);

  const updateUser = async (user: any, patch: any) => {
    try {
      await adminApi.updateUser(user.user_id, patch);
      toast.success("Đã cập nhật người dùng");
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không cập nhật được người dùng");
    }
  };

  const deleteUser = async (user: any) => {
    if (!window.confirm(`Xóa người dùng ${user.username}?`)) return;
    try {
      await adminApi.deleteUser(user.user_id);
      toast.success("Đã xóa người dùng");
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không xóa được người dùng");
    }
  };

  const openQuotaModal = (user: any) => {
    const currentBytes = user.storage_limit_bytes ?? user.storageLimitBytes ?? storageUnits.GB;
    const unit = currentBytes >= storageUnits.GB ? "GB" : "MB";
    const value = currentBytes / storageUnits[unit];
    setQuotaModal({
      user,
      unit,
      value: Number.isInteger(value) ? String(value) : value.toFixed(2),
    });
  };

  const submitQuota = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quotaModal) return;

    const amount = Number(quotaModal.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Dung lượng phải là số hợp lệ lớn hơn 0.");
      return;
    }

    setActionBusy(true);
    try {
      await featureUpgradesApi.updateUserStorage(quotaModal.user.user_id, Math.round(amount * storageUnits[quotaModal.unit]));
      toast.success("Đã cập nhật dung lượng người dùng");
      setQuotaModal(null);
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không cập nhật được dung lượng");
    } finally {
      setActionBusy(false);
    }
  };

  const submitRename = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!renameModal) return;

    const fullName = renameModal.fullName.trim();
    if (fullName.length < 2) {
      toast.error("Tên hiển thị cần ít nhất 2 ký tự.");
      return;
    }

    setActionBusy(true);
    try {
      await adminApi.updateUser(renameModal.user.user_id, { full_name: fullName, fullName });
      toast.success("Đã đổi tên người dùng");
      setRenameModal(null);
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không đổi được tên người dùng");
    } finally {
      setActionBusy(false);
    }
  };

  const removeAvatar = async (user: any) => {
    if (!window.confirm(`Xóa avatar của ${user.full_name || user.username || user.email}?`)) return;
    setActionBusy(true);
    try {
      await adminApi.updateUser(user.user_id, { avatar_url: null, avatarUrl: null, avatar: null });
      toast.success("Đã xóa avatar người dùng");
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không xóa được avatar");
    } finally {
      setActionBusy(false);
    }
  };

  const handleUserAction = (user: any, action: string) => {
    setActionMenu(null);
    if (action === "quota") openQuotaModal(user);
    if (action === "rename") setRenameModal({ user, fullName: user.full_name || user.fullName || "" });
    if (action === "remove-avatar") removeAvatar(user);
    if (action === "toggle-role") updateUser(user, { role: user.role === "admin" ? "user" : "admin" });
    if (action === "delete") deleteUser(user);
  };

  return (
    <>
      {actionMenu && (
        <button
          type="button"
          aria-label="Đóng menu thao tác"
          className="fixed inset-0 z-30 cursor-default bg-transparent"
          onClick={() => setActionMenu(null)}
        />
      )}
      <section className="surface-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Tìm email, username, họ tên" />
          <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="input-field w-full md:w-44">
            <option value="">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {loading ? <LoadingState /> : (
          <AdminTable>
            <table className="min-w-[900px] divide-y divide-line text-sm lg:min-w-full">
              <thead className="bg-gray-50 text-left text-xs uppercase text-ink-secondary">
                <tr>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Xác minh</th>
                  <th className="px-4 py-3">Tài liệu</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar_url || user.avatarUrl || "/logo.ico"} alt="" className="h-9 w-9 rounded-full object-cover" />
                        <div>
                          <p className="font-medium">{user.full_name || user.fullName || user.username}</p>
                          <p className="text-xs text-ink-secondary">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.role === "admin" ? "info" : "neutral"}>{user.role || "user"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.is_verified ? "success" : "warning"}>{user.is_verified ? "Đã xác minh" : "Chưa xác minh"}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatNumber(user.document_count)}</td>
                    <td className="px-4 py-3">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-flex justify-end">
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={(event) => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            setActionMenu((current) =>
                              current?.userId === user.user_id
                                ? null
                                : {
                                    userId: user.user_id,
                                    top: rect.bottom + 8,
                                    left: Math.max(12, rect.right - 224),
                                  }
                            );
                          }}
                          className="btn-secondary px-3 py-2"
                          title="Mở menu thao tác"
                          aria-haspopup="menu"
                          aria-expanded={actionMenu?.userId === user.user_id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {actionMenu?.userId === user.user_id && (
                          <div
                            className="fixed z-[70] w-56 overflow-hidden rounded-md border border-line bg-surface text-left shadow-card"
                            style={{ top: actionMenu.top, left: actionMenu.left }}
                          >
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-gray-50"
                              onClick={() => handleUserAction(user, "quota")}
                            >
                              <HardDrive className="h-4 w-4 text-primary" />
                              Set dung lượng
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-gray-50"
                              onClick={() => handleUserAction(user, "rename")}
                            >
                              <Pencil className="h-4 w-4 text-primary" />
                              Đổi tên
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-gray-50"
                              onClick={() => handleUserAction(user, "remove-avatar")}
                            >
                              <ImageOff className="h-4 w-4 text-primary" />
                              Xóa avatar
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-gray-50"
                              onClick={() => handleUserAction(user, "toggle-role")}
                            >
                              <ShieldCheck className="h-4 w-4 text-primary" />
                              {user.role === "admin" ? "Đặt làm user" : "Đặt làm admin"}
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 border-t border-line px-3 py-2.5 text-sm text-danger hover:bg-red-50"
                              onClick={() => handleUserAction(user, "delete")}
                            >
                              <UserX className="h-4 w-4" />
                              Xóa người dùng
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <EmptyState message="Không tìm thấy người dùng." />}
          </AdminTable>
        )}
        <PaginationBar pagination={pagination} onPageChange={setPage} />
      </section>

      {quotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <form onSubmit={submitQuota} className="surface-card w-full max-w-md bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">Set dung lượng người dùng</h3>
                <p className="mt-1 text-sm text-ink-secondary">{quotaModal.user.email}</p>
              </div>
              <button type="button" onClick={() => setQuotaModal(null)} className="btn-secondary px-3 py-2" title="Đóng">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 rounded-md border border-line bg-canvas p-3 text-sm">
              <span className="text-ink-secondary">Dung lượng hiện tại</span>
              <p className="mt-1 font-semibold text-ink">
                {formatStorageLimit(quotaModal.user.storage_limit_bytes ?? quotaModal.user.storageLimitBytes)}
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px]">
              <label>
                <span className="mb-1 block text-sm font-medium text-ink-secondary">Dung lượng</span>
                <input
                  value={quotaModal.value}
                  onChange={(event) => setQuotaModal({ ...quotaModal, value: event.target.value })}
                  className="input-field"
                  inputMode="decimal"
                  placeholder="Ví dụ: 500"
                  required
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-ink-secondary">Đơn vị</span>
                <select
                  value={quotaModal.unit}
                  onChange={(event) => setQuotaModal({ ...quotaModal, unit: event.target.value as "MB" | "GB" })}
                  className="input-field"
                >
                  <option value="MB">MB</option>
                  <option value="GB">GB</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setQuotaModal(null)}>Hủy</button>
              <button type="submit" className="btn-primary" disabled={actionBusy}>
                {actionBusy ? "Đang lưu..." : "Lưu dung lượng"}
              </button>
            </div>
          </form>
        </div>
      )}

      {renameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <form onSubmit={submitRename} className="surface-card w-full max-w-md bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">Đổi tên người dùng</h3>
                <p className="mt-1 text-sm text-ink-secondary">{renameModal.user.email}</p>
              </div>
              <button type="button" onClick={() => setRenameModal(null)} className="btn-secondary px-3 py-2" title="Đóng">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-5 block">
              <span className="mb-1 block text-sm font-medium text-ink-secondary">Tên hiển thị</span>
              <input
                value={renameModal.fullName}
                onChange={(event) => setRenameModal({ ...renameModal, fullName: event.target.value })}
                className="input-field"
                placeholder="Nhập tên mới"
                maxLength={120}
                required
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setRenameModal(null)}>Hủy</button>
              <button type="submit" className="btn-primary" disabled={actionBusy}>
                {actionBusy ? "Đang lưu..." : "Lưu tên"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function DocumentsView() {
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .getDocuments({
        PageNumber: page,
        PageSize: PAGE_SIZE,
        search,
        isPublic: visibility === "" ? undefined : visibility === "true",
        sortBy: "uploaded_at",
        sortDirection: "desc",
      })
      .then((response) => {
        const result = unwrapList(response);
        setRows(result.data);
        setPagination(result.pagination);
      })
      .catch(() => toast.error("Không tải được danh sách tài liệu"))
      .finally(() => setLoading(false));
  }, [page, search, visibility]);

  useEffect(load, [load]);

  const toggleVisibility = async (doc: any) => {
    await adminApi.updateDocument(doc.document_id, { isPublic: !doc.is_public });
    toast.success("Đã cập nhật tài liệu");
    load();
  };

  const deleteDocument = async (doc: any) => {
    if (!window.confirm(`Xóa tài liệu "${doc.title}"?`)) return;
    await adminApi.deleteDocument(doc.document_id);
    toast.success("Đã xóa tài liệu");
    load();
  };

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Tìm tiêu đề, mô tả, chủ sở hữu" />
        <select value={visibility} onChange={(event) => { setVisibility(event.target.value); setPage(1); }} className="input-field w-full md:w-44">
          <option value="">Tất cả</option>
          <option value="true">Công khai</option>
          <option value="false">Riêng tư</option>
        </select>
      </div>
      {loading ? <LoadingState /> : (
        <AdminTable>
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-ink-secondary">
              <tr>
                <th className="px-4 py-3">Tài liệu</th>
                <th className="px-4 py-3">Chủ sở hữu</th>
                <th className="px-4 py-3">Tương tác</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tải</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((doc) => (
                <tr key={doc.document_id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={doc.thumbnail_url || "/logo.ico"} alt="" className="h-14 w-11 rounded object-cover" />
                      <div className="max-w-xs">
                        <p className="truncate font-medium">{doc.title}</p>
                        <p className="text-xs text-ink-secondary">{doc.file_type?.toUpperCase()} - {formatNumber(doc.pages)} trang</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{ownerName(doc.owner)}</td>
                  <td className="px-4 py-3">{formatNumber(doc.download_count)} tải - {formatNumber(doc.report_count)} báo cáo</td>
                  <td className="px-4 py-3"><Badge tone={doc.is_public ? "success" : "neutral"}>{doc.is_public ? "Công khai" : "Riêng tư"}</Badge></td>
                  <td className="px-4 py-3">{formatDate(doc.uploaded_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary px-3 py-2" onClick={() => toggleVisibility(doc)}>
                        {doc.is_public ? "Ẩn" : "Mở"}
                      </button>
                      <button className="btn-secondary px-3 py-2 text-danger" onClick={() => deleteDocument(doc)} title="Xóa">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState message="Không tìm thấy tài liệu." />}
        </AdminTable>
      )}
      <PaginationBar pagination={pagination} onPageChange={setPage} />
    </section>
  );
}

function ReportsView() {
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .getReports({ PageNumber: page, PageSize: PAGE_SIZE, status, documentId, userId })
      .then((response) => {
        const result = unwrapList(response);
        setRows(result.data);
        setPagination(result.pagination);
      })
      .catch(() => toast.error("Không tải được danh sách báo cáo"))
      .finally(() => setLoading(false));
  }, [documentId, page, status, userId]);

  useEffect(load, [load]);

  const updateStatus = async (report: any, nextStatus: string) => {
    setUpdatingId(report.report_id);
    try {
      const response = await adminApi.updateReport(report.report_id, { status: nextStatus });
      toast.success("Đã cập nhật báo cáo");
      const updatedReport = unwrap(response);
      if (selectedReport?.report_id === report.report_id) {
        setSelectedReport(updatedReport ?? { ...selectedReport, status: nextStatus });
      }
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không cập nhật được báo cáo");
    } finally {
      setUpdatingId(null);
    }
  };

  const openReport = async (report: any) => {
    setSelectedReport(report);
    setDetailLoading(true);
    try {
      const response = await adminApi.getReport(report.report_id);
      setSelectedReport(unwrap(response) ?? report);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không tải được chi tiết báo cáo");
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteReport = async (report: any) => {
    if (!window.confirm(`Xóa báo cáo #${report.report_id}?`)) return;
    try {
      await adminApi.deleteReport(report.report_id);
      toast.success("Đã xóa báo cáo");
      if (selectedReport?.report_id === report.report_id) setSelectedReport(null);
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không xóa được báo cáo");
    }
  };

  return (
    <div className="space-y-5">
      <section className="surface-card overflow-hidden">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 xl:grid-cols-[220px_minmax(180px,1fr)_minmax(180px,1fr)_auto]">
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="input-field">
            <option value="">Tất cả trạng thái</option>
            {reportStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input
            value={documentId}
            onChange={(event) => { setDocumentId(event.target.value.replace(/\D/g, "")); setPage(1); }}
            className="input-field"
            placeholder="Lọc theo document ID"
          />
          <input
            value={userId}
            onChange={(event) => { setUserId(event.target.value.trim()); setPage(1); }}
            className="input-field"
            placeholder="Lọc theo user ID"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setStatus("");
              setDocumentId("");
              setUserId("");
              setPage(1);
            }}
          >
            Xóa lọc
          </button>
        </div>
        {loading ? <LoadingState /> : (
          <AdminTable>
            <table className="min-w-[980px] divide-y divide-line text-sm lg:min-w-full">
              <thead className="bg-gray-50 text-left text-xs uppercase text-ink-secondary">
                <tr>
                  <th className="px-4 py-3">Tài liệu</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Người báo cáo</th>
                  <th className="px-4 py-3">Lý do</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="hidden px-4 py-3 xl:table-cell">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((report) => (
                  <tr key={report.report_id} className={selectedReport?.report_id === report.report_id ? "bg-primary-soft/40" : undefined}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{report.document?.title || `#${report.document_id}`}</p>
                      <p className="mt-1 text-xs text-neutral">Document #{report.document_id}</p>
                      <p className="mt-1 text-xs text-ink-secondary lg:hidden">{ownerName(report.reporter)}</p>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">{ownerName(report.reporter)}</td>
                    <td className="max-w-sm px-4 py-3 text-ink-secondary">
                      <p className="line-clamp-2">{report.reason}</p>
                      <p className="mt-1 text-xs text-neutral xl:hidden">{formatDate(report.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <Badge tone={reportStatusTones[report.status] ?? "neutral"}>{report.status}</Badge>
                        <select
                          value={report.status}
                          disabled={updatingId === report.report_id}
                          onChange={(event) => updateStatus(report, event.target.value)}
                          className="block w-full rounded-md border border-line bg-white px-2 py-1 text-xs"
                        >
                          {reportStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 xl:table-cell">{formatDate(report.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary px-3 py-2" onClick={() => openReport(report)} title="Xem chi tiết">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="btn-secondary px-3 py-2 text-danger hover:border-danger hover:text-danger" onClick={() => deleteReport(report)} title="Xóa">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <EmptyState message="Không có báo cáo phù hợp." />}
          </AdminTable>
        )}
        <PaginationBar pagination={pagination} onPageChange={setPage} />
      </section>

      {selectedReport && (
        <div className="fixed inset-0 z-50 p-3 sm:flex sm:justify-end sm:p-5">
          <aside className="surface-card ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-surface shadow-card">
            <div className="flex items-start justify-between gap-3 border-b border-line p-4">
              <div>
                <h3 className="text-lg font-semibold text-ink">Chi tiết moderation</h3>
                <p className="mt-1 text-sm text-ink-secondary">Xem tài liệu, reporter và thao tác xử lý report.</p>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} className="btn-secondary px-3 py-2" title="Đóng">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {detailLoading ? (
                <LoadingState />
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="overflow-hidden rounded-md border border-line">
                    <img
                      src={selectedReport.document?.thumbnail_url || "/logo.ico"}
                      alt=""
                      className="h-44 w-full object-cover"
                    />
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-ink">{selectedReport.document?.title || `Tài liệu #${selectedReport.document_id}`}</p>
                        <Badge tone={reportStatusTones[selectedReport.status] ?? "neutral"}>{selectedReport.status}</Badge>
                      </div>
                      <p className="mt-2 line-clamp-3 text-ink-secondary">
                        {selectedReport.document?.description || "Không có mô tả tài liệu."}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-canvas p-3">
                    <p className="text-xs font-semibold uppercase text-neutral">Lý do báo cáo</p>
                    <p className="mt-2 whitespace-pre-wrap text-ink-secondary">{selectedReport.reason}</p>
                  </div>

                  <dl className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral">Reporter</dt>
                      <dd className="font-medium text-ink">{ownerName(selectedReport.reporter)}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral">Ngày tạo</dt>
                      <dd className="font-medium text-ink">{formatDate(selectedReport.created_at)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-neutral">Email</dt>
                      <dd className="break-all font-medium text-ink">{selectedReport.reporter?.email || "-"}</dd>
                    </div>
                  </dl>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink-secondary">Cập nhật trạng thái</span>
                    <select
                      value={selectedReport.status}
                      disabled={updatingId === selectedReport.report_id}
                      onChange={(event) => updateStatus(selectedReport, event.target.value)}
                      className="input-field"
                    >
                      {reportStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                </div>
              )}
            </div>

            {!detailLoading && (
              <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4">
                <NavLink to={`/document/${selectedReport.document_id}`} target="_blank" className="btn-primary">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Mở tài liệu
                </NavLink>
                <button
                  type="button"
                  className="btn-secondary text-danger hover:border-danger hover:text-danger"
                  onClick={() => deleteReport(selectedReport)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa report
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function TaxonomyView({ type }: { type: "categories" | "tags" }) {
  const isCategory = type === "categories";
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ id: "", name: "", description: "", parentId: "" });

  const load = useCallback(() => {
    setLoading(true);
    const request = isCategory ? adminApi.getCategories({ search }) : adminApi.getTags({ search });
    request
      .then((response) => setRows(unwrap(response) ?? []))
      .catch(() => toast.error(`Không tải được ${isCategory ? "chuyên mục" : "thẻ"}`))
      .finally(() => setLoading(false));
  }, [isCategory, search]);

  useEffect(() => {
    const timeout = window.setTimeout(load, 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(rows.length / TAXONOMY_PAGE_SIZE));
  const visibleRows = useMemo(
    () => rows.slice((page - 1) * TAXONOMY_PAGE_SIZE, page * TAXONOMY_PAGE_SIZE),
    [page, rows]
  );
  const pagination = {
    currentPage: Math.min(page, totalPages),
    pageSize: TAXONOMY_PAGE_SIZE,
    totalCount: rows.length,
    totalPages,
  };

  useEffect(() => {
    setPage(1);
  }, [search, type]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const createItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    if (isCategory) {
      await adminApi.createCategory({
        categoryId: form.id || undefined,
        name: form.name,
        description: form.description || undefined,
        parentId: form.parentId || undefined,
      });
    } else {
      await adminApi.createTag({ tagId: form.id || undefined, name: form.name });
    }
    toast.success(`Đã tạo ${isCategory ? "chuyên mục" : "thẻ"}`);
    setForm({ id: "", name: "", description: "", parentId: "" });
    load();
  };

  const deleteItem = async (item: any) => {
    const id = isCategory ? item.category_id : item.tag_id;
    if (!window.confirm(`Xóa ${item.name}?`)) return;
    if (isCategory) await adminApi.deleteCategory(id);
    else await adminApi.deleteTag(id);
    toast.success("Đã xóa");
    load();
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <form onSubmit={createItem} className="surface-card h-fit p-4">
        <h2 className="mb-4 text-lg font-semibold">Tạo {isCategory ? "chuyên mục" : "thẻ"}</h2>
        <div className="space-y-3">
          <input className="input-field" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="ID tùy chọn" />
          <input className="input-field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Tên" />
          {isCategory && (
            <>
              <textarea className="input-field min-h-24" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Mô tả" />
              <input className="input-field" value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })} placeholder="Parent ID" />
            </>
          )}
          <button className="btn-primary w-full" type="submit"><CheckCircle2 className="mr-2 h-4 w-4" />Tạo mới</button>
        </div>
      </form>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <SearchInput value={search} onChange={setSearch} placeholder={`Tìm ${isCategory ? "chuyên mục" : "thẻ"}`} />
            <span className="text-sm text-ink-secondary">
              Hiển thị {TAXONOMY_PAGE_SIZE} dòng/trang
            </span>
          </div>
        </div>
        {loading ? <LoadingState /> : (
          <>
            <AdminTable>
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Tên</th>
                    <th className="px-4 py-3">ID</th>
                    {isCategory && <th className="px-4 py-3">Parent</th>}
                    <th className="px-4 py-3">Tài liệu</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleRows.map((item) => (
                    <tr key={isCategory ? item.category_id : item.tag_id}>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-ink-secondary">{isCategory ? item.category_id : item.tag_id}</td>
                      {isCategory && <td className="px-4 py-3 text-ink-secondary">{item.parent_id || "-"}</td>}
                      <td className="px-4 py-3">{formatNumber(item.document_count)}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="btn-secondary px-3 py-2 text-danger" onClick={() => deleteItem(item)} title="Xóa">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <EmptyState message={`Không tìm thấy ${isCategory ? "chuyên mục" : "thẻ"}.`} />}
            </AdminTable>
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}

function CollectionsView() {
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .getCollections({ PageNumber: page, PageSize: PAGE_SIZE, search })
      .then((response) => {
        const result = unwrapList(response);
        setRows(result.data);
        setPagination(result.pagination);
      })
      .catch(() => toast.error("Không tải được bộ sưu tập"))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(load, [load]);

  const deleteCollection = async (collection: any) => {
    if (!window.confirm(`Xóa bộ sưu tập "${collection.name}"?`)) return;
    await adminApi.deleteCollection(collection.collection_id);
    toast.success("Đã xóa bộ sưu tập");
    load();
  };

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-line p-4">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Tìm bộ sưu tập" />
      </div>
      {loading ? <LoadingState /> : (
        <AdminTable>
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-ink-secondary">
              <tr>
                <th className="px-4 py-3">Bộ sưu tập</th>
                <th className="px-4 py-3">Chủ sở hữu</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Tài liệu</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((collection) => (
                <tr key={collection.collection_id}>
                  <td className="px-4 py-3 font-medium">{collection.name}</td>
                  <td className="px-4 py-3">{ownerName(collection.owner)}</td>
                  <td className="px-4 py-3"><Badge tone={collection.is_public ? "success" : "neutral"}>{collection.is_public ? "Công khai" : "Riêng tư"}</Badge></td>
                  <td className="px-4 py-3">{formatNumber(collection.document_count)}</td>
                  <td className="px-4 py-3">{formatDate(collection.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-secondary px-3 py-2 text-danger" onClick={() => deleteCollection(collection)} title="Xóa">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState message="Không tìm thấy bộ sưu tập." />}
        </AdminTable>
      )}
      <PaginationBar pagination={pagination} onPageChange={setPage} />
    </section>
  );
}

function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getDocumentAnalytics({ days })
      .then((response) => setData(unwrap(response)))
      .catch(() => toast.error("Không tải được thống kê"))
      .finally(() => setLoading(false));
  }, [days]);

  const maxUpload = useMemo(() => Math.max(1, ...(data?.uploads ?? []).map((item: any) => item.count)), [data]);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="input-field w-40">
          <option value={7}>7 ngày</option>
          <option value={30}>30 ngày</option>
          <option value={90}>90 ngày</option>
          <option value={365}>365 ngày</option>
        </select>
      </div>
      {loading ? <LoadingState /> : (
        <>
          <section className="surface-card p-4">
            <h2 className="mb-4 text-lg font-semibold">Lượt upload</h2>
            <div className="flex h-56 items-end gap-2 overflow-x-auto border-b border-line pb-2">
              {(data?.uploads ?? []).map((item: any) => (
                <div key={item.date} className="flex min-w-8 flex-col items-center gap-2">
                  <div className="w-full rounded-t bg-primary" style={{ height: `${(item.count / maxUpload) * 190}px` }} title={`${item.date}: ${item.count}`} />
                  <span className="text-[10px] text-neutral">{item.date.slice(5)}</span>
                </div>
              ))}
              {(data?.uploads ?? []).length === 0 && <EmptyState message="Chưa có dữ liệu upload." />}
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="surface-card p-4">
              <h2 className="mb-4 text-lg font-semibold">Tài liệu tải nhiều</h2>
              <div className="space-y-3">
                {(data?.topDocuments ?? []).map((doc: any) => (
                  <div key={doc.document_id} className="flex items-center gap-3 rounded-md border border-line p-3">
                    <img src={doc.thumbnail_url || "/logo.ico"} alt="" className="h-12 w-10 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{doc.title}</p>
                      <p className="text-sm text-ink-secondary">{ownerName(doc.owner)}</p>
                    </div>
                    <Badge tone="info">{formatNumber(doc.download_count)} tải</Badge>
                  </div>
                ))}
              </div>
            </section>
            <section className="surface-card p-4">
              <h2 className="mb-4 text-lg font-semibold">Phân bổ chuyên mục</h2>
              <div className="space-y-3">
                {(data?.categoryDistribution ?? []).map((category: any) => (
                  <div key={category.category_id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-ink-secondary">{formatNumber(category.document_count)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-secondary" style={{ width: `${Math.min(100, category.document_count)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function EngagementView() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    featureUpgradesApi
      .getEngagementAnalytics({ days })
      .then((response) => setData(response.data ?? response))
      .catch(() => toast.error("Không tải được engagement analytics"))
      .finally(() => setLoading(false));
  }, [days]);

  const dailyViews = data?.dailyViews ?? [];
  const dailyDownloads = data?.dailyDownloads ?? [];
  const maxValue = Math.max(1, ...dailyViews.map((item: any) => item.count ?? item.views ?? 0), ...dailyDownloads.map((item: any) => item.count ?? item.downloads ?? 0));

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="input-field w-40">
          <option value={7}>7 ngày</option>
          <option value={30}>30 ngày</option>
          <option value={90}>90 ngày</option>
        </select>
      </div>
      {loading ? <LoadingState /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card p-4">
              <p className="text-sm font-medium text-ink-secondary">Tổng lượt xem</p>
              <p className="mt-3 text-3xl font-bold text-ink">{formatNumber(data?.totalViews)}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-sm font-medium text-ink-secondary">Tổng lượt tải</p>
              <p className="mt-3 text-3xl font-bold text-ink">{formatNumber(data?.totalDownloads)}</p>
            </div>
          </div>
          <section className="surface-card p-4">
            <h2 className="mb-4 text-lg font-semibold">Views và downloads theo ngày</h2>
            <div className="flex h-64 items-end gap-3 overflow-x-auto border-b border-line pb-2">
              {dailyViews.map((viewItem: any, index: number) => {
                const downloadItem = dailyDownloads[index] ?? {};
                const date = viewItem.date ?? downloadItem.date ?? "";
                const views = viewItem.count ?? viewItem.views ?? 0;
                const downloads = downloadItem.count ?? downloadItem.downloads ?? 0;
                return (
                  <div key={`${date}-${index}`} className="flex min-w-10 flex-col items-center gap-2">
                    <div className="flex h-52 items-end gap-1">
                      <div className="w-4 rounded-t bg-primary" style={{ height: `${(views / maxValue) * 200}px` }} title={`${date}: ${views} views`} />
                      <div className="w-4 rounded-t bg-secondary" style={{ height: `${(downloads / maxValue) * 200}px` }} title={`${date}: ${downloads} downloads`} />
                    </div>
                    <span className="text-[10px] text-neutral">{String(date).slice(5)}</span>
                  </div>
                );
              })}
              {dailyViews.length === 0 && <EmptyState message="Chưa có dữ liệu tương tác." />}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-ink-secondary">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Views</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-secondary" />Downloads</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function AuditLogsView() {
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ entityType: "", action: "", actorUserId: "" });

  const load = useCallback(() => {
    setLoading(true);
    featureUpgradesApi
      .getAuditLogs({ PageNumber: page, PageSize: 50, ...filters })
      .then((response) => {
        const body = response.data ?? response;
        setRows(body.auditLogs || body.logs || body.data || []);
        setPagination(body.pagination ?? { currentPage: page, totalPages: 1, totalCount: 0 });
      })
      .catch(() => toast.error("Không tải được audit logs"))
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(load, [load]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  return (
    <section className="surface-card overflow-hidden">
      <div className="grid gap-3 border-b border-line p-4 md:grid-cols-3">
        <input value={filters.action} onChange={(event) => updateFilter("action", event.target.value)} className="input-field" placeholder="Action: comment.created" />
        <input value={filters.entityType} onChange={(event) => updateFilter("entityType", event.target.value)} className="input-field" placeholder="Entity type: document" />
        <input value={filters.actorUserId} onChange={(event) => updateFilter("actorUserId", event.target.value)} className="input-field" placeholder="Actor user id" />
      </div>
      {loading ? <LoadingState /> : (
        <AdminTable>
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-ink-secondary">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row, index) => (
                <tr key={row.id || row.auditLogId || index}>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(row.createdAt || row.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{row.action}</td>
                  <td className="px-4 py-3">{row.entityType || row.entity_type} #{row.entityId || row.entity_id || "-"}</td>
                  <td className="px-4 py-3 text-ink-secondary">{row.actorUserId || row.actor_user_id || row.actor?.email || "-"}</td>
                  <td className="max-w-sm truncate px-4 py-3 text-ink-secondary">{row.description || row.message || JSON.stringify(row.metadata || row.details || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState message="Không có audit log phù hợp." />}
        </AdminTable>
      )}
      <PaginationBar pagination={pagination} onPageChange={setPage} />
    </section>
  );
}

const defaultSeoForm = {
  siteName: "DocShare",
  siteUrl: "https://docshare.id.vn",
  defaultTitle: "DocShare - Nền tảng chia sẻ tài liệu học tập",
  defaultDescription:
    "DocShare là nền tảng lưu trữ, tìm kiếm và chia sẻ tài liệu học tập miễn phí cho học sinh, sinh viên và cộng đồng tự học.",
  defaultImage: "https://docshare.id.vn/og-image.svg",
  locale: "vi_VN",
};

const defaultRobots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /my-documents
Disallow: /my-collections
Disallow: /my-reports

Sitemap: https://docshare.id.vn/sitemap.xml`;

function SeoView() {
  const [form, setForm] = useState(defaultSeoForm);
  const [robots, setRobots] = useState(defaultRobots);
  const [routesText, setRoutesText] = useState("/\n/search/tai-lieu\n/login\n/register");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      adminApi.getSeoSettings(),
      adminApi.getRobotsTxt(),
      adminApi.getSitemapRoutes(),
    ])
      .then(([settingsResult, robotsResult, routesResult]) => {
        if (settingsResult.status === "fulfilled") {
          setForm({ ...defaultSeoForm, ...(unwrap(settingsResult.value) ?? {}) });
        }
        if (robotsResult.status === "fulfilled") {
          const data = unwrap(robotsResult.value);
          setRobots(data?.content ?? data ?? defaultRobots);
        }
        if (routesResult.status === "fulfilled") {
          const routes = unwrap(routesResult.value);
          if (Array.isArray(routes)) {
            setRoutesText(routes.map((item: any) => item.path ?? item).join("\n"));
          }
        }
      })
      .catch(() => toast.error("Không tải được cấu hình SEO"))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field: keyof typeof defaultSeoForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSeoSettings(form);
      toast.success("Đã lưu cấu hình SEO");
    } catch {
      toast.error("Backend chưa hỗ trợ lưu cấu hình SEO");
    } finally {
      setSaving(false);
    }
  };

  const saveRobots = async () => {
    setSaving(true);
    try {
      await adminApi.updateRobotsTxt({ content: robots });
      toast.success("Đã lưu robots.txt");
    } catch {
      toast.error("Backend chưa hỗ trợ cập nhật robots.txt");
    } finally {
      setSaving(false);
    }
  };

  const generateSitemap = async () => {
    const routes = routesText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await adminApi.updateSitemapRoutes({ routes });
      await adminApi.generateSitemap();
      toast.success("Đã yêu cầu generate sitemap");
    } catch {
      toast.error("Backend chưa hỗ trợ generate sitemap");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <form onSubmit={saveSettings} className="surface-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Metadata mặc định</h2>
            <p className="mt-1 text-sm text-ink-secondary">Dùng làm fallback cho title, description, canonical và Open Graph.</p>
          </div>
          <button className="btn-primary shrink-0" type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Lưu
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">Tên website</span>
            <input className="input-field" value={form.siteName} onChange={(event) => updateField("siteName", event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">Domain chính</span>
            <input className="input-field" value={form.siteUrl} onChange={(event) => updateField("siteUrl", event.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">Title mặc định</span>
            <input className="input-field" value={form.defaultTitle} onChange={(event) => updateField("defaultTitle", event.target.value)} maxLength={70} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">Meta description mặc định</span>
            <textarea className="input-field min-h-28" value={form.defaultDescription} onChange={(event) => updateField("defaultDescription", event.target.value)} maxLength={180} />
            <span className="mt-1 block text-xs text-neutral">{form.defaultDescription.length}/180 ký tự</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">Ảnh Open Graph</span>
            <input className="input-field" value={form.defaultImage} onChange={(event) => updateField("defaultImage", event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">Locale</span>
            <input className="input-field" value={form.locale} onChange={(event) => updateField("locale", event.target.value)} />
          </label>
        </div>
      </form>

      <section className="surface-card p-4">
        <h2 className="text-lg font-semibold">Preview social</h2>
        <div className="mt-4 overflow-hidden rounded-md border border-line bg-white">
          <img src={form.defaultImage || "/og-image.svg"} alt="Ảnh xem trước Open Graph của DocShare" className="h-44 w-full object-cover" />
          <div className="p-4">
            <p className="text-xs uppercase text-neutral">{form.siteUrl}</p>
            <h3 className="mt-1 line-clamp-2 font-semibold text-ink">{form.defaultTitle}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-ink-secondary">{form.defaultDescription}</p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">robots.txt</h2>
          <button className="btn-secondary" onClick={saveRobots} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Lưu robots
          </button>
        </div>
        <textarea className="input-field min-h-64 font-mono text-sm" value={robots} onChange={(event) => setRobots(event.target.value)} />
      </section>

      <section className="surface-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Sitemap routes</h2>
          <button className="btn-primary" onClick={generateSitemap} disabled={saving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate
          </button>
        </div>
        <textarea className="input-field min-h-64 font-mono text-sm" value={routesText} onChange={(event) => setRoutesText(event.target.value)} placeholder="/&#10;/category/cong-nghe&#10;/document/example-id" />
        <p className="mt-2 text-xs text-neutral">Mỗi dòng là một route. Backend nên bổ sung thêm URL động từ tài liệu, chuyên mục, bộ sưu tập công khai.</p>
      </section>
    </div>
  );
}

function AdminContent() {
  const { "*": sectionPath } = useParams();
  const section = sectionPath?.split("/")[0] || "";
  const activeTab = section || "dashboard";
  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  if (!section) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!tabs.some((tab) => tab.id === activeTab)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const content = {
    dashboard: <DashboardView />,
    users: <UsersView />,
    documents: <DocumentsView />,
    reports: <ReportsView />,
    categories: <TaxonomyView type="categories" />,
    tags: <TaxonomyView type="tags" />,
    collections: <CollectionsView />,
    analytics: <AnalyticsView />,
    engagement: <EngagementView />,
    audit: <AuditLogsView />,
    seo: <SeoView />,
  }[activeTab];

  return (
    <>
      <PageTitle
        title="Quản trị"
        description="Khu vực quản trị DocShare."
        robots="noindex, nofollow"
      />
      <div className="min-h-screen py-2">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
              <UserCog className="h-4 w-4" />
              Admin
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-ink">Quản trị DocShare</h1>
            <p className="mt-2 text-ink-secondary">Điều phối người dùng, tài liệu, báo cáo và dữ liệu phân loại.</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <aside className="surface-card h-fit p-2">
            <nav className="grid gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                return (
                  <NavLink
                    key={tab.id}
                    to={`/admin/${tab.id}`}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition ${
                      isActive ? "bg-primary text-white shadow-glow" : "text-ink-secondary hover:bg-gray-50 hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          <main>
            <div className="mb-4 flex items-center gap-2">
              <currentTab.icon className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">{currentTab.label}</h2>
            </div>
            {content}
          </main>
        </div>
      </div>
    </>
  );
}

function Admin() {
  const hasAdminAccess = useMemo(() => canAccessAdmin(), []);

  if (!hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  return <AdminContent />;
}

export default Admin;
