import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import DocumentList from '../Component/Documents/DocumentList.tsx';
import documentsApi from '../api/documentsApi';

interface Document {
  document_id: number;
  full_name: string;
  title: string;
  thumbnail_url: string;
  is_public: boolean;
}

interface CategoryData {
  documents: Document[];
  category_name: string;
  category_description: string;
  pagination: {
    currentPage: number;
    totalCount: number;
    totalPages: number;
  };
}

const ITEMS_PER_PAGE = 10;

function Categories() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!id) {
        setError('ID chuyên mục không hợp lệ');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await documentsApi.getDocumentsByCategory(
          id,
          currentPage,
          ITEMS_PER_PAGE
        );
        setData(response.data);
      } catch (err) {
        console.error('Lỗi khi lấy tài liệu theo chuyên mục:', err);
        setError('Đã có lỗi xảy ra khi lấy tài liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchDocuments();
  }, [id, currentPage]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="text-center py-12 bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-4 text-lg text-gray-700">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const { documents, category_name, category_description, pagination } = data;

  // Empty State
  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="text-center py-12 bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Không tìm thấy tài liệu
          </h3>
          <p className="mt-2 text-gray-600">
            Chưa có tài liệu nào trong chuyên mục "{category_name}".
          </p>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {/* Category Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {category_name}
        </h1>
        {category_description && (
          <p className="text-gray-600 text-lg">{category_description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {pagination.totalCount} tài liệu
        </p>
      </div>

      {/* Document List */}
      <DocumentList
        documents={documents}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        onPageChange={handlePageChange}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Trang trước
          </button>
          <span className="text-gray-700 font-medium">
            Trang {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}

export default Categories;