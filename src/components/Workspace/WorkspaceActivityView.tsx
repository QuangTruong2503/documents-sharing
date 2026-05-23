import React from "react";
import { NavLink } from "react-router-dom";
import { Bell, ClipboardList, FileClock, FolderOpen, Link2, ShieldAlert } from "lucide-react";
import { formatDateToVN } from "utils/formatDateToVN";

interface ActivityItem {
  id: string;
  type: "workspace" | "sharing" | "versioning" | "moderation" | "notification" | "audit" | string;
  title: string;
  message?: string | null;
  status?: string | null;
  targetUrl?: string | null;
  createdAt: string;
}

interface WorkspaceActivityData {
  summary?: Record<string, number>;
  sections?: Record<string, ActivityItem[]>;
  timeline?: ActivityItem[];
}

interface WorkspaceActivityViewProps {
  data: WorkspaceActivityData | null;
}

const summaryCards = [
  { key: "myFolders", label: "Thư mục của tôi", icon: FolderOpen },
  { key: "sharedFolders", label: "Thư mục chia sẻ", icon: FolderOpen },
  { key: "activeShareLinks", label: "Link đang bật", icon: Link2 },
  { key: "documentVersions", label: "Phiên bản", icon: FileClock },
  { key: "activeReports", label: "Report đang mở", icon: ShieldAlert },
  { key: "unreadNotifications", label: "Thông báo chưa đọc", icon: Bell },
  { key: "auditEvents", label: "Audit events", icon: ClipboardList },
  { key: "moderationQueue", label: "Queue kiểm duyệt", icon: ShieldAlert },
];

const sectionMeta: Record<string, { title: string; icon: React.ElementType }> = {
  notifications: { title: "Notification", icon: Bell },
  shareLinks: { title: "Sharing", icon: Link2 },
  versions: { title: "Versioning", icon: FileClock },
  reports: { title: "Report / Moderation", icon: ShieldAlert },
  invites: { title: "Workspace / Library", icon: FolderOpen },
  auditLogs: { title: "Audit", icon: ClipboardList },
};

const itemTone: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  unread: "bg-primary-soft text-primary",
  pending: "bg-amber-50 text-amber-700",
  "Chờ giải quyết": "bg-amber-50 text-amber-700",
  revoked: "bg-gray-100 text-gray-600",
  expired: "bg-gray-100 text-gray-600",
};

const formatNumber = (value?: number) => new Intl.NumberFormat("vi-VN").format(value || 0);

const ActivityRow = ({ item }: { item: ActivityItem }) => {
  const content = (
    <div className="flex items-start justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left transition hover:border-primary/40">
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{item.title}</p>
        {item.message && <p className="mt-1 line-clamp-2 text-sm text-ink-secondary">{item.message}</p>}
        <p className="mt-1 text-xs text-neutral">{formatDateToVN(item.createdAt)}</p>
      </div>
      {item.status && (
        <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${itemTone[item.status] || "bg-canvas text-ink-secondary"}`}>
          {item.status}
        </span>
      )}
    </div>
  );

  return item.targetUrl ? (
    <NavLink to={item.targetUrl}>{content}</NavLink>
  ) : (
    content
  );
};

const WorkspaceActivityView: React.FC<WorkspaceActivityViewProps> = ({ data }) => {
  const summary = data?.summary || {};
  const timeline = data?.timeline || [];
  const sections = data?.sections || {};

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-md border border-line bg-canvas p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink-secondary">{label}</span>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{formatNumber(summary[key])}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-line bg-canvas p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">Dòng hoạt động</h2>
            <span className="text-xs font-medium text-ink-secondary">{timeline.length} mục mới nhất</span>
          </div>
          <div className="grid gap-2">
            {timeline.length ? timeline.map((item) => <ActivityRow key={`${item.type}-${item.id}`} item={item} />) : (
              <p className="rounded-md border border-line bg-surface p-4 text-sm text-ink-secondary">Chưa có hoạt động nào được ghi nhận.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-canvas p-4">
          <h2 className="font-display text-xl font-bold text-ink">Mở rộng nhanh</h2>
          <div className="mt-3 grid gap-3">
            {Object.entries(sectionMeta).map(([key, meta]) => {
              const Icon = meta.icon;
              const count = sections[key]?.length || 0;
              return (
                <div key={key} className="rounded-md border border-line bg-surface p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      <Icon className="h-4 w-4 text-primary" />
                      {meta.title}
                    </span>
                    <span className="text-sm text-ink-secondary">{count}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-secondary">
                    {key === "notifications" && "Theo dõi thông báo chưa đọc và điều hướng nhanh."}
                    {key === "shareLinks" && "Kiểm tra link chia sẻ đang hoạt động, hết hạn hoặc đã thu hồi."}
                    {key === "versions" && "Theo dõi các phiên bản tài liệu mới nhất."}
                    {key === "reports" && "Xem trạng thái report của bạn hoặc hàng chờ kiểm duyệt của admin."}
                    {key === "invites" && "Theo dõi lời mời thư mục và cộng tác workspace."}
                    {key === "auditLogs" && "Tra cứu các hành động đã được ghi audit."}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Object.entries(sectionMeta).map(([key, meta]) => {
          const Icon = meta.icon;
          const rows = sections[key] || [];
          return (
            <section key={key} className="rounded-lg border border-line bg-canvas p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
                <Icon className="h-4 w-4 text-primary" />
                {meta.title}
              </h3>
              <div className="grid gap-2">
                {rows.length ? rows.slice(0, 5).map((item) => <ActivityRow key={`${key}-${item.id}`} item={item} />) : (
                  <p className="rounded-md border border-line bg-surface p-3 text-sm text-ink-secondary">Không có dữ liệu gần đây.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default WorkspaceActivityView;
