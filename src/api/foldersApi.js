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

function mapWorkspaceFolder(folder = {}) {
  return {
    folder_id: folder.id,
    name: folder.name,
    description: folder.description ?? null,
    visibility: folder.isShared ? "shared" : "private",
    created_at: folder.createdAt,
    updated_at: folder.updatedAt,
    document_count: folder.documentCount ?? 0,
    member_count: folder.isShared ? 1 : 0,
  };
}

function mapWorkspacePermissions(permissions = {}, role = "") {
  const roleDefaults =
    role === "owner"
      ? {
          canView: true,
          canDownload: true,
          canUpload: true,
          canCreateFolder: true,
          canRename: true,
          canMove: true,
          canCopy: true,
          canShare: true,
          canDelete: true,
          canManageMembers: true,
        }
      : role === "editor"
        ? {
            canView: true,
            canDownload: true,
            canUpload: true,
            canCreateFolder: true,
            canRename: true,
            canMove: true,
            canCopy: true,
            canShare: true,
            canDelete: false,
            canManageMembers: false,
          }
        : role === "viewer"
          ? { canView: true, canDownload: true }
          : {};
  const effective = { ...roleDefaults, ...permissions };
  return {
    can_view: effective.canView ?? false,
    can_comment: effective.canView ?? false,
    can_add_document: effective.canUpload ?? false,
    can_remove_document: effective.canDelete ?? false,
    can_edit_folder: effective.canRename ?? false,
    can_manage_members: effective.canManageMembers ?? effective.canShare ?? false,
    can_delete_folder: effective.canDelete ?? false,
  };
}

function mapWorkspaceDocumentItem(item = {}) {
  return {
    folder_id: item.parentFolderId,
    document_id: item.id,
    added_at: item.updatedAt || item.createdAt,
    document: {
      document_id: item.id,
      title: item.title || item.name,
      description: item.description ?? null,
      thumbnail_url: item.thumbnailUrl,
      file_url: item.downloadUrl,
      file_type: item.extension || item.mimeType,
      file_size: item.size,
      uploaded_at: item.createdAt,
      uploader: item.ownerName ? { username: item.ownerName, full_name: item.ownerName } : null,
    },
  };
}

const foldersApi = {
  createFolder: (payload) =>
    axiosInstance
      .post("folders", {
        name: payload.name,
        description: payload.description ?? "",
        color: payload.color ?? null,
        parentFolderId: payload.parentFolderId ?? payload.parent_folder_id ?? null,
      })
      .then((response) => response.data?.folder ?? response.data),
  getMyFolders: (params = {}) =>
    axiosInstance
      .get("folders/my", { params: cleanParams(params) })
      .then((response) => normalizePagedResponse(response.data)),
  getSharedFolders: (params = {}) =>
    axiosInstance
      .get("folders/shared-with-me", { params: cleanParams(params) })
      .then((response) => normalizePagedResponse(response.data)),
  getFolderDetail: (folderId) =>
    axiosInstance.get(`folders/${folderId}/items`, { params: { pageNumber: 1, pageSize: 1 } }).then((response) => {
      const folder = response.data?.folder ?? {};
      return {
        folder: mapWorkspaceFolder(folder),
        permissions: mapWorkspacePermissions(folder.permissions, folder.permission),
        current_user_role: folder.permission,
      };
    }),
  updateFolder: (folderId, payload) =>
    axiosInstance.patch(`folders/${folderId}`, payload).then((response) => response.data?.folder ?? response.data),
  deleteFolder: (folderId) => axiosInstance.delete(`folders/${folderId}`),

  getFolderDocuments: (folderId, params = {}) =>
    axiosInstance
      .get(`folders/${folderId}/items`, { params: cleanParams({ ...params, sort: params.sort || "updated_desc" }) })
      .then((response) => ({
        success: true,
        data: (response.data?.items || [])
          .filter((item) => item.type === "document")
          .map(mapWorkspaceDocumentItem),
        pagination: normalizePagination(response.data?.pagination),
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
