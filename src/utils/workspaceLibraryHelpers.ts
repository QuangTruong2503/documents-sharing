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

export const downloadWorkspaceDocument = async (document: WorkspaceItem) => {
  const response = await workspaceLibraryApi.downloadDocument(document.id);
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = document.name || document.title || `document-${document.id}`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
