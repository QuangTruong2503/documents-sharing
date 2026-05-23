import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Download, Eye, FileClock, Heart, MessageCircle, RefreshCw, Share2 } from "lucide-react";
import featureUpgradesApi from "api/featureUpgradesApi.ts";
import { formatDateToVN } from "utils/formatDateToVN";

interface InsightTotals {
  views?: number;
  downloads?: number;
  likes?: number;
  dislikes?: number;
  comments?: number;
  shares?: number;
  versions?: number;
}

interface DailyInsight {
  date: string;
  views?: number;
  downloads?: number;
}

interface SourceInsight {
  source: string;
  count: number;
}

interface ShareLinkInsight {
  id: number;
  token: string;
  permission?: string;
  viewCount?: number;
  downloadCount?: number;
  expiresAt?: string | null;
  revokedAt?: string | null;
  isActive?: boolean;
}

interface ActivityInsight {
  type: string;
  label: string;
  at: string;
  source?: string | null;
}

interface DocumentInsights {
  success: boolean;
  days: number;
  totals: InsightTotals;
  daily: DailyInsight[];
  sources: SourceInsight[];
  shareLinks: ShareLinkInsight[];
  recentActivity: ActivityInsight[];
}

interface DocumentInsightsPanelProps {
  documentId: number | string;
}

const statItems = [
  { key: "views", label: "Lượt xem", icon: Eye },
  { key: "downloads", label: "Lượt tải", icon: Download },
  { key: "likes", label: "Thích", icon: Heart },
  { key: "comments", label: "Bình luận", icon: MessageCircle },
  { key: "shares", label: "Link chia sẻ", icon: Share2 },
  { key: "versions", label: "Phiên bản", icon: FileClock },
] as const;

const sourceLabel: Record<string, string> = {
  document_detail: "Trang chi tiết",
  public_share: "Link công khai",
  folder: "Thư mục",
  unknown: "Không xác định",
};

const formatNumber = (value?: number) => new Intl.NumberFormat("vi-VN").format(value || 0);

const compactDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const DocumentInsightsPanel: React.FC<DocumentInsightsPanelProps> = ({ documentId }) => {
  const [insights, setInsights] = useState<DocumentInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      const response = await featureUpgradesApi.getDocumentInsights(documentId, { days: 30 });
      setInsights(response);
      setVisible(true);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        setVisible(false);
        return;
      }
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const maxDailyValue = useMemo(() => {
    if (!insights?.daily?.length) return 1;
    return Math.max(...insights.daily.map((item) => Math.max(item.views || 0, item.downloads || 0)), 1);
  }, [insights?.daily]);

  if (!visible) return null;

  return (
    <section className="surface-card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Thống kê tài liệu</h2>
          <p className="mt-1 text-sm text-ink-secondary">Dữ liệu từ lượt xem, tải xuống, bình luận, phiên bản và link chia sẻ.</p>
        </div>
        <button
          type="button"
          onClick={loadInsights}
          disabled={loading}
          className="btn-secondary inline-flex items-center gap-2 px-3 py-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {loading && !insights ? (
        <div className="flex items-center gap-3 rounded-md border border-line bg-canvas p-4 text-sm text-ink-secondary">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-primary" />
          Đang tải thống kê...
        </div>
      ) : insights ? (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statItems.map(({ key, label, icon: Icon }) => (
              <div key={key} className="rounded-md border border-line bg-canvas p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink-secondary">{label}</span>
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="mt-2 text-2xl font-bold text-ink">{formatNumber(insights.totals?.[key])}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-md border border-line bg-canvas p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-ink">30 ngày gần đây</h3>
                <span className="text-xs text-ink-secondary">Xem / tải</span>
              </div>
              <div className="flex h-32 items-end gap-1">
                {insights.daily.map((item) => {
                  const viewsHeight = Math.max(4, ((item.views || 0) / maxDailyValue) * 100);
                  const downloadsHeight = Math.max(4, ((item.downloads || 0) / maxDailyValue) * 100);
                  return (
                    <div key={item.date} className="flex min-w-0 flex-1 items-end justify-center gap-0.5" title={`${compactDate(item.date)}: ${item.views || 0} xem, ${item.downloads || 0} tải`}>
                      <div className="w-full rounded-t bg-primary/70" style={{ height: `${viewsHeight}%` }} />
                      <div className="w-full rounded-t bg-emerald-500/70" style={{ height: `${downloadsHeight}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-line bg-canvas p-4">
              <h3 className="mb-3 font-semibold text-ink">Nguồn truy cập</h3>
              <div className="space-y-3">
                {insights.sources.length ? insights.sources.map((source) => (
                  <div key={source.source}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="truncate text-ink-secondary">{sourceLabel[source.source] || source.source}</span>
                      <span className="font-semibold text-ink">{formatNumber(source.count)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-line">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(6, (source.count / Math.max(insights.totals.views || 1, 1)) * 100)}%` }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-ink-secondary">Chưa có nguồn truy cập trong kỳ này.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-md border border-line bg-canvas p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
                <Share2 size={18} className="text-primary" />
                Link chia sẻ gần đây
              </h3>
              <div className="space-y-2">
                {insights.shareLinks.length ? insights.shareLinks.map((link) => (
                  <div key={link.id} className="rounded-md border border-line bg-surface p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium text-ink">/{link.token}</span>
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${link.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {link.isActive ? "Đang bật" : "Đã tắt"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-secondary">
                      <span>{formatNumber(link.viewCount)} xem</span>
                      <span>{formatNumber(link.downloadCount)} tải</span>
                      {link.expiresAt && <span>Hết hạn {formatDateToVN(link.expiresAt)}</span>}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-ink-secondary">Tài liệu chưa có link chia sẻ.</p>
                )}
              </div>
            </div>

            <div className="rounded-md border border-line bg-canvas p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
                <Activity size={18} className="text-primary" />
                Hoạt động gần đây
              </h3>
              <div className="space-y-2">
                {insights.recentActivity.length ? insights.recentActivity.map((activity, index) => (
                  <div key={`${activity.type}-${activity.at}-${index}`} className="flex items-start justify-between gap-3 rounded-md bg-surface px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-ink">{activity.label}</p>
                      {activity.source && <p className="mt-0.5 text-xs text-ink-secondary">{sourceLabel[activity.source] || activity.source}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-ink-secondary">{formatDateToVN(activity.at)}</span>
                  </div>
                )) : (
                  <p className="text-sm text-ink-secondary">Chưa có hoạt động nào được ghi nhận.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-line bg-canvas p-4 text-sm text-ink-secondary">
          Không thể tải thống kê lúc này.
        </div>
      )}
    </section>
  );
};

export default DocumentInsightsPanel;
