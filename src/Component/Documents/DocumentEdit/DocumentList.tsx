import React from "react";
import DocumentCard from "./DocumentCard.tsx";

interface Document {
  document_id: number;
  title: string;
  description: string | null;
  thumbnail_url: string;
  like_count: number;
  uploaded_at: string;
  is_public: boolean;
}

interface DocumentListProps {
  documents: Document[];
  actionButtons: (doc: Document) => React.ReactNode; // Hàm trả về các nút hành động cho từng tài liệu
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, actionButtons }) => {
  return (
    <div className="grid grid-cols-1">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.document_id}
          document={doc}
          actionButtons={actionButtons(doc)}
        />
      ))}
    </div>
  );
};

export default DocumentList;