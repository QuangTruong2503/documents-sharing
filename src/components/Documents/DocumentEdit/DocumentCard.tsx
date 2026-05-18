import React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faHeart,
  faLock,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { formatDateToVN } from "utils/formatDateToVN";

interface Document {
  document_id: number;
  title: string;
  description: string | null;
  thumbnail_url: string;
  like_count: number;
  uploaded_at: string;
  is_public: boolean;
}

interface DocumentItemProps {
  document: Document;
  actionButtons: React.ReactNode;
}

const DocumentCard: React.FC<DocumentItemProps> = ({ document, actionButtons }) => {
  return (
    <article className="surface-card surface-card-hover overflow-hidden p-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <NavLink
          to={`/document/${document.document_id}`}
          className="group relative mx-auto flex h-40 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-canvas sm:mx-0 sm:h-36 sm:w-24"
          title="Mở tài liệu"
        >
          <img
            src={document.thumbnail_url}
            alt={document.title}
            className="h-full w-full object-fill transition duration-300 group-hover:scale-[1.04]"
            loading="lazy"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-white opacity-0 transition group-hover:bg-ink/30 group-hover:opacity-100">
            <FontAwesomeIcon icon={faUpRightFromSquare} />
          </span>
        </NavLink>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
                    document.is_public
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {!document.is_public && (
                    <FontAwesomeIcon icon={faLock} className="text-[10px]" />
                  )}
                  {document.is_public ? "Công khai" : "Riêng tư"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">
                  <FontAwesomeIcon icon={faHeart} className="text-[10px]" />
                  {document.like_count ?? 0}
                </span>
              </div>

              <NavLink
                to={`/document/${document.document_id}`}
                className="line-clamp-2 text-lg font-bold leading-6 text-ink transition hover:text-primary"
              >
                {document.title}
              </NavLink>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-secondary">
                {document.description ? document.description : "Không có mô tả."}
              </p>

              <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-neutral">
                <FontAwesomeIcon icon={faCalendarDays} />
                Tải lên {formatDateToVN(document.uploaded_at)}
              </p>
            </div>

            <div className="flex flex-shrink-0 justify-start lg:justify-end">
              {actionButtons}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default DocumentCard;
