import { faLockOpen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { NavLink } from "react-router-dom";

interface Document {
  document_id: number;
  title: string;
  like_count: number;
  status: string;
  thumbnail_url: string;
  date: string;
  pages: number;
  reads: number;
  is_public: boolean;
}

const DocumentCard: React.FC<{ document: Document }> = ({ document }) => {
  return (
    <div className="border rounded-sm p-4 my-2 bg-white flex flex-col sm:flex-row justify-between shadow-md relative">
      <div className="sm:w-1/4 w-full sm:pr-4 flex justify-center sm:justify-start">
        <img
          src={document.thumbnail_url}
          alt={document.title}
          className="rounded-lg w-full sm:h-32 h-40 object-cover"
        />
      </div>
      <div className="overflow-hidden w-full flex flex-col justify-between mt-4 sm:mt-0">
        <div className="flex justify-between items-start flex-wrap">
          <div className="w-full sm:w-auto">
            <NavLink to={`#`} className="text-2xl font-bold text-gray-800 overflow-hidden whitespace-nowrap text-ellipsis">
              {document.title}
            </NavLink>
          </div>
        </div>
      </div>
      <div className="flex flex-col space-x-2 absolute top-4 right-4 ml-4 sm:static sm:self-center">
        <div className="flex gap-3 text-lg">
        <button className="text-gray-500 hover:text-gray-700" >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faLockOpen}/>
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faTrash}/>
        </button>
        </div>
        <div className="mt-4 text-lg text-gray-500">
          <p>Status: {document.status}</p>
          <p>Date: {document.date}</p>
          <p>Reads: {document.reads}</p>
          <p>{document.is_public ? "Public" : "Private"}</p>
        </div>
      </div>
    </div>
  );
};
const DocumentListForEdit: React.FC<{ documents: Document[] }> = ({
  documents,
}) => (
  <div className="p-4">
    {documents.map((doc) => (
      <DocumentCard key={doc.document_id} document={doc} />
    ))}
  </div>
);

export default DocumentListForEdit;
