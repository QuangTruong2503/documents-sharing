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
  <div className="w-full flex flex-col bg-white rounded-lg shadow-sm p-6">
    {/* Document Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 py-4">
      {documents.map((doc, index) => (
        <div
          key={doc.document_id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <DocumentCard document={doc} />
        </div>
      ))}
    </div>

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="flex justify-center mt-6">
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      </div>
    )}
  </div>
);

// CSS Animation
const styles = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }
`;

const DocumentListWithStyles: React.FC<DocumentListProps> = (props) => (
  <>
    <style>{styles}</style>
    <DocumentList {...props} />
  </>
);

export default DocumentListWithStyles;