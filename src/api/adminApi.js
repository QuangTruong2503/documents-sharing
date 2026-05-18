import axiosInstance from "./axiosInstance";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );

const adminApi = {
  getDashboard: () => axiosInstance.get("/admin/dashboard"),
  getUsers: (params) => axiosInstance.get("/admin/users", { params: cleanParams(params) }),
  getUser: (userId) => axiosInstance.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => axiosInstance.patch(`/admin/users/${userId}`, data),
  deleteUser: (userId) => axiosInstance.delete(`/admin/users/${userId}`),

  getDocuments: (params) => axiosInstance.get("/admin/documents", { params: cleanParams(params) }),
  getDocument: (documentId) => axiosInstance.get(`/admin/documents/${documentId}`),
  updateDocument: (documentId, data) => axiosInstance.patch(`/admin/documents/${documentId}`, data),
  deleteDocument: (documentId) => axiosInstance.delete(`/admin/documents/${documentId}`),

  getCategories: (params) => axiosInstance.get("/admin/categories", { params: cleanParams(params) }),
  createCategory: (data) => axiosInstance.post("/admin/categories", data),
  updateCategory: (categoryId, data) => axiosInstance.patch(`/admin/categories/${categoryId}`, data),
  deleteCategory: (categoryId) => axiosInstance.delete(`/admin/categories/${categoryId}`),

  getTags: (params) => axiosInstance.get("/admin/tags", { params: cleanParams(params) }),
  createTag: (data) => axiosInstance.post("/admin/tags", data),
  updateTag: (tagId, data) => axiosInstance.patch(`/admin/tags/${tagId}`, data),
  deleteTag: (tagId) => axiosInstance.delete(`/admin/tags/${tagId}`),

  getReports: (params) => axiosInstance.get("/admin/reports", { params: cleanParams(params) }),
  getReport: (reportId) => axiosInstance.get(`/admin/reports/${reportId}`),
  updateReport: (reportId, data) => axiosInstance.patch(`/admin/reports/${reportId}`, data),
  deleteReport: (reportId) => axiosInstance.delete(`/admin/reports/${reportId}`),

  getCollections: (params) => axiosInstance.get("/admin/collections", { params: cleanParams(params) }),
  getCollection: (collectionId) => axiosInstance.get(`/admin/collections/${collectionId}`),
  deleteCollection: (collectionId) => axiosInstance.delete(`/admin/collections/${collectionId}`),

  getDocumentAnalytics: (params) => axiosInstance.get("/admin/analytics/documents", { params: cleanParams(params) }),

  getSeoSettings: () => axiosInstance.get("/admin/seo/settings"),
  updateSeoSettings: (data) => axiosInstance.put("/admin/seo/settings", data),
  getSitemapRoutes: () => axiosInstance.get("/admin/seo/sitemap-routes"),
  updateSitemapRoutes: (data) => axiosInstance.put("/admin/seo/sitemap-routes", data),
  generateSitemap: () => axiosInstance.post("/admin/seo/sitemap/generate"),
  getRobotsTxt: () => axiosInstance.get("/admin/seo/robots"),
  updateRobotsTxt: (data) => axiosInstance.put("/admin/seo/robots", data),
};

export default adminApi;
