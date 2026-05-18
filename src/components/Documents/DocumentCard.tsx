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
    <div className="surface-card surface-card-hover group relative flex h-full cursor-pointer flex-col overflow-hidden">
      <NavLink
        to={`/document/${document.document_id}`}
        className="absolute inset-0 z-10"
      />

      {/* Thumbnail */}
      <div className="relative flex h-[200px] justify-center overflow-hidden bg-canvas">
        <img
          src={document.thumbnail_url}
          alt={document.title}
          className="h-full w-3/4 border border-line object-fill transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-ink/0 transition-all duration-300 group-hover:bg-ink/[0.04]" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-2">
          <h3 className="min-h-12 text-[15px] font-bold leading-6 text-ink line-clamp-2">
            {document.title}
          </h3>
          <p className="text-sm text-ink-secondary line-clamp-1">
            Thêm bởi: <span className="font-medium text-ink">{document.full_name}</span>
          </p>
        </div>

        {/* Like Button */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <button
            onClick={handleLikeClick}
            className={`relative z-20 flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-200 ${
              isLiked
                ? 'bg-primary-soft text-primary'
                : 'text-neutral hover:bg-canvas hover:text-primary'
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
