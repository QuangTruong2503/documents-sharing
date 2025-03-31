import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react'
import { NavLink } from 'react-router-dom';
interface Document {
    document_id: number;
    full_name: string;
    title: string;
    thumbnail_url: string;
  }
  const DocumentCard: React.FC<{ document: Document }> = ({ document }) => (
    <div className="relative overflow-hidden py-2 px-4 bg-white border border-gray-200 hover:border-gray-400 transition-colors duration-300 cursor-pointer group h-full">
      <NavLink
        to={`/document/${document.document_id}`}
        className="absolute inset-0 z-10"
      />
  
      <div className="relative h-48 overflow-hidden flex justify-center">
        <img
          src={document.thumbnail_url}
          alt={document.title}
          className="w-3/4 h-full object-fill border border-gray-200 shadow-sm"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0" />
      </div>
  
      {/* 📌 Flex container để giữ "Thích" ở đáy */}
      <div className="p-4 flex flex-col justify-between gap-2 h-[calc(100%-12rem)]"> 
        {/* 12rem ≈ chiều cao phần ảnh + padding, có thể điều chỉnh tùy nhu cầu */}
  
        {/* Nội dung trên */}
        <div className="flex flex-col gap-2">
          <h3 className="text-md min-h-12 font-semibold text-gray-800 line-clamp-2">
            {document.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-1">
            Thêm bởi: <span className="font-medium">{document.full_name}</span>
          </p>
        </div>
  
        {/* Nút thích ở chân */}
        <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faThumbsUp} />
            <span>Thích</span>
          </div>
        </div>
      </div>
    </div>
  );

export default DocumentCard