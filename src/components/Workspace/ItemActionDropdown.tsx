import React, { useEffect, useRef, useState } from "react";

import { Download, FileText, Link2, MoreHorizontal, MoveRight, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { WorkspaceItem } from "api/workspaceLibraryApi.ts";

import { getItemName, getPermissions } from "utils/workspaceItem.ts";

type LibraryArea = "my" | "shared" | "team" | "recent" | "favorites" | "shared-links" | "trash" | "activity";

const ItemActionDropdown = ({
  item,
  area,
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
  onCopyLink: () => void;
  onDownload: () => void;
  onRename: () => void;
  onEditDocument: () => void;
  onMove: () => void;
  onTrash: () => void;
  onRestore?: () => void;
  onDeleteForever?: () => void;
}) => {
  const permissions = getPermissions(item);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const runAction = (action: () => void) => {
    menuRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')?.focus();
    setOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-surface/95 text-ink-secondary hover:text-primary"
        title="Thao tác"
        aria-label={`Mở thao tác cho ${getItemName(item)}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-card" role="menu">
        {area === "trash" ? (
          <>
            <button type="button" onClick={() => runAction(onRestore)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary" role="menuitem">
              <RotateCcw className="h-4 w-4" />
              Khôi phục
            </button>
            <button type="button" onClick={() => runAction(onDeleteForever)} disabled={permissions.canDelete === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 disabled:pointer-events-none disabled:opacity-40" role="menuitem">
              <Trash2 className="h-4 w-4" />
              Xóa vĩnh viễn
            </button>
          </>
        ) : (
          <>
        <button type="button" onClick={() => runAction(onCopyLink)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary" role="menuitem">
          <Link2 className="h-4 w-4" />
          Sao chép liên kết
        </button>
        {item.type === "document" && (
          <button type="button" onClick={() => runAction(onDownload)} disabled={permissions.canDownload === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary disabled:pointer-events-none disabled:opacity-40" role="menuitem">
            <Download className="h-4 w-4" />
            Tải xuống
          </button>
        )}
        <button type="button" onClick={() => runAction(onRename)} disabled={permissions.canRename === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary disabled:pointer-events-none disabled:opacity-40" role="menuitem">
          <Pencil className="h-4 w-4" />
          Đổi tên
        </button>
        {item.type === "document" && (
          <button type="button" onClick={() => runAction(onEditDocument)} disabled={permissions.canRename === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary disabled:pointer-events-none disabled:opacity-40" role="menuitem">
            <FileText className="h-4 w-4" />
            Chỉnh sửa
          </button>
        )}
        <button type="button" onClick={() => runAction(onMove)} disabled={permissions.canMove === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary disabled:pointer-events-none disabled:opacity-40" role="menuitem">
          <MoveRight className="h-4 w-4" />
          Di chuyển
        </button>
        <button type="button" onClick={() => runAction(onTrash)} disabled={permissions.canDelete === false} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 disabled:pointer-events-none disabled:opacity-40" role="menuitem">
          <Trash2 className="h-4 w-4" />
          Xóa
        </button>
          </>
        )}
      </div>}
    </div>
  );
};

export default ItemActionDropdown;
