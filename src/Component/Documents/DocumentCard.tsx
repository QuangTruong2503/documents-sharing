import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface Document {
  document_id: number;
  full_name: string;
  title: string;
  thumbnail_url: string;
}

const DocumentCard: React.FC<{ document: Document }> = ({ document }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent NavLink from triggering
    setIsLiked(!isLiked);
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col">
      <NavLink
        to={`/document/${document.document_id}`}
        className="absolute inset-0 z-10"
      />

      {/* Thumbnail */}
      <div className="relative h-48 flex justify-center overflow-hidden">
        <img
          src={document.thumbnail_url}
          alt={document.title}
          className=" w-3/4 h-full object-fill border border-gray-200 shadow-sm transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div className="space-y-2">
          <h3 className="text-md font-semibold text-gray-800 line-clamp-2 min-h-12">
            {document.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1">
            Thêm bởi: <span className="font-medium text-gray-700">{document.full_name}</span>
          </p>
        </div>

        {/* Like Button */}
        <div className="mt-3 flex justify-between items-center text-sm">
          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors duration-200 ${
              isLiked
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
            }`}
          >
            <FontAwesomeIcon
              icon={faThumbsUp}
              className={`w-4 h-4 ${isLiked ? 'animate-bounce-once' : ''}`}
            />
            <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
          </button>
        </div>
      </div>

      {/* Animation Styles */}
      <style >{`
        @keyframes bounce-once {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default DocumentCard;