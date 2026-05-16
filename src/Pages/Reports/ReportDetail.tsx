import React, { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Download, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import PageTitle from "../../Component/PageTitle";
import reportsApi from "../../api/reportsApi";

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

const ReportDetail: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    reportsApi
      .getMyReport(reportId)
      .then((response) => setReport(response.data?.data ?? response.data))
      .catch((error) => toast.error(error?.response?.data?.message || "Không tải được chi tiết báo cáo."))
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return <div className="py-16 text-center font-medium text-ink">Không tìm thấy báo cáo.</div>;
  }

  const document = report.document ?? {};
  const owner = document.owner ?? {};

  return (
    <>
      <PageTitle title={`Báo cáo #${report.report_id}`} description={report.reason} />
      <div className="mx-auto max-w-5xl space-y-5">
        <NavLink to="/my-reports" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </NavLink>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-line p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
                  <AlertTriangle className="h-4 w-4" />
                  #{report.report_id}
                </div>
                <h1 className="text-2xl font-bold text-ink">Chi tiết báo cáo</h1>
                <p className="mt-1 text-sm text-ink-secondary">Gửi lúc {formatDate(report.created_at)}</p>
              </div>
              <span className="inline-flex w-fit rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                {report.status}
              </span>
            </div>
            <div className="mt-5 rounded-md border border-line bg-gray-50 p-4 text-sm text-ink-secondary">
              {report.reason}
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[180px_1fr]">
            <img
              src={document.thumbnail_url || "/logo.ico"}
              alt=""
              className="h-56 w-full rounded-md border border-line object-cover lg:h-64"
            />
            <div>
              <h2 className="text-xl font-semibold text-ink">{document.title || `Tài liệu #${report.document_id}`}</h2>
              <p className="mt-2 text-sm text-ink-secondary">{document.description || "Không có mô tả."}</p>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral">Trạng thái</dt>
                  <dd className="font-medium text-ink">{document.is_public ? "Công khai" : "Riêng tư"}</dd>
                </div>
                <div>
                  <dt className="text-neutral">Ngày tải lên</dt>
                  <dd className="font-medium text-ink">{formatDate(document.uploaded_at)}</dd>
                </div>
                <div>
                  <dt className="text-neutral">Lượt tải</dt>
                  <dd className="font-medium text-ink">{(document.download_count ?? 0).toLocaleString("vi-VN")}</dd>
                </div>
                <div>
                  <dt className="text-neutral">Người tải</dt>
                  <dd className="font-medium text-ink">{owner.full_name || owner.username || owner.user_id || "-"}</dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                <NavLink to={`/document/${report.document_id}`} className="btn-primary">
                  Xem tài liệu
                </NavLink>
                {document.file_url && (
                  <a href={document.file_url} target="_blank" rel="noreferrer" className="btn-secondary">
                    <Download className="mr-2 h-4 w-4" />
                    Mở file
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ReportDetail;
