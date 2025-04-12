import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import DocumentList from '../Component/Documents/DocumentList.tsx';
import documentsApi from '../api/documentsApi';

interface Document {
  document_id: number;
  full_name: string;
  title: string;
  thumbnail_url: string;
  is_public: boolean;
}

interface ResponseData {
  documents: Document[];
  category_name: string;
  category_description: string;
  pagination: {
    currentPage: number;
    totalCount: number;
    totalPages: number;
  };
}

function Categories() {
  const { id } = useParams<{ id: string }>();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryDescription, setCategoryDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchDocuments = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await documentsApi.getDocumentsByCategory(id, currentPage, 10);
      const data: ResponseData = response.data;
      setCategoryName(data.category_name);
      setCategoryDescription(data.category_description);
      setDocuments(data.documents);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      console.error('Lỗi khi lấy tài liệu theo chuyên mục:', err);
      setError('Đã có lỗi xảy ra khi lấy tài liệu.');
    } finally {
      setLoading(false);
    }
  }, [id, currentPage]);

  useEffect(() => {
    window.scroll({ top: 0, behavior: 'smooth' });
    fetchDocuments();
  }, [fetchDocuments]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scroll({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    fetchDocuments();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải tài liệu...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm p-6">
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
      )}

      {/* No Results State */}
      {!loading && !error && documents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm p-6">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Không tìm thấy tài liệu
          </h3>
          <p className="mt-2 text-gray-600">
            Không có tài liệu nào trong chuyên mục '{categoryName}'.
          </p>
        </div>
      )}

      {/* Results State with DocumentList */}
      {!loading && !error && documents.length > 0 && (
        <>
          <div className='mb-4'>
            <h2 className="text-2xl font-bold text-gray-800">{categoryName}</h2>
            <p className="text-gray-600">{categoryDescription}</p>
          </div>
          <DocumentList
          documents={documents}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
        </>
      )}

      {/* Pagination */}
      {!loading && !error && documents.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:bg-gray-200"
          >
            Trước
          </button>
          <span className="mx-4 text-lg text-gray-700">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:bg-gray-200"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

export default Categories;
