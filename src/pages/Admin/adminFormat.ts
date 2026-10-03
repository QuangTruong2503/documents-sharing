import type { Owner, DailyCount } from "./types";
export const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
export const formatDate = (value?: string) => {
  const date = new Date(value ?? "");
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
};
export const formatNumber = (value = 0) => value.toLocaleString("vi-VN");
export const ownerName = (owner?: Owner) =>
  owner?.full_name || owner?.username || owner?.email || "-";
export const statusOptions = [
  { code: "pending", label: "Chờ giải quyết" },
  { code: "processing", label: "Đang xử lý" },
  { code: "resolved", label: "Đã xử lý" },
  { code: "rejected", label: "Từ chối" },
];
export const statusTone = (status: string) =>
  ({
    pending: "warning",
    processing: "info",
    resolved: "success",
    rejected: "danger",
    "Chờ giải quyết": "warning",
    "Đang xử lý": "info",
    "Đã xử lý": "success",
    "Từ chối": "danger",
  })[status] ?? "neutral";
export const statusLabel = (status: string) =>
  statusOptions.find((x) => x.code === status)?.label ?? status;
export function joinDaily(views: DailyCount[], downloads: DailyCount[]) {
  const map = new Map<
    string,
    { date: string; views: number; downloads: number }
  >();
  views.forEach((x) =>
    map.set(x.date.slice(0, 10), {
      date: x.date.slice(0, 10),
      views: x.count,
      downloads: 0,
    }),
  );
  downloads.forEach((x) => {
    const date = x.date.slice(0, 10);
    const row = map.get(date) ?? { date, views: 0, downloads: 0 };
    row.downloads = x.count;
    map.set(date, row);
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
export function groupSeries(
  rows: { date: string; views: number; downloads: number }[],
  days: number,
) {
  if (days <= 30) return rows;
  const map = new Map<string, (typeof rows)[number]>();
  rows.forEach((row) => {
    const date = new Date(row.date + "T00:00:00Z");
    if (days > 90) date.setUTCDate(1);
    else date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const key = date.toISOString().slice(0, 10);
    const item = map.get(key) ?? { date: key, views: 0, downloads: 0 };
    item.views += row.views;
    item.downloads += row.downloads;
    map.set(key, item);
  });
  return Array.from(map.values());
}
