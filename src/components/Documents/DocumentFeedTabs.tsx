import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { RefreshCw, Sparkles, Users } from "lucide-react";
import DocumentCard from "components/Documents/DocumentCard.tsx";
import featureUpgradesApi from "api/featureUpgradesApi.ts";

type FeedKey = "trending" | "recommended" | "following" | "history";

const tabs: Array<{ id: FeedKey; label: string; icon: React.ElementType; auth?: boolean }> = [
  { id: "recommended", label: "Đề xuất", icon: Sparkles, auth: true },
  { id: "following", label: "Đang theo dõi", icon: Users, auth: true },
];

const normalizeDocuments = (response: any) => {
  const rows = response?.documents || response?.items || response?.data || response?.history || [];
  return Array.isArray(rows) ? rows.map((row) => row?.document || row) : [];
};

export default function DocumentFeedTabs() {
  const isSignedIn = Boolean(Cookies.get("token"));
  const [activeTab, setActiveTab] = useState<FeedKey>("recommended");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const visibleTabs = useMemo(() => tabs.filter((tab) => !tab.auth || isSignedIn), [isSignedIn]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("trending");
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { PageNumber: 1, PageSize: 10 };
        const response =
          activeTab === "recommended"
            ? await featureUpgradesApi.getRecommended(params)
            : activeTab === "following"
              ? await featureUpgradesApi.getFollowing(params)
              : activeTab === "history"
                ? await featureUpgradesApi.getHistory(params)
                : await featureUpgradesApi.getTrending({ ...params, days: 7 });
        setDocuments(normalizeDocuments(response));
      } catch {
        setError("Không tải được feed này.");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeTab]);

  return (
    <section className="py-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">Dành cho bạn</h2>
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium transition ${
                  active ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink-secondary hover:text-primary"
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="surface-card flex h-52 items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-secondary">{error}</div>
      ) : documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-secondary">
          Chưa có tài liệu trong mục này.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {documents.map((document) => (
            <DocumentCard key={document.document_id || document.id} document={document} />
          ))}
        </div>
      )}
    </section>
  );
}
