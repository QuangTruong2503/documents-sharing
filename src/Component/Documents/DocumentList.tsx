import { faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { NavLink } from "react-router-dom";
import PaginationComponent from "../Pagination/Pagination.tsx";

interface Document {
  document_id: number;
  full_name: string;
  title: string;
  thumbnail_url: string;
  is_public: boolean;
}

interface DocumentListProps {
  documents: Document[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

const DocumentCard: React.FC<{ document: Document }> = ({ document }) => (
  <div className="relative rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
    <NavLink
      to={`/document/${document.document_id}`}
      className="absolute inset-0 z-10"
    />

    <div className="relative h-48 overflow-hidden">
      <img
        src={document.thumbnail_url}
        alt={document.title}
        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition duration-300" />
    </div>

    <div className="p-4 flex flex-col gap-2">
      <h3 className="text-md font-semibold text-gray-800 line-clamp-2">
        {document.title}
      </h3>
      <p className="text-sm text-gray-500 line-clamp-1">
        Thêm bởi: <span className="font-medium">{document.full_name}</span>
      </p>
      <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faThumbsUp} />
          <span>Thích</span>
        </div>
      </div>
    </div>
  </div>
);

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}) => (
  <div className="w-full flex flex-col gap-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4">
      {documents.map((doc) => (
        <DocumentCard key={doc.document_id} document={doc} />
      ))}
    </div>

    <div className="flex justify-center mt-4">
      <PaginationComponent
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    </div>
  </div>
);

export default DocumentList;
