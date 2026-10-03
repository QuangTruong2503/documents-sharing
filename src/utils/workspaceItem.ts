import React from "react";
import { FileText, Table, Image } from "lucide-react";
import { WorkspaceFolder, WorkspaceItem, WorkspacePermissions } from "api/workspaceLibraryApi.ts";
export const fileIconMap: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: Table,
  xlsx: Table,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
};

export const defaultPermissions: WorkspacePermissions = {
  canView: true,
  canDownload: true,
  canUpload: false,
  canCreateFolder: false,
  canRename: false,
  canMove: false,
  canCopy: false,
  canShare: false,
  canDelete: false,
  canManageMembers: false,
};

export const getItemName = (item: WorkspaceItem) => item.title || item.name || `${item.type} #${item.id}`;
export const getExtension = (item: WorkspaceItem) => (item.extension || item.mimeType || "file").replace(".", "").toLowerCase();
export const getPermissions = (item?: WorkspaceItem | WorkspaceFolder | null) => ({ ...defaultPermissions, ...(item?.permissions || {}) });
export const toPayloadItems = (items: WorkspaceItem[]) => items.map((item) => ({ id: item.id, type: item.type }));

export const formatBytes = (bytes?: number, emptyLabel = "0 B") => {
  if (!bytes) return emptyLabel;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};


export const formatSize = (bytes?: number) => formatBytes(bytes, "--");
