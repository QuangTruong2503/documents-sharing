import React from "react";
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
}) => (
  <div className="surface-card flex w-full flex-col p-4 sm:p-6">
    {/* Document Grid */}
    <div className="grid grid-cols-1 gap-5 py-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
  </div>
);



const DocumentListWithStyles: React.FC<DocumentListProps> = (props) => (
  <>
    <DocumentList {...props} />
  </>
);

export default DocumentListWithStyles;
