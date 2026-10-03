import React from "react";

import { Copy, Download, FileText, Folder, Grid3X3, Heart, Link2, List, MoreHorizontal, MoveRight, Pencil, RotateCcw, Share2, Trash2, X } from "lucide-react";

import { WorkspaceItem } from "api/workspaceLibraryApi.ts";

import { canEvery } from "utils/workspaceLibraryHelpers.ts";

type ViewMode = "grid" | "list";
type LibraryArea = "my" | "shared" | "team" | "recent" | "favorites" | "shared-links" | "trash" | "activity";

const WorkspaceToolbar = ({
  selectedItems,
  area,
  viewMode,
  onViewMode,
  onClear,
  onRename,
  onEditDocument,
  onMove,
  onCopy,
  onDownload,
  onCopyLink,
  onMerge,
  onShare,
  onFavorite,
  onTrash,
  onRestore,
  onDeleteForever,
}: {
  selectedItems: WorkspaceItem[];
  area: LibraryArea;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  onClear: () => void;
  onRename: () => void;
  onEditDocument: () => void;
  onMove: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onCopyLink: () => void;
  onMerge: () => void;
  onShare: () => void;
  onFavorite: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}) => {
  const selectedCount = selectedItems.length;
  const single = selectedCount === 1;
  const allDocuments = selectedItems.length > 0 && selectedItems.every((item) => item.type === "document");
  const canRename = single && selectedItems[0].permissions?.canRename !== false;
  const canEditDocument = canRename && selectedItems[0].type === "document";
  const canMove = canEvery(selectedItems, "canMove");
  const canCopy = canEvery(selectedItems, "canCopy");
  const canDownload = selectedItems.length > 0 && selectedItems.every((item) => item.type === "document" && item.permissions?.canDownload !== false);
  const canShare = single && selectedItems[0].permissions?.canShare !== false;
  const canDelete = canEvery(selectedItems, "canDelete");

  const secondary = [
    { label: "Đổi tên", Icon: Pencil, action: onRename, show: single, disabled: !canRename },
    { label: "Chỉnh sửa", Icon: FileText, action: onEditDocument, show: single && selectedItems[0].type === "document", disabled: !canEditDocument },
    { label: "Sao chép", Icon: Copy, action: onCopy, show: true, disabled: !canCopy },
    { label: "Sao chép liên kết", Icon: Link2, action: onCopyLink, show: single, disabled: false },
    { label: "Yêu thích", Icon: Heart, action: onFavorite, show: single, disabled: false },
    { label: "Gom vào thư mục", Icon: Folder, action: onMerge, show: allDocuments && selectedCount > 1 && canMove && area === "my", disabled: false },
  ];
  const primary = area === "trash" ? [
    { label: "Khôi phục", Icon: RotateCcw, action: onRestore, disabled: !canDelete },
    { label: "Xóa vĩnh viễn", Icon: Trash2, action: onDeleteForever, disabled: !canDelete },
  ] : [
    { label: "Tải xuống", Icon: Download, action: onDownload, disabled: !canDownload },
    ...(single ? [{ label: "Chia sẻ", Icon: Share2, action: onShare, disabled: !canShare }] : []),
    { label: "Di chuyển", Icon: MoveRight, action: onMove, disabled: !canMove },
    { label: "Xóa", Icon: Trash2, action: onTrash, disabled: !canDelete },
  ];
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {selectedCount > 0 && <>
        <span className="text-sm font-semibold text-ink">{selectedCount} mục đã chọn</span>
        {primary.map(({ label, Icon, action, disabled }) => <button key={label} type="button" className="btn-secondary px-3 py-2" aria-label={label} title={label} disabled={disabled} onClick={action}><Icon className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">{label}</span></button>)}
        {area !== "trash" && <details className="relative">
          <summary className="btn-secondary cursor-pointer list-none px-3 py-2" aria-label="Thao tác khác"><MoreHorizontal size={18} /></summary>
          <div className="absolute left-0 top-full z-30 mt-2 w-52 rounded-md border border-line bg-surface p-1 shadow-card">
            {secondary.filter(item => item.show).map(({ label, Icon, action, disabled }) => <button key={label} type="button" disabled={disabled} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-canvas disabled:opacity-40" onClick={event => { const menu = event.currentTarget.closest("details"); menu?.querySelector("summary")?.focus(); menu?.removeAttribute("open"); action(); }}><Icon size={16} />{label}</button>)}
          </div>
        </details>}
        <button type="button" onClick={onClear} className="btn-secondary px-3 py-2" aria-label="Bỏ chọn"><X size={16} /></button>
      </>}
    </div>
    <div className="inline-flex rounded-md border border-line bg-canvas p-1">
      {(["grid", "list"] as ViewMode[]).map(mode => <button key={mode} type="button" className={viewMode === mode ? "rounded bg-surface px-2.5 py-2 text-primary" : "rounded px-2.5 py-2 text-ink-secondary"} aria-label={mode === "grid" ? "Xem dạng lưới" : "Xem dạng danh sách"} aria-pressed={viewMode === mode} onClick={() => onViewMode(mode)}>{mode === "grid" ? <Grid3X3 size={16} /> : <List size={16} />}</button>)}
    </div>
  </div>;
};
export default WorkspaceToolbar;
