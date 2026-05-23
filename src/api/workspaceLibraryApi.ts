import axiosInstance from "./axiosInstance";

export type WorkspaceItemType = "document" | "folder";

export interface WorkspacePermissions {
  canView?: boolean;
  canDownload?: boolean;
  canUpload?: boolean;
  canCreateFolder?: boolean;
  canRename?: boolean;
  canMove?: boolean;
  canCopy?: boolean;
  canShare?: boolean;
  canDelete?: boolean;
  canManageMembers?: boolean;
}

export interface WorkspaceItem {
  id: number;
  type: WorkspaceItemType;
  name: string;
  title?: string;
  parentFolderId?: number | null;
  ownerId?: string;
  ownerName?: string;
  description?: string | null;
  color?: string | null;
  childrenCount?: number;
  documentCount?: number;
  folderCount?: number;
  totalSize?: number;
  mimeType?: string;
  extension?: string;
  size?: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  status?: string;
  allowDownload?: boolean;
  isFavorite?: boolean;
  isShared?: boolean;
  permission?: "owner" | "editor" | "viewer" | string;
  permissions?: WorkspacePermissions;
  trashedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceFolder {
  id: number | null;
  name: string;
  parentFolderId?: number | null;
  description?: string | null;
  isShared?: boolean;
  permission?: string;
  permissions?: WorkspacePermissions;
  breadcrumb?: Array<{ id: number | null; name: string; href?: string }>;
}

const cleanParams = (params: Record<string, any> = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined));

const workspaceLibraryApi = {
  getMyLibrary: (params = {}) =>
    axiosInstance.get("library/my", { params: cleanParams(params) }).then((response) => response.data),

  getFolderItems: (folderId: number, params = {}) =>
    axiosInstance.get(`folders/${folderId}/items`, { params: cleanParams(params) }).then((response) => response.data),

  getFolderTree: (params = { root: "my", includeShared: true }) =>
    axiosInstance.get("folders/tree", { params: cleanParams(params) }).then((response) => response.data),

  createFolder: (payload: { name: string; parentFolderId?: number | null; description?: string; color?: string | null }) =>
    axiosInstance.post("folders", payload).then((response) => response.data?.folder ?? response.data),

  uploadDocuments: (files: File[], parentFolderId?: number | null, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (parentFolderId !== null && parentFolderId !== undefined) {
      formData.append("parentFolderId", String(parentFolderId));
    }
    return axiosInstance
      .post("documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          onUploadProgress?.(Math.min(99, Math.round((event.loaded * 100) / event.total)));
        },
      })
      .then((response) => response.data);
  },

  getDocumentStatus: (documentId: number) =>
    axiosInstance.get(`documents/${documentId}/status`).then((response) => response.data),

  getDocumentPreview: (documentId: number) =>
    axiosInstance.get(`documents/${documentId}/preview`).then((response) => response.data),

  downloadDocument: (documentId: number) =>
    axiosInstance.get(`documents/${documentId}/download`, { responseType: "blob" }),

  renameItem: (itemId: number, payload: { type: WorkspaceItemType; name: string }) =>
    axiosInstance.patch(`library-items/${itemId}/rename`, payload).then((response) => response.data),

  moveItems: (payload: { items: Array<{ id: number; type: WorkspaceItemType }>; targetFolderId: number | null; conflictStrategy?: "error" | "auto_rename" }) =>
    axiosInstance.patch("library-items/move", { conflictStrategy: "error", ...payload }).then((response) => response.data),

  copyItems: (payload: { items: Array<{ id: number; type: WorkspaceItemType }>; targetFolderId: number | null; conflictStrategy?: "error" | "auto_rename" }) =>
    axiosInstance.post("library-items/copy", { conflictStrategy: "auto_rename", ...payload }).then((response) => response.data),

  mergeDocumentsIntoFolder: (payload: { name: string; parentFolderId?: number | null; items: Array<{ id: number; type: "document" }> }) =>
    axiosInstance.post("folders/merge", payload).then((response) => response.data),

  trashItems: (items: Array<{ id: number; type: WorkspaceItemType }>) =>
    axiosInstance.patch("library-items/trash", { items }).then((response) => response.data),

  restoreItems: (items: Array<{ id: number; type: WorkspaceItemType }>) =>
    axiosInstance.patch("library-items/restore", { items }).then((response) => response.data),

  deleteItemsForever: (items: Array<{ id: number; type: WorkspaceItemType }>) =>
    axiosInstance.delete("library-items", { data: { items } }).then((response) => response.data),

  getTrash: (params = {}) =>
    axiosInstance.get("library/trash", { params: cleanParams(params) }).then((response) => response.data),

  setFavorite: (itemId: number, payload: { type: WorkspaceItemType; favorite: boolean }) =>
    axiosInstance.put(`library-items/${itemId}/favorite`, payload).then((response) => response.data),

  getFavorites: (params = {}) =>
    axiosInstance.get("library/favorites", { params: cleanParams(params) }).then((response) => response.data),

  createShareLink: (payload: Record<string, any>) =>
    axiosInstance.post("share-links", payload).then((response) => response.data),

  getShareLinkSettings: (params: { itemId: number; itemType: WorkspaceItemType }) =>
    axiosInstance.get("share-links", { params }).then((response) => response.data),

  disableShareLink: (shareLinkId: string) =>
    axiosInstance.delete(`share-links/${shareLinkId}`).then((response) => response.data),

  getMyShareLinks: (params = {}) =>
    axiosInstance.get("share-links/my", { params: cleanParams(params) }).then((response) => response.data),

  search: (params: Record<string, any>) =>
    axiosInstance.get("library/search", { params: cleanParams(params) }).then((response) => response.data),

  getRecent: (params = {}) =>
    axiosInstance.get("library/recent", { params: cleanParams(params) }).then((response) => response.data),

  getSharedWithMe: (params = {}) =>
    axiosInstance.get("library/shared-with-me", { params: cleanParams(params) }).then((response) => response.data),

  getTeam: (params = {}) =>
    axiosInstance.get("library/team", { params: cleanParams(params) }).then((response) => response.data),
};

export default workspaceLibraryApi;
