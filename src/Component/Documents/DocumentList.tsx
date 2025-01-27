import { faBookmark as faBookmarkRegular, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { faBookmark as faBookmarkSolid } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { NavLink } from "react-router-dom";
interface Document {
  document_id: number;
  full_name: string;
  title: string;
  thumbnail_url: string;
  like_count: number;
  is_public: boolean;
  saved: boolean;
}
const DocumentCard: React.FC<{ document: Document }> = ({ document }) => (
  <div className="border rounded-sm  p-4 bg-white flex flex-col justify-between cursor-pointer hover:shadow-lg relative">
    <NavLink
      to={`/document/${document.document_id}`}
      className="w-full h-full absolute left-0 top-0 z-0"
    ></NavLink>
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
      <button className="px-2 py-0.5 rounded-full hover:bg-blue-100 text-lg z-10 text-blue-500">
        {document.saved ? (
          <FontAwesomeIcon icon={faBookmarkSolid} />
        ) : (
          <FontAwesomeIcon icon={faBookmarkRegular} />
        )}
      </button>
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
