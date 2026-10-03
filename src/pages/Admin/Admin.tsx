import React, { useEffect, useState } from "react";
import { Navigate, NavLink, useNavigate, useParams } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import adminApi from "../../api/adminApi";
import { tabs } from "./adminTabs";
import { AdminConfirmProvider } from "./components/AdminShared";
import DashboardView from "./views/DashboardView";
import UsersView from "./views/UsersView";
import DocumentsView from "./views/DocumentsView";
import ReportsView from "./views/ReportsView";
import TaxonomyView from "./views/TaxonomyView";
import CollectionsView from "./views/CollectionsView";
import AnalyticsView from "./views/AnalyticsView";
import EngagementView from "./views/EngagementView";
import AuditLogsView from "./views/AuditLogsView";
import SeoView from "./views/SeoView";

class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div role="alert" className="surface-card space-y-3 p-6">
        <p>Không hiển thị được nội dung tab này.</p>
        <button
          className="btn-secondary"
          onClick={() => this.setState({ failed: false })}
        >
          Thử lại
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Admin() {
  const navigate = useNavigate();
  const { "*": path } = useParams();
  const section = path?.split("/")[0] ?? "";
  const tab = tabs.find((x) => x.id === section);
  const [pending, setPending] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    adminApi
      .getDashboard()
      .then((x) => {
        if (active) setPending(x.totals.pendingReports);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [section]);
  if (!tab) return <Navigate to="/admin/dashboard" replace />;
  const content: Record<string, React.ReactNode> = {
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
  };
  return (
    <>
      <PageTitle
        title={`Quản trị · ${tab.label}`}
        description="Khu vực quản trị DocShare."
        robots="noindex, nofollow"
      />
      <div className="py-2">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="surface-card min-w-0 overflow-hidden p-2 lg:h-fit">
            <select
              aria-label="Chọn mục quản trị"
              className="input-field w-full lg:hidden"
              value={section}
              onChange={(event) => navigate(`/admin/${event.target.value}`)}
            >
              {[
                "Tổng quan",
                "Nội dung",
                "Người dùng",
                "Phân loại",
                "Phân tích",
                "Hệ thống",
              ].map((group) => (
                <optgroup key={group} label={group}>
                  {tabs
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                        {item.id === "reports" && pending !== null
                          ? ` (${pending})`
                          : ""}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <nav aria-label="Quản trị" className="hidden lg:block">
              {[
                "Tổng quan",
                "Nội dung",
                "Người dùng",
                "Phân loại",
                "Phân tích",
                "Hệ thống",
              ].map((group) => (
                <div key={group} className="contents lg:block">
                  <p className="hidden px-3 pb-1 pt-3 text-xs font-semibold uppercase text-ink-secondary lg:block">
                    {group}
                  </p>
                  {tabs
                    .filter((x) => x.group === group)
                    .map((item) => (
                      <NavLink
                        key={item.id}
                        to={`/admin/${item.id}`}
                        className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded px-3 py-2.5 text-sm ${item.id === section ? "bg-primary text-white" : "text-ink-secondary hover:bg-canvas"}`}
                      >
                        <item.icon size={17} />
                        {item.label}
                        {item.id === "reports" && pending !== null && (
                          <span className="ml-auto rounded bg-canvas px-1.5 text-xs text-ink">
                            {pending}
                          </span>
                        )}
                      </NavLink>
                    ))}
                </div>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 space-y-5">
            <h1 className="text-2xl font-bold">{tab.label}</h1>
            <AdminErrorBoundary key={section}>
              <AdminConfirmProvider>{content[section]}</AdminConfirmProvider>
            </AdminErrorBoundary>
          </main>
        </div>
      </div>
    </>
  );
}
