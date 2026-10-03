import ItemActionDropdown from "components/Workspace/ItemActionDropdown.tsx";
import { useLocation } from "react-router-dom";
import React from "react";
import { NavLink } from "react-router-dom";
import { Check, File, Folder, Star } from "lucide-react";

import { WorkspaceItem } from "api/workspaceLibraryApi.ts";

import { formatDateToVN } from "utils/formatDateToVN";

import { fileIconMap, getItemName, getExtension, formatSize } from "utils/workspaceItem.ts";

type LibraryArea = "my" | "shared" | "team" | "recent" | "favorites" | "shared-links" | "trash" | "activity";


const WorkspaceItemList = ({
  items,
  area,
  selectedIds,
  onToggle,
  onSelectAll,
  onPreview,
  onCopyLink,
  onDownload,
  onRename,
  onEditDocument,
  onMove,
  onTrash,
  onRestore,
  onDeleteForever,
  onFavorite,
}: {
  items: WorkspaceItem[];
  area?: LibraryArea;
  selectedIds: string[];
  onToggle: (item: WorkspaceItem, shift?: boolean) => void;
  onSelectAll: () => void;
  onPreview: (item: WorkspaceItem) => void;
  onCopyLink: (item: WorkspaceItem) => void;
  onDownload: (item: WorkspaceItem) => void;
  onRename: (item: WorkspaceItem) => void;
  onEditDocument: (item: WorkspaceItem) => void;
  onMove: (item: WorkspaceItem) => void;
  onTrash: (item: WorkspaceItem) => void;
  onRestore?: (item: WorkspaceItem) => void;
  onDeleteForever?: (item: WorkspaceItem) => void;
  onFavorite: (item: WorkspaceItem) => void;
}) => {
 const location = useLocation();
 const fromArea = area || location.state?.fromArea || "my";
 return (
  <div className="overflow-x-auto rounded-lg border border-line bg-surface">
    <div className="grid min-w-[800px] grid-cols-[44px_1fr_120px_120px_150px_88px] gap-3 border-b border-line px-4 py-3 text-xs font-semibold uppercase text-ink-secondary">
      <input type="checkbox" aria-label="Chọn tất cả trên trang" checked={items.length > 0 && items.every(item => selectedIds.includes(`${item.type}-${item.id}`))} ref={el => { if (el) el.indeterminate = selectedIds.length > 0 && !items.every(item => selectedIds.includes(`${item.type}-${item.id}`)); }} onChange={onSelectAll} />
      <span>Tên</span>
      <span>Loại</span>
      <span>Kích thước</span>
      <span>{area === "trash" ? "Đã xóa" : "Cập nhật"}</span>
      <span />
    </div>
    {items.map((item) => {
      const selected = selectedIds.includes(`${item.type}-${item.id}`);
      const Icon = item.type === "folder" ? Folder : fileIconMap[getExtension(item)] || File;
      return (
        <div key={`${item.type}-${item.id}`} className="group grid min-w-[800px] grid-cols-[44px_1fr_120px_120px_150px_88px] gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-canvas">
          <button
            type="button"
            onClick={(event) => onToggle(item, event.shiftKey)}
            className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${selected ? "border-primary bg-primary text-white" : "border-line text-ink-secondary"} ${selectedIds.length > 0 ? "opacity-100" : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"}`}
            aria-label={selected ? "Bỏ chọn mục" : "Chọn mục"}
          >
            {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {item.type === "folder" && area !== "trash" ? (
              <NavLink to={`/library/folders/${item.id}`} state={{ fromArea }} className="truncate font-semibold text-ink hover:text-primary">
                {getItemName(item)}
              </NavLink>
            ) : item.type === "folder" ? (
              <button type="button" onClick={() => onToggle(item)} className="truncate text-left font-semibold text-ink hover:text-primary">
                {getItemName(item)}
              </button>
            ) : (
              <button type="button" onClick={() => area === "trash" ? onToggle(item) : onPreview(item)} className="truncate text-left font-semibold text-ink hover:text-primary">
                {getItemName(item)}
              </button>
            )}
            {area !== "trash" && <button
              type="button"
              onClick={() => onFavorite(item)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                item.isFavorite ? "text-warning" : "text-ink-secondary hover:bg-surface hover:text-warning"
              }`}
              aria-label={item.isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"} title={item.isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
            >
              <Star className={`h-4 w-4 ${item.isFavorite ? "fill-warning" : ""}`} />
            </button>}
          </div>
          <span className="self-center text-sm text-ink-secondary">{item.type === "folder" ? "Thư mục" : getExtension(item).toUpperCase()}</span>
          <span className="self-center text-sm text-ink-secondary">{item.type === "folder" ? formatSize(item.totalSize) : formatSize(item.size)}</span>
          <span className="self-center text-sm text-ink-secondary">{area === "trash" ? (item.trashedAt ? formatDateToVN(item.trashedAt) : "--") : item.updatedAt ? formatDateToVN(item.updatedAt) : "--"}</span>
          <div className="flex items-center justify-end opacity-100 transition lg:opacity-0 [@media(hover:none)]:opacity-100 lg:group-hover:opacity-100 group-focus-within:opacity-100">
            <ItemActionDropdown item={item} area={area} onCopyLink={() => onCopyLink(item)} onDownload={() => onDownload(item)} onRename={() => onRename(item)} onEditDocument={() => onEditDocument(item)} onMove={() => onMove(item)} onTrash={() => onTrash(item)} onRestore={() => onRestore(item)} onDeleteForever={() => onDeleteForever(item)} />
          </div>
        </div>
      );
    })}
  </div>
);
};

export default WorkspaceItemList;
