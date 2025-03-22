import React from "react";
import { NavLink } from "react-router-dom";

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
  actionButtons: React.ReactNode; // Nhận các nút hành động từ props
}

const DocumentCard: React.FC<DocumentItemProps> = ({ document, actionButtons }) => {
  return (
    <div className="bg-white shadow-lg border-b border-gray-300 overflow-hidden transition-all hover:bg-gray-100 duration-200 ease-in flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex py-2 px-1">
        {/* Image on the left */}
        <img
          src={document.thumbnail_url}
          alt={document.title}
          className="w-28 h-full border solid object-cover flex-shrink-0"
        />

        {/* Information in the middle */}
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center">
            <NavLink
              to={`/document/${document.document_id}`}
              className="font-semibold text-lg line-clamp-3 hover:text-blue-600 transition-all duration-300"
            >
              {document.title}
            </NavLink>
          </div>
          <small className="text-sm text-gray-600 mt-1 line-clamp-2">
            {document.description ? document.description : "Không có mô tả..."}
          </small>
          <p className="text-xs text-gray-500 mt-2">
            Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
          </p>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-md mt-2 inline-block ${
              document.is_public
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {document.is_public ? "Công khai" : "Riêng tư"}
          </span>
        </div>
      </div>

      {/* Action buttons on the right */}
      <div className="p-4 flex-shrink-0 flex gap-4 items-center">
        {actionButtons}
      </div>
    </div>
  );
};

export default DocumentCard;