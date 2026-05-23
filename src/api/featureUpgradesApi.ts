import axiosInstance from "./axiosInstance";

const cleanParams = (params: Record<string, any> = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );

const unwrapData = (response: any) => response?.data?.data ?? response?.data ?? response;

const featureUpgradesApi = {
  getPublicShare: (token: string) =>
    axiosInstance.get(`s/${token}`).then((response) => response.data),

  verifySharePassword: (token: string, password: string) =>
    axiosInstance.post(`s/${token}/verify-password`, { password }).then((response) => response.data),

  getComments: (documentId: number | string, params = {}) =>
    axiosInstance.get(`documents/${documentId}/comments`, { params: cleanParams(params) }).then((response) => response.data),

  createComment: (documentId: number | string, payload: { content: string; parentCommentId?: number | null }) =>
    axiosInstance.post(`documents/${documentId}/comments`, payload).then((response) => response.data),

  updateComment: (commentId: number, payload: { content: string }) =>
    axiosInstance.patch(`comments/${commentId}`, payload).then((response) => response.data),

  deleteComment: (commentId: number) =>
    axiosInstance.delete(`comments/${commentId}`).then((response) => response.data),

  recordView: (documentId: number | string, source = "document_detail") =>
    axiosInstance.post(`documents/${documentId}/view`, { source }).then((response) => response.data),

  getHistory: (params = {}) =>
    axiosInstance.get("users/me/history", { params: cleanParams(params) }).then((response) => response.data),

  getTrending: (params = {}) =>
    axiosInstance.get("documents/trending", { params: cleanParams(params) }).then((response) => response.data),

  getRecommended: (params = {}) =>
    axiosInstance.get("feed/recommended", { params: cleanParams(params) }).then((response) => response.data),

  getFollowing: (params = {}) =>
    axiosInstance.get("feed/following", { params: cleanParams(params) }).then((response) => response.data),

  getNotificationSettings: () =>
    axiosInstance.get("notifications/settings").then((response) => unwrapData(response)),

  updateNotificationSettings: (payload: Record<string, boolean>) =>
    axiosInstance.put("notifications/settings", payload).then((response) => unwrapData(response)),

  getStorage: () =>
    axiosInstance.get("users/me/storage").then((response) => response.data),

  getVersions: (documentId: number | string) =>
    axiosInstance.get(`documents/${documentId}/versions`).then((response) => response.data),

  uploadVersion: (documentId: number | string, file: File, changeNote: string, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("changeNote", changeNote);
    return axiosInstance
      .post(`documents/${documentId}/versions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          onUploadProgress?.(Math.min(99, Math.round((event.loaded * 100) / event.total)));
        },
      })
      .then((response) => response.data);
  },

  restoreVersion: (documentId: number | string, versionId: number | string) =>
    axiosInstance.post(`documents/${documentId}/versions/${versionId}/restore`).then((response) => response.data),

  downloadVersion: (documentId: number | string, versionId: number | string) =>
    axiosInstance.get(`documents/${documentId}/versions/${versionId}/download`, { responseType: "blob" }),

  getAuditLogs: (params = {}) =>
    axiosInstance.get("admin/audit-logs", { params: cleanParams(params) }).then((response) => response.data),

  getEngagementAnalytics: (params = {}) =>
    axiosInstance.get("admin/analytics/engagement", { params: cleanParams(params) }).then((response) => response.data),

  updateUserStorage: (userId: string, storageLimitBytes: number) =>
    axiosInstance.patch(`admin/users/${userId}/storage`, { storageLimitBytes }).then((response) => response.data),
};

export default featureUpgradesApi;
