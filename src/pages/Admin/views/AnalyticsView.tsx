import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import adminApi from "../../../api/adminApi";
import { useAdminQuery } from "../hooks/useAdminList";
import { groupSeries } from "../adminFormat";
import BarChart from "../components/BarChart";
import type { Analytics } from "../types";

export default function AnalyticsView() {
  const { params, setFilter } = useAdminQuery();
  const days = Number(params.get("days")) || 30;
  const [data, setData] = useState<Analytics | null>(null);
  useEffect(() => {
    let active = true;
    adminApi
      .getDocumentAnalytics({ days })
      .then((x) => {
        if (active) setData(x);
      })
      .catch(() => toast.error("Không tải được thống kê."));
    return () => {
      active = false;
    };
  }, [days]);
  const max = Math.max(
    1,
    ...(data?.categoryDistribution ?? []).map((x) => x.document_count),
  );
  return (
    <div className="space-y-5">
      <label className="block">
        Khoảng thời gian
        <select
          className="input-field w-auto"
          value={days}
          onChange={(e) => setFilter("days", e.target.value)}
        >
          {[7, 30, 90, 365].map((x) => (
            <option value={x} key={x}>
              {x} ngày
            </option>
          ))}
        </select>
      </label>
      {data ? (
        <>
          <section className="surface-card space-y-4 p-4">
            <h2 className="text-lg font-semibold">
              Lượt tải lên{" "}
              {days > 90 ? "theo tháng" : days > 30 ? "theo tuần" : "theo ngày"}
            </h2>
            <BarChart
              rows={groupSeries(
                data.uploads.map((x) => ({
                  date: x.date,
                  views: x.count,
                  downloads: 0,
                })),
                days,
              )}
              labels={["Lượt tải lên", "Không áp dụng"]}
            />
          </section>
          <section className="surface-card space-y-4 p-4">
            <h2 className="text-lg font-semibold">Phân bổ chuyên mục</h2>
            {data.categoryDistribution.length ? (
              data.categoryDistribution.map((x) => (
                <div key={x.category_id}>
                  <div className="flex justify-between text-sm">
                    <span>{x.name}</span>
                    <span>{x.document_count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded bg-canvas">
                    <div
                      className="h-full rounded bg-primary"
                      style={{ width: `${(x.document_count / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p>Chưa có tài liệu theo chuyên mục.</p>
            )}
          </section>
          <section className="surface-card space-y-3 p-4">
            <h2 className="text-lg font-semibold">Tài liệu tải nhiều</h2>
            {data.topDocuments.length ? (
              data.topDocuments.map((x) => (
                <a
                  key={x.document_id}
                  href={`/document/${x.document_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between gap-3 text-primary"
                >
                  <span>{x.title}</span>
                  <span>{x.download_count} lượt tải</span>
                </a>
              ))
            ) : (
              <p>Chưa có tài liệu.</p>
            )}
          </section>
        </>
      ) : (
        <p role="status">Đang tải thống kê…</p>
      )}
    </div>
  );
}
