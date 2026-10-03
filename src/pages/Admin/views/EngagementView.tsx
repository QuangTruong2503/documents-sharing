import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import adminApi from "../../../api/adminApi";
import { useAdminQuery } from "../hooks/useAdminList";
import { formatNumber, groupSeries, joinDaily } from "../adminFormat";
import BarChart from "../components/BarChart";
import type { Engagement } from "../types";

export default function EngagementView() {
  const { params, setFilter } = useAdminQuery();
  const days = Number(params.get("days")) || 30;
  const [data, setData] = useState<Engagement | null>(null);
  useEffect(() => {
    let active = true;
    adminApi
      .getEngagementAnalytics({ days })
      .then((x) => {
        if (active) setData(x);
      })
      .catch(() => toast.error("Không tải được thống kê tương tác."));
    return () => {
      active = false;
    };
  }, [days]);
  return (
    <div className="space-y-5">
      <label>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card p-4">
              Lượt xem
              <p className="mt-2 text-3xl font-bold">
                {formatNumber(data.totalViews)}
              </p>
            </div>
            <div className="surface-card p-4">
              Lượt tải
              <p className="mt-2 text-3xl font-bold">
                {formatNumber(data.totalDownloads)}
              </p>
            </div>
          </div>
          <section className="surface-card space-y-4 p-4">
            <h2 className="text-lg font-semibold">
              Tương tác{" "}
              {days > 90 ? "theo tháng" : days > 30 ? "theo tuần" : "theo ngày"}
            </h2>
            <BarChart
              rows={groupSeries(
                joinDaily(data.dailyViews, data.dailyDownloads),
                days,
              )}
              labels={["Lượt xem", "Lượt tải"]}
            />
          </section>
        </>
      ) : (
        <p role="status">Đang tải tương tác…</p>
      )}
    </div>
  );
}
