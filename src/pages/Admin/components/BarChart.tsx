import React from "react";
import { formatNumber } from "../adminFormat";

export default function BarChart({
  rows,
  labels,
}: {
  rows: { date: string; views: number; downloads: number }[];
  labels: [string, string];
}) {
  const max = Math.max(1, ...rows.flatMap((x) => [x.views, x.downloads]));
  if (!rows.length)
    return (
      <p className="py-8 text-center text-ink-secondary">
        Chưa có dữ liệu trong khoảng thời gian này.
      </p>
    );
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-secondary">
        {labels[0]} · {labels[1]} · Giá trị lớn nhất: {formatNumber(max)}
      </p>
      <div
        className="flex h-64 items-end gap-3 overflow-x-auto border-b border-line p-2"
        aria-label="Biểu đồ theo ngày"
      >
        {rows.map((row) => (
          <button
            key={row.date}
            type="button"
            className="group relative flex h-full min-w-14 flex-col justify-end gap-2 rounded focus:outline-primary"
            aria-label={`${row.date}: ${row.views} ${labels[0]}, ${row.downloads} ${labels[1]}`}
          >
            <span className="absolute top-0 z-10 hidden rounded bg-ink p-2 text-xs text-white group-hover:block group-focus:block">
              {row.views} / {row.downloads}
            </span>
            <span className="flex h-[200px] items-end justify-center gap-1">
              <span
                className="w-4 rounded-t bg-primary"
                style={{ height: `${(row.views / max) * 100}%` }}
              />
              <span
                className="w-4 rounded-t bg-success"
                style={{ height: `${(row.downloads / max) * 100}%` }}
              />
            </span>
            <span className="text-[10px] text-ink-secondary">
              {row.date.slice(5)}
            </span>
          </button>
        ))}
      </div>
      <details>
        <summary className="cursor-pointer text-sm text-primary">
          Xem dữ liệu dạng bảng
        </summary>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>{labels[0]}</th>
              <th>{labels[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td className="text-center">{row.views}</td>
                <td className="text-center">{row.downloads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
