import Modal from "./dialogs/Modal.tsx";
import { DocumentPreviewResponse } from "api/workspaceLibraryApi.ts";
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Download, Eye, FileText, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";

import workspaceLibraryApi, { WorkspaceItem } from "api/workspaceLibraryApi.ts";

import { formatDateToVN } from "utils/formatDateToVN";
import { downloadWorkspaceDocument } from "utils/workspaceLibraryHelpers.ts";

import { apiMessage } from "utils/apiMessage.ts";

import { fileIconMap, getItemName, getExtension, formatSize } from "utils/workspaceItem.ts";

const PreviewDrawer = ({ item, onClose, onShare }: { item: WorkspaceItem | null; onClose: () => void; onShare: (item: WorkspaceItem) => void }) => {
  const [preview, setPreview] = useState<DocumentPreviewResponse | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!item || item.type !== "document") {
      setPreview(null);
      return;
    }
    let ignore = false;
    setPreview(null);
    workspaceLibraryApi
      .getDocumentPreview(item.id)
      .then((response) => { if (!ignore) setPreview(response); })
      .catch(() => { if (!ignore) setPreview(null); });
    return () => { ignore = true; };
  }, [item]);

  if (!item || item.type !== "document") return null;
  const currentPreview = String(preview?.document?.id) === String(item.id) ? preview : null;
  const document = currentPreview?.document || item;
  const metadata = currentPreview?.metadata;
  const ext = getExtension(document);
  const Icon = fileIconMap[ext] || FileText;
  const canDownload = document.allowDownload !== false && document.permissions?.canDownload !== false;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadWorkspaceDocument(document);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tải tài liệu."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal onClose={onClose} drawer label="Xem trước tài liệu"><aside className="h-full border-l border-line bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-line p-4">
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{getItemName(document)}</p>
          <p className="text-xs text-ink-secondary">{ext.toUpperCase()} · {formatSize(document.size)}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-2 text-ink-secondary hover:bg-canvas hover:text-ink" title="Đóng">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex h-72 items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas">
          {document.thumbnailUrl ? (
            <img src={document.thumbnailUrl} alt={getItemName(document)} className="h-full w-full object-contain" />
          ) : (
            <div className="text-center text-ink-secondary">
              <Icon className="mx-auto h-14 w-14 text-primary" />
              <p className="mt-3 text-sm">{document.status === "processing" ? "Đang xử lý bản xem trước" : "Chưa có bản xem trước"}</p>
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <NavLink to={`/document/${item.id}`} className="btn-primary">
            <Eye className="mr-2 h-4 w-4" />
            Chi tiết
          </NavLink>
          <button type="button" onClick={download} disabled={!canDownload || downloading} className="btn-secondary">
            {downloading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Tải xuống
          </button>
        </div>
        {document.permissions?.canShare && <button type="button" className="btn-secondary mt-3 w-full" onClick={() => onShare(item)}>Chia sẻ</button>}
        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-ink">Mô tả</dt>
            <dd className="mt-1 text-ink-secondary">{document.description || "Không có mô tả."}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Chủ sở hữu</dt>
            <dd className="mt-1 text-ink-secondary">{metadata?.ownerName || item.ownerName || "--"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Trạng thái</dt>
            <dd className="mt-1 text-ink-secondary">{{ ready: "Sẵn sàng", processing: "Đang xử lý", error: "Lỗi", failed: "Lỗi" }[document.status || "ready"] || "Chưa xác định"}</dd>
          </div>
          <div><dt className="font-semibold text-ink">Ngày tạo</dt><dd>{(metadata?.createdAt || document.createdAt) ? formatDateToVN(metadata?.createdAt || document.createdAt) : "--"}</dd></div>
          <div><dt className="font-semibold text-ink">Cập nhật</dt><dd>{(metadata?.updatedAt || document.updatedAt) ? formatDateToVN(metadata?.updatedAt || document.updatedAt) : "--"}</dd></div>
          <div><dt className="font-semibold text-ink">Kích thước</dt><dd>{formatSize(document.size)}</dd></div>
          <div><dt className="font-semibold text-ink">Thư mục chứa</dt><dd><NavLink to={item.parentFolderId ? `/library/folders/${item.parentFolderId}` : "/library"}>Mở thư mục chứa</NavLink></dd></div>
        </dl>
      </div>
    </aside></Modal>
  );
};

export default PreviewDrawer;
