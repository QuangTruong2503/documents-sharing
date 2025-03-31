import React from "react";
import PaginationComponent from "../Pagination/Pagination.tsx";
import DocumentCard from "./DocumentCard.tsx";

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
const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}) => (
  <div className="w-full flex flex-col">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-4 py-4">
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
