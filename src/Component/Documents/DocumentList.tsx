import { faBookmark, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface Document {
  document_id: number;
  full_name: string;
  title: string;
  thumbnail_url: string;
  like_count: number;
  is_public: boolean;
}

const DocumentCard: React.FC<{ document: Document }> = ({ document }) => (
  <div className="border rounded-lg  p-4 bg-white flex flex-col justify-between cursor-pointer hover:shadow-lg">
    <img
      src={document.thumbnail_url}
      alt={document.title}
      className="rounded-lg w-full h-48 object-cover"
    />
    <div className="mt-4 flex flex-col justify-between">
      <h3 className="text-lg font-semibold text-gray-800 overflow-hidden line-clamp-2">
        {document.title}
      </h3>
      <p className="text-sm text-gray-500">Added by: {document.full_name}</p>
    </div>
    <div className="flex items-center justify-between mt-2">
      <div className="text-gray-600 text-sm flex items-center gap-1">
        <span>
          <FontAwesomeIcon icon={faThumbsUp} />
        </span>
        <span>{document.like_count}</span>
      </div>
      <button className="p-1 rounded hover:bg-blue-100 text-lg z-50"><FontAwesomeIcon icon={faBookmark}/></button>
    </div>
  </div>
);

const DocumentList: React.FC<{ documents: Document[] }> = ({ documents }) => (
  <div className="grid grid-cols-2  md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
    {documents.map((doc) => (
      <DocumentCard key={doc.document_id} document={doc} />
    ))}
  </div>
);

export default DocumentList;
