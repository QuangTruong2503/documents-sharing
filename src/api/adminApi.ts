import axiosInstance from "./axiosInstance";
import type {
  AdminUser,
  AdminDocument,
  AdminReport,
  AdminCollection,
  Taxonomy,
  AuditLog,
  ListResponse,
  Params,
  Dashboard,
  Analytics,
  Engagement,
  SeoSettings,
  SitemapRoute,
  ResolveAction,
} from "../pages/Admin/types";

const clean = (params: Params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined),
  );
const data = async <T>(url: string): Promise<T> =>
  (await axiosInstance.get(url)).data.data;
const list = async <T>(url: string, params: Params): Promise<ListResponse<T>> =>
  (await axiosInstance.get(url, { params: clean(params) })).data;
const taxonomy = async (type: string): Promise<ListResponse<Taxonomy>> => {
  const rows = await data<Taxonomy[]>(`/admin/${type}`);
  return {
    data: rows,
    pagination: {
      currentPage: 1,
      pageSize: rows.length,
      totalCount: rows.length,
      totalPages: 1,
    },
  };
};
const adminApi = {
  getDashboard: () => data<Dashboard>("/admin/dashboard"),
  getUsers: (p: Params) => list<AdminUser>("/admin/users", p),
  updateUser: (
    id: string,
    patch: {
      fullName?: string;
      avatarUrl?: string | null;
      role?: string;
      isVerified?: boolean;
      twoFactorEnabled?: boolean;
    },
  ) => axiosInstance.patch(`/admin/users/${id}`, patch),
  deleteUser: (id: string) => axiosInstance.delete(`/admin/users/${id}`),
  updateUserStorage: (id: string, storageLimitBytes: number) =>
    axiosInstance.patch(`/admin/users/${id}/storage`, { storageLimitBytes }),
  getDocuments: (p: Params) => list<AdminDocument>("/admin/documents", p),
  updateDocument: (id: number, patch: { isPublic: boolean }) =>
    axiosInstance.patch(`/admin/documents/${id}`, patch),
  deleteDocument: (id: number) =>
    axiosInstance.delete(`/admin/documents/${id}`),
  getReports: (p: Params) => list<AdminReport>("/admin/reports", p),
  getReport: (id: number) => data<AdminReport>(`/admin/reports/${id}`),
  getReportOptions: () =>
    data<{
      statuses: string[];
      statusOptions?: { code: string; label: string }[];
    }>("/reports/options"),
  resolveReport: (id: number, action: ResolveAction, note: string) =>
    axiosInstance.post(`/admin/reports/${id}/resolve`, { action, note }),
  deleteReport: (id: number) => axiosInstance.delete(`/admin/reports/${id}`),
  getCategories: () => taxonomy("categories"),
  getTags: () => taxonomy("tags"),
  saveCategory: (
    id: string | null,
    patch: {
      categoryId?: string;
      name: string;
      description: string;
      parentId: string;
    },
  ) =>
    id
      ? axiosInstance.patch(
          `/admin/categories/${encodeURIComponent(id)}`,
          patch,
        )
      : axiosInstance.post("/admin/categories", patch),
  saveTag: (id: string | null, patch: { tagId?: string; name: string }) =>
    id
      ? axiosInstance.patch(`/admin/tags/${encodeURIComponent(id)}`, patch)
      : axiosInstance.post("/admin/tags", patch),
  deleteTaxonomy: (type: string, id: string) =>
    axiosInstance.delete(`/admin/${type}/${encodeURIComponent(id)}`),
  getCollections: (p: Params) => list<AdminCollection>("/admin/collections", p),
  deleteCollection: (id: number) =>
    axiosInstance.delete(`/admin/collections/${id}`),
  getDocumentAnalytics: async (p: Params): Promise<Analytics> =>
    (
      await axiosInstance.get("/admin/analytics/documents", {
        params: clean(p),
      })
    ).data.data,
  getEngagementAnalytics: async (p: Params): Promise<Engagement> =>
    (
      await axiosInstance.get("/admin/analytics/engagement", {
        params: clean(p),
      })
    ).data.data,
  getAuditLogs: (p: Params) => list<AuditLog>("/admin/audit-logs", p),
  getSeoSettings: () => data<SeoSettings>("/admin/seo/settings"),
  updateSeoSettings: (settings: SeoSettings) =>
    axiosInstance.put("/admin/seo/settings", settings),
  getRobotsTxt: () => data<unknown>("/admin/seo/robots"),
  updateRobotsTxt: (content: string) =>
    axiosInstance.put("/admin/seo/robots", { content }),
  getSitemapRoutes: () => data<SitemapRoute[]>("/admin/seo/sitemap-routes"),
  updateSitemapRoutes: (routes: string[]) =>
    axiosInstance.put("/admin/seo/sitemap-routes", { routes }),
  generateSitemap: () => axiosInstance.post("/admin/seo/sitemap/generate"),
};
export default adminApi;
