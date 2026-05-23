import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Star } from 'lucide-react';
import { toast } from 'react-toastify';
import workspaceLibraryApi from 'api/workspaceLibraryApi.ts';

interface Document {
  document_id?: number;
  id?: number;
  full_name?: string;
  ownerName?: string;
  title: string;
  name?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  isFavorite?: boolean;
}

const DocumentCard: React.FC<{ document: Document }> = ({ document }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(Boolean(document.isFavorite));
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const documentId = document.document_id || document.id;
  const title = document.title || document.name || "Tài liệu";
  const thumbnail = document.thumbnail_url || document.thumbnailUrl || "/logo.ico";
  const owner = document.full_name || document.ownerName || "DocShare";

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent NavLink from triggering
    setIsLiked(!isLiked);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!documentId || favoriteLoading) return;
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    setFavoriteLoading(true);
    try {
      await workspaceLibraryApi.setFavorite(documentId, { type: "document", favorite: nextFavorite });
    } catch (error: any) {
      setIsFavorite(!nextFavorite);
      toast.error(error?.response?.data?.message || "Không cập nhật được yêu thích.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="surface-card surface-card-hover group relative flex h-full cursor-pointer flex-col overflow-hidden">
      <NavLink
        to={`/document/${documentId}`}
        className="absolute inset-0 z-10"
      />

      {/* Thumbnail */}
      <div className="relative flex h-[200px] justify-center overflow-hidden bg-canvas">
        <img
          src={thumbnail}
          alt={title}
          className="h-full w-3/4 border border-line object-fill transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-ink/0 transition-all duration-300 group-hover:bg-ink/[0.04]" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-2">
          <h3 className="min-h-12 text-[15px] font-bold leading-6 text-ink line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-ink-secondary line-clamp-1">
            Thêm bởi: <span className="font-medium text-ink">{owner}</span>
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
          <button
            onClick={handleFavoriteClick}
            disabled={favoriteLoading}
            className={`relative z-20 flex h-8 w-8 items-center justify-center rounded-md transition ${
              isFavorite ? 'bg-warning/10 text-warning' : 'text-neutral hover:bg-canvas hover:text-warning'
            }`}
            title={isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
            aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-warning' : ''}`} />
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
