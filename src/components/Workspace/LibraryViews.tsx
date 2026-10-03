import React from "react";
import { FolderOpen } from "lucide-react";
import WorkspaceCreateDropdown from "./WorkspaceCreateDropdown.tsx";
import { formatDateToVN } from "utils/formatDateToVN";
import { LibraryArea } from "utils/libraryQuery.ts";
import { WorkspaceItemType } from "api/workspaceLibraryApi.ts";
interface ShareLinkRow {
  id: string;
  itemId: number;
  itemType: WorkspaceItemType;
  itemName?: string | null;
  shareUrl: string;
  access: string;
  permission: string;
  views?: number;
  downloads?: number;
  expiresAt?: string | null;
  createdAt?: string;
}

export const EmptyState = ({ area, canCreate, canUpload, onCreate, onUpload }: { area: LibraryArea; canCreate: boolean; canUpload: boolean; onCreate: () => void; onUpload: () => void }) => {
  const copy =
    area === "trash"
      ? ["Thùng rác đang trống", "Các tài liệu đã xóa sẽ xuất hiện ở đây."]
      : area === "shared"
        ? ["Chưa có nội dung được chia sẻ", "Thư mục hoặc tài liệu được mời truy cập sẽ nằm tại đây."]
        : area === "shared-links"
          ? ["Chưa có liên kết chia sẻ", "Các link bạn tạo sẽ xuất hiện ở đây."]
          : ["Thư mục này đang trống", "Tải file lên hoặc tạo thư mục đầu tiên."];

  return (
    <div className="rounded-lg border border-dashed border-line bg-surface px-5 py-14 text-center">
      <FolderOpen className="mx-auto h-10 w-10 text-neutral" />
      <h2 className="mt-4 text-lg font-bold text-ink">{copy[0]}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">{copy[1]}</p>
      {(canCreate || canUpload) && (
        <div className="mt-6 flex justify-center">
          <WorkspaceCreateDropdown
            canUpload={canUpload}
            canCreateFolder={canCreate}
            onUpload={onUpload}
            onCreateFolder={onCreate}
          />
        </div>
      )}
    </div>
  );
};

export const SharedLinksView = ({ rows }: { rows: ShareLinkRow[] }) => {
  if (rows.length === 0) {
    return <EmptyState area="shared-links" canCreate={false} canUpload={false} onCreate={() => undefined} onUpload={() => undefined} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <div className="grid min-w-[760px] grid-cols-[1fr_120px_110px_110px_170px] gap-3 border-b border-line px-4 py-3 text-xs font-semibold uppercase text-ink-secondary">
        <span>Tên</span>
        <span>Loại</span>
        <span>Lượt xem</span>
        <span>Tải xuống</span>
        <span>Tạo ngày</span>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="grid min-w-[760px] grid-cols-[1fr_120px_110px_110px_170px] gap-3 border-b border-line px-4 py-3 last:border-b-0">
          <a href={row.shareUrl} target="_blank" rel="noreferrer" className="truncate font-semibold text-ink hover:text-primary">
            {row.itemName || row.shareUrl}
          </a>
          <span className="text-sm text-ink-secondary">{row.itemType === "folder" ? "Thư mục" : "Tài liệu"}</span>
          <span className="text-sm text-ink-secondary">{row.views ?? 0}</span>
          <span className="text-sm text-ink-secondary">{row.downloads ?? 0}</span>
          <span className="text-sm text-ink-secondary">{row.createdAt ? formatDateToVN(row.createdAt) : "--"}</span>
        </div>
      ))}
    </div>
  );
};

