import ItemActionDropdown from "components/Workspace/ItemActionDropdown.tsx";
import { useLocation } from "react-router-dom";
import React from "react";
import { NavLink } from "react-router-dom";
import { Check, File, Folder, Star } from "lucide-react";

import { WorkspaceItem } from "api/workspaceLibraryApi.ts";

import { formatDateToVN } from "utils/formatDateToVN";

import { fileIconMap, getItemName, getExtension, formatSize } from "utils/workspaceItem.ts";

type LibraryArea = "my" | "shared" | "team" | "recent" | "favorites" | "shared-links" | "trash" | "activity";


const WorkspaceItemCard = ({
  item,
  area,
  selected,
  selectionActive = false,
  onFavorite,
  onSelect,
  onPreview,
  onCopyLink,
  onDownload,
  onRename,
  onEditDocument,
  onMove,
  onTrash,
  onRestore,
  onDeleteForever,
}: {
  item: WorkspaceItem;
  area?: LibraryArea;
  selected: boolean;
  selectionActive?: boolean;
  onFavorite: () => void;
  onSelect: (event?: React.MouseEvent) => void;
  onPreview: () => void;
  onCopyLink: () => void;
  onDownload: () => void;
  onRename: () => void;
  onEditDocument: () => void;
  onMove: () => void;
  onTrash: () => void;
  onRestore?: () => void;
  onDeleteForever?: () => void;
}) => {
  const location = useLocation();
  const fromArea = area || location.state?.fromArea || "my";
  const isFolder = item.type === "folder";
  const isTrash = area === "trash";
  const ext = getExtension(item);
  const Icon = isFolder ? Folder : fileIconMap[ext] || File;

  return (
    <article className={`group rounded-lg border bg-surface transition hover:-translate-y-0.5 hover:shadow-card ${selected ? "border-primary ring-2 ring-primary/20" : "border-line"}`}>
      <div className="relative">
        <button
          type="button"
          onClick={onSelect}
          className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border ${
            selected ? "border-primary bg-primary text-white" : "border-line bg-surface/95 text-ink-secondary hover:text-primary"
          } ${selected || selectionActive ? "opacity-100" : "opacity-100 transition lg:opacity-0 [@media(hover:none)]:opacity-100 lg:group-hover:opacity-100 group-focus-within:opacity-100"}`}
          aria-label={selected ? "Bỏ chọn mục" : "Chọn mục"}
        >
          {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
        </button>
        <div className="absolute right-3 top-3 z-20 opacity-100 transition lg:opacity-0 [@media(hover:none)]:opacity-100 lg:group-hover:opacity-100 group-focus-within:opacity-100">
          <ItemActionDropdown item={item} area={area} onCopyLink={onCopyLink} onDownload={onDownload} onRename={onRename} onEditDocument={onEditDocument} onMove={onMove} onTrash={onTrash} onRestore={onRestore} onDeleteForever={onDeleteForever} />
        </div>
        {isFolder && !isTrash ? (
          <NavLink to={`/library/folders/${item.id}`} state={{ fromArea }} className="flex h-36 items-center justify-center bg-primary-soft">
            <Icon className="h-14 w-14 text-primary" />
          </NavLink>
        ) : isFolder ? (
          <div className="flex h-36 items-center justify-center bg-primary-soft">
            <Icon className="h-14 w-14 text-primary" />
          </div>
        ) : (
          <button type="button" onClick={isTrash ? onSelect : onPreview} className="flex h-36 w-full items-center justify-center overflow-hidden bg-canvas text-left">
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt={getItemName(item)} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-ink-secondary">
                <Icon className="h-10 w-10 text-primary" />
                {ext.toUpperCase()}
              </span>
            )}
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-2">
          {isFolder && !isTrash ? (
            <NavLink to={`/library/folders/${item.id}`} state={{ fromArea }} className="line-clamp-1 min-w-0 flex-1 font-bold text-ink hover:text-primary">
              {getItemName(item)}
            </NavLink>
          ) : isFolder ? (
            <button type="button" onClick={onSelect} className="line-clamp-1 min-w-0 flex-1 text-left font-bold text-ink hover:text-primary">
              {getItemName(item)}
            </button>
          ) : (
            <button type="button" onClick={isTrash ? onSelect : onPreview} className="line-clamp-1 min-w-0 flex-1 text-left font-bold text-ink hover:text-primary">
              {getItemName(item)}
            </button>
          )}
          {!isTrash && <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onFavorite();
            }}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
              item.isFavorite ? "text-warning" : "text-ink-secondary hover:bg-canvas hover:text-warning"
            }`}
            title={item.isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
            aria-label={item.isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
          >
            <Star className={`h-4 w-4 ${item.isFavorite ? "fill-warning" : ""}`} />
          </button>}
        </div>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-ink-secondary">
          {isFolder ? item.description || `${item.childrenCount ?? 0} mục` : item.description || "Không có mô tả."}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-ink-secondary">
          <span>{isFolder ? `${item.folderCount ?? 0} thư mục · ${item.documentCount ?? 0} file` : `${ext.toUpperCase()} · ${formatSize(item.size)}`}</span>
          <span>{isTrash ? (item.trashedAt ? formatDateToVN(item.trashedAt) : "--") : item.updatedAt ? formatDateToVN(item.updatedAt) : ""}</span>
        </div>
      </div>
    </article>
  );
};

export default WorkspaceItemCard;
