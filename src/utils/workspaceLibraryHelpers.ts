import workspaceLibraryApi, { WorkspaceItem } from "api/workspaceLibraryApi.ts";

export interface WorkspacePagination {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const defaultWorkspacePagination: WorkspacePagination = {
  currentPage: 1,
  pageSize: 50,
  totalCount: 0,
  totalPages: 1,
};

export const normalizeWorkspacePagination = (pagination: any = {}): WorkspacePagination => ({
  currentPage: pagination.currentPage ?? pagination.CurrentPage ?? 1,
  pageSize: pagination.pageSize ?? pagination.PageSize ?? 50,
  totalCount: pagination.totalCount ?? pagination.TotalCount ?? 0,
  totalPages: pagination.totalPages ?? pagination.TotalPages ?? 1,
});

export const workspaceFailureMessage = (response: any, fallback: string) => {
  const failed = response?.failed || [];
  if (failed.length === 0) return "";
  const first = failed[0];
  const extra = failed.length > 1 ? ` (+${failed.length - 1} mục khác)` : "";
  return `${first.message || fallback}${extra}`;
};

export const workspaceBatchMessage = (response: any, successKey: string, successMessage: string, partialFallback: string) => {
  const failedCount = response?.failed?.length || 0;
  const successCount = response?.[successKey]?.length || 0;
  if (failedCount === 0) return successMessage;
  const failureMessage = workspaceFailureMessage(response, partialFallback);
  return successCount > 0 ? `${successCount} mục thành công. ${failureMessage}` : failureMessage;
};

export const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const canEvery = (items: WorkspaceItem[], permission: keyof NonNullable<WorkspaceItem["permissions"]>) =>
  items.length > 0 && items.every((item) => item.permissions?.[permission] !== false);

const mimeExtensionMap: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "text/csv": "csv",
  "text/plain": "txt",
};

const hasFileExtension = (fileName: string) => /\.[^./\\]+$/.test(fileName);

const getExtensionFromDocument = (document: WorkspaceItem, contentType: string) => {
  const extension = document.extension?.replace(/^\./, "").trim();
  if (extension && !extension.includes("/")) return extension;

  const mimeType = (document.mimeType || contentType || "").split(";")[0].trim().toLowerCase();
  return mimeExtensionMap[mimeType] || "";
};

export const getWorkspaceDownloadFileName = (document: WorkspaceItem) => {
  const baseFileName = document.name || document.title || `document-${document.id}`;

  if (hasFileExtension(baseFileName)) return baseFileName;

  const extension = getExtensionFromDocument(document, document.mimeType || "");
  return extension ? `${baseFileName}.${extension}` : baseFileName;
};

const sanitizeCloudinaryAttachmentName = (fileName: string) =>
  fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "document";

export const buildCloudinaryAttachmentUrl = (secureUrl?: string | null, fileName?: string | null) => {
  if (!secureUrl) return "";
  const uploadMarker = "/upload/";
  const uploadIndex = secureUrl.indexOf(uploadMarker);
  if (uploadIndex < 0) return secureUrl;

  const safeFileName = sanitizeCloudinaryAttachmentName(fileName || "document");
  const beforeUpload = secureUrl.slice(0, uploadIndex + uploadMarker.length);
  const afterUpload = secureUrl.slice(uploadIndex + uploadMarker.length);
  return `${beforeUpload}fl_attachment:${safeFileName}/${afterUpload}`;
};

export const downloadWorkspaceDocument = async (document: WorkspaceItem) => {
  const sourceUrl = document.fileUrl || document.downloadUrl || document.previewUrl;
  const downloadUrl = buildCloudinaryAttachmentUrl(sourceUrl, getWorkspaceDownloadFileName(document));
  if (!downloadUrl) throw new Error("Không tìm thấy Cloudinary URL của tài liệu.");
  window.location.href = downloadUrl;
};

export const downloadWorkspaceDocuments = async (documents: WorkspaceItem[]) => {
  const selectedDocuments = documents.filter((item) => item.type === "document");
  if (selectedDocuments.length === 0) return;

  if (selectedDocuments.length === 1) {
    await downloadWorkspaceDocument(selectedDocuments[0]);
    return;
  }

  const publicIds = selectedDocuments.map((item) => item.publicId).filter(Boolean) as string[];
  const response = await workspaceLibraryApi.downloadItems({
    publicIds,
    items: publicIds.length === selectedDocuments.length ? undefined : selectedDocuments.map((item) => ({ id: item.id, type: item.type })),
  });
  if (!response?.downloadUrl) throw new Error("Backend chưa trả về URL tải ZIP.");
  window.location.href = response.downloadUrl;
};
