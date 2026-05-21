import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, FolderPlus, Upload } from "lucide-react";

interface WorkspaceCreateDropdownProps {
  canUpload: boolean;
  canCreateFolder: boolean;
  onUpload: () => void;
  onCreateFolder: () => void;
  label?: string;
  className?: string;
}

const WorkspaceCreateDropdown = ({
  canUpload,
  canCreateFolder,
  onUpload,
  onCreateFolder,
  label = "Thêm mới",
  className = "",
}: WorkspaceCreateDropdownProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const disabled = !canUpload && !canCreateFolder;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        className="btn-primary px-3 py-2"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Upload className="mr-2 h-4 w-4" />
        {label}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-card" role="menu">
          <button
            type="button"
            onClick={() => runAction(onUpload)}
            disabled={!canUpload}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink-secondary hover:bg-canvas hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            role="menuitem"
          >
            <Upload className="h-4 w-4" />
            Tải tài liệu lên
          </button>
          <button
            type="button"
            onClick={() => runAction(onCreateFolder)}
            disabled={!canCreateFolder}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink-secondary hover:bg-canvas hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            role="menuitem"
          >
            <FolderPlus className="h-4 w-4" />
            Tạo thư mục
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkspaceCreateDropdown;
