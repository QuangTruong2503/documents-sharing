import React from "react";
import { NavLink } from "react-router-dom";
import { Check, FileText } from "lucide-react";
import { formatDateToVN } from "utils/formatDateToVN";

export interface LibraryDocumentItem {
  document_id: number;
  title?: string;
  Title?: string;
  description?: string | null;
  Description?: string | null;
  thumbnail_url?: string;
  uploaded_at?: string;
  is_public?: boolean;
  file_type?: string | null;
  file_url?: string;
}

interface LibraryDocumentGridProps {
  documents: LibraryDocumentItem[];
  selectedIds?: number[];
  onToggleSelect?: (documentId: number) => void;
  renderActions?: (document: LibraryDocumentItem) => React.ReactNode;
  getMetaLabel?: (document: LibraryDocumentItem) => string;
}

const LibraryDocumentGrid: React.FC<LibraryDocumentGridProps> = ({
  documents,
  selectedIds = [],
  onToggleSelect,
  renderActions,
  getMetaLabel,
}) => {
  const selectedSet = new Set(selectedIds);
  const selectable = Boolean(onToggleSelect);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {documents.map((document) => {
        const title = document.title || document.Title || "Tài liệu chưa có tiêu đề";
        const description = document.description || document.Description || "Không có mô tả.";
        const selected = selectedSet.has(document.document_id);

        return (
          <article
            key={document.document_id}
            className={`surface-card overflow-hidden transition ${
              selected ? "ring-2 ring-primary ring-offset-2 ring-offset-canvas" : ""
            }`}
          >
            <div className="relative">
              {selectable && (
                <button
                  type="button"
                  onClick={() => onToggleSelect?.(document.document_id)}
                  className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface/95 text-ink-secondary hover:border-primary hover:text-primary"
                  }`}
                  aria-label={selected ? "Bỏ chọn tài liệu" : "Chọn tài liệu"}
                  title={selected ? "Bỏ chọn" : "Chọn"}
                >
                  {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current" />}
                </button>
              )}

              <NavLink to={`/document/${document.document_id}`} className="block">
                <div className="flex h-44 justify-center overflow-hidden bg-canvas">
                  {document.thumbnail_url ? (
                    <img src={document.thumbnail_url} alt={title} className="h-full w-3/4 border border-line object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-ink-secondary">
                      <FileText className="h-6 w-6 text-neutral" />
                      Không có ảnh xem trước
                    </div>
                  )}
                </div>
              </NavLink>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <NavLink to={`/document/${document.document_id}`} className="line-clamp-2 min-w-0 font-bold text-ink hover:text-primary">
                  {title}
                </NavLink>
                {renderActions && <div className="flex shrink-0 gap-1">{renderActions(document)}</div>}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-ink-secondary">{description}</p>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-ink-secondary">
                <span>{document.is_public === false ? "Riêng tư" : "Công khai"}</span>
                <span>
                  {getMetaLabel
                    ? getMetaLabel(document)
                    : document.uploaded_at
                      ? formatDateToVN(document.uploaded_at)
                      : ""}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default LibraryDocumentGrid;
