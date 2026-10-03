import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import adminApi from "../../../api/adminApi";
import type { Dashboard } from "../types";
import { Badge } from "../components/AdminShared";
import {
  formatDate,
  formatNumber,
  ownerName,
  statusLabel,
  statusTone,
} from "../adminFormat";

export default function DashboardView() {
  const [data, setData] = useState<Dashboard | null>(null);
  useEffect(() => {
    let active = true;
    adminApi
      .getDashboard()
      .then((x) => {
        if (active) setData(x);
      })
      .catch(() => toast.error("Không tải được tổng quan."));
    return () => {
      active = false;
    };
  }, []);
  if (!data) return <p role="status">Đang tải tổng quan…</p>;
  const cards = [
    ["Người dùng", data.totals.users, "users"],
    ["Tài liệu", data.totals.documents, "documents"],
    ["Báo cáo đang chờ", data.totals.pendingReports, "reports?status=pending"],
    ["Lượt tải", data.totals.downloads, "engagement"],
  ] as [string, number, string][];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, path]) => (
          <Link
            key={path}
            to={`/admin/${path}`}
            className="surface-card p-4 hover:border-primary"
          >
            <p className="text-sm text-ink-secondary">{label}</p>
            <p className="mt-3 text-3xl font-bold">{formatNumber(value)}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="surface-card space-y-3 p-4">
          <h2 className="text-lg font-semibold">Tài liệu mới</h2>
          {data.recentDocuments.length ? (
            data.recentDocuments.map((doc) => (
              <div
                key={doc.document_id}
                className="rounded border border-line p-3"
              >
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`/document/${doc.document_id}`}
                  className="font-medium text-primary"
                >
                  {doc.title}
                </a>
                <p className="mt-2 text-sm text-ink-secondary">
                  {ownerName(doc.owner)} · {formatDate(doc.uploaded_at)}
                </p>
              </div>
            ))
          ) : (
            <p>Chưa có tài liệu.</p>
          )}
        </section>
        <section className="surface-card space-y-3 p-4">
          <h2 className="text-lg font-semibold">Báo cáo gần đây</h2>
          {data.recentReports.length ? (
            data.recentReports.map((report) => (
              <Link
                key={report.report_id}
                to={`/admin/reports?reportId=${report.report_id}`}
                className="block rounded border border-line p-3"
              >
                <div className="flex justify-between gap-3">
                  <p className="font-medium">{report.document.title}</p>
                  <Badge tone={statusTone(report.status)}>
                    {statusLabel(report.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">{report.reason}</p>
                <p className="mt-2 text-xs text-ink-secondary">
                  {formatDate(report.created_at)}
                </p>
              </Link>
            ))
          ) : (
            <p>Chưa có báo cáo.</p>
          )}
        </section>
      </div>
    </div>
  );
}
