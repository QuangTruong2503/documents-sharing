import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, FileText, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import PageTitle from "components/PageTitle";
import reportsApi from "api/reportsApi";

const PAGE_SIZE = 8;

const statusTones: Record<string, string> = {
  "Chờ giải quyết": "bg-amber-50 text-amber-700 ring-amber-100",
  "Đang xử lý": "bg-indigo-50 text-indigo-700 ring-indigo-100",
  "Đã xử lý": "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "Từ chối": "bg-red-50 text-red-700 ring-red-100",
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${statusTones[status] ?? "bg-gray-50 text-gray-700 ring-gray-100"}`}>
      {status}
    </span>
  );
}

const MyReports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });
  const [statuses, setStatuses] = useState<string[]>([]);
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [documentId, setDocumentId] = useState(searchParams.get("documentId") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    reportsApi
      .getOptions()
      .then((response) => setStatuses(response.data?.data?.statuses ?? []))
      .catch(() => setStatuses(["Chờ giải quyết", "Đang xử lý", "Đã xử lý", "Từ chối"]));
  }, []);

  const loadReports = useCallback(() => {
    setLoading(true);
    reportsApi
      .getMyReports({
        PageNumber: page,
        PageSize: PAGE_SIZE,
        status,
        documentId,
      })
      .then((response) => {
        setReports(response.data?.data ?? []);
        setPagination(response.data?.pagination ?? {
          currentPage: page,
          pageSize: PAGE_SIZE,
          totalCount: response.data?.data?.length ?? 0,
          totalPages: 1,
        });
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Không tải được danh sách báo cáo.");
      })
      .finally(() => setLoading(false));
  }, [documentId, page, status]);

  useEffect(() => {
    const nextParams: Record<string, string> = {};
    if (page > 1) nextParams.page = String(page);
    if (status) nextParams.status = status;
    if (documentId) nextParams.documentId = documentId;
    setSearchParams(nextParams, { replace: true });
    loadReports();
  }, [documentId, loadReports, page, setSearchParams, status]);

  return (
    <>
      <PageTitle title="Báo cáo của tôi" description="Theo dõi các báo cáo tài liệu bạn đã gửi." />
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
              <AlertTriangle className="h-4 w-4" />
              Reports
            </div>
            <h1 className="text-3xl font-bold text-ink">Báo cáo của tôi</h1>
          </div>
          <div className="grid gap-2 sm:grid-cols-[180px_160px]">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <input
              value={documentId}
              onChange={(event) => {
                setDocumentId(event.target.value.replace(/\D/g, ""));
                setPage(1);
              }}
              className="input-field"
              placeholder="Document ID"
            />
          </div>
        </div>

        <section className="surface-card overflow-hidden">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <RefreshCw className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-neutral" />
              <p className="mt-3 font-medium text-ink">Chưa có báo cáo phù hợp</p>
              <p className="mt-1 text-sm text-ink-secondary">Các tài liệu bạn đã report sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {reports.map((report) => (
                <NavLink
                  key={report.report_id}
                  to={`/my-reports/${report.report_id}`}
                  className="grid gap-3 p-4 transition hover:bg-gray-50 md:grid-cols-[64px_1fr_auto]"
                >
                  <img
                    src={report.document?.thumbnail_url || "/logo.ico"}
                    alt=""
                    className="h-20 w-16 rounded-md border border-line object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold text-ink">
                        {report.document?.title || `Tài liệu #${report.document_id}`}
                      </h2>
                      <StatusBadge status={report.status} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-secondary">{report.reason}</p>
                    <p className="mt-2 text-xs text-neutral">Gửi lúc {formatDate(report.created_at)}</p>
                  </div>
                  <div className="text-sm font-medium text-primary md:self-center">Xem chi tiết</div>
                </NavLink>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary">
              <span>
                Trang {pagination.currentPage}/{pagination.totalPages} - {pagination.totalCount?.toLocaleString("vi-VN")} báo cáo
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-2"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => setPage(pagination.currentPage - 1)}
                  title="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="btn-secondary px-3 py-2"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setPage(pagination.currentPage + 1)}
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

export default MyReports;
