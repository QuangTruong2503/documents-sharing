import axiosInstance from "./axiosInstance";
import documentsApi from "./documentsApi";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );

export const folderRoles = ["viewer", "commenter", "contributor", "editor", "admin"];
export const folderVisibilityOptions = ["private", "shared", "public"];

export function normalizePagination(pagination = {}) {
  return {
    currentPage: pagination.currentPage ?? pagination.CurrentPage ?? 1,
    pageSize: pagination.pageSize ?? pagination.PageSize ?? 8,
    totalCount: pagination.totalCount ?? pagination.TotalCount ?? 0,
    totalPages: pagination.totalPages ?? pagination.TotalPages ?? 1,
  };
}

export function normalizePagedResponse(responseData, fallbackDataKey = "data") {
  const data = responseData?.data ?? responseData?.[fallbackDataKey] ?? [];
  return {
    success: responseData?.success ?? true,
    data: Array.isArray(data) ? data : [],
    pagination: normalizePagination(responseData?.pagination),
  };
}

export function normalizeDocument(document = {}) {
  return {
    ...document,
    title: document.title ?? document.Title ?? "Tài liệu chưa có tiêu đề",
    description: document.description ?? document.Description ?? null,
    username: document.username ?? document.Username,
    uploader: document.uploader
      ? {
          ...document.uploader,
          username: document.uploader.username ?? document.uploader.Username,
        }
      : document.uploader,
  };
}

const foldersApi = {
  createFolder: (payload) => axiosInstance.post("folders", payload).then((response) => response.data?.folder ?? response.data),
  getMyFolders: (params = {}) =>
    axiosInstance
      .get("folders/my", { params: cleanParams(params) })
      .then((response) => normalizePagedResponse(response.data)),
  getSharedFolders: (params = {}) =>
    axiosInstance
      .get("folders/shared-with-me", { params: cleanParams(params) })
      .then((response) => normalizePagedResponse(response.data)),
  getFolderDetail: (folderId) => axiosInstance.get(`folders/${folderId}`).then((response) => response.data),
  updateFolder: (folderId, payload) =>
    axiosInstance.patch(`folders/${folderId}`, payload).then((response) => response.data?.folder ?? response.data),
  deleteFolder: (folderId) => axiosInstance.delete(`folders/${folderId}`),

  getFolderDocuments: (folderId, params = {}) =>
    axiosInstance
      .get(`folders/${folderId}/documents`, { params: cleanParams(params) })
      .then((response) => ({
        ...normalizePagedResponse(response.data),
        data: normalizePagedResponse(response.data).data.map((item) => ({
          ...item,
          document: normalizeDocument(item.document ?? item.Document ?? item),
        })),
      })),
  addDocumentToFolder: (folderId, documentId) =>
    axiosInstance.post(`folders/${folderId}/documents`, { document_id: Number(documentId) }),
  moveDocumentToFolder: (documentId, targetFolderId) =>
    axiosInstance.patch(`documents/${documentId}/folder`, { target_folder_id: Number(targetFolderId) }),
  removeDocumentFromFolder: (folderId, documentId) =>
    axiosInstance.delete(`folders/${folderId}/documents/${documentId}`),
  getMyUploadedDocuments: (params = {}) => documentsApi.getMyUploadedDocument(params),

  getFolderMembers: (folderId, params = {}) =>
    axiosInstance
      .get(`folders/${folderId}/members`, { params: cleanParams(params) })
      .then((response) => normalizePagedResponse(response.data)),
  addFolderMember: (folderId, payload) =>
    axiosInstance.post(`folders/${folderId}/members`, payload).then((response) => response.data?.member ?? response.data),
  updateFolderMemberRole: (folderId, userId, role) =>
    axiosInstance.patch(`folders/${folderId}/members/${userId}`, { role }).then((response) => response.data?.member ?? response.data),
  removeFolderMember: (folderId, userId) => axiosInstance.delete(`folders/${folderId}/members/${userId}`),
  leaveFolder: (folderId) => axiosInstance.delete(`folders/${folderId}/members/me`),

  createFolderInvite: (folderId, payload) =>
    axiosInstance.post(`folders/${folderId}/invites`, payload).then((response) => response.data?.invite ?? response.data),
  getFolderInvites: (folderId, params = {}) =>
    axiosInstance
      .get(`folders/${folderId}/invites`, { params: cleanParams(params) })
      .then((response) => normalizePagedResponse(response.data)),
  getMyFolderInvites: (params = {}) =>
    axiosInstance
      .get("folder-invites/my", { params: cleanParams(params) })
      .then((response) => normalizePagedResponse(response.data)),
  acceptFolderInvite: (inviteId) =>
    axiosInstance.post(`folder-invites/${inviteId}/accept`).then((response) => response.data?.invite ?? response.data),
  declineFolderInvite: (inviteId) =>
    axiosInstance.post(`folder-invites/${inviteId}/decline`).then((response) => response.data?.invite ?? response.data),
  cancelFolderInvite: (folderId, inviteId) =>
    axiosInstance.post(`folders/${folderId}/invites/${inviteId}/cancel`).then((response) => response.data?.invite ?? response.data),
};

export default foldersApi;
