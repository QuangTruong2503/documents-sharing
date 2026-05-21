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

const getHeaderValue = (headers: any, key: string) => {
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get(key) || headers.get(key.toLowerCase()) || "";
  return headers[key] || headers[key.toLowerCase()] || "";
};

const getFilenameFromContentDisposition = (contentDisposition: string) => {
  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return encodedMatch[1].trim().replace(/^"|"$/g, "");
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1]?.trim() || "";
};

const hasFileExtension = (fileName: string) => /\.[^./\\]+$/.test(fileName);

const getExtensionFromDocument = (document: WorkspaceItem, contentType: string) => {
  const extension = document.extension?.replace(/^\./, "").trim();
  if (extension && !extension.includes("/")) return extension;

  const mimeType = (document.mimeType || contentType || "").split(";")[0].trim().toLowerCase();
  return mimeExtensionMap[mimeType] || "";
};

const getWorkspaceDownloadFileName = (document: WorkspaceItem, response: any, contentType: string) => {
  const headerFileName = getFilenameFromContentDisposition(getHeaderValue(response.headers, "content-disposition"));
  const baseFileName = headerFileName || document.name || document.title || `document-${document.id}`;

  if (hasFileExtension(baseFileName)) return baseFileName;

  const extension = getExtensionFromDocument(document, contentType);
  return extension ? `${baseFileName}.${extension}` : baseFileName;
};

export const downloadWorkspaceDocument = async (document: WorkspaceItem) => {
  const response = await workspaceLibraryApi.downloadDocument(document.id);
  const responseContentType = getHeaderValue(response.headers, "content-type");
  const blobType = responseContentType || document.mimeType || response.data?.type || "";
  const blob = new Blob([response.data], blobType ? { type: blobType } : undefined);
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = getWorkspaceDownloadFileName(document, response, blobType);
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
