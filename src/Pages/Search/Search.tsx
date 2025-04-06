import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import DocumentList from '../../Component/Documents/DocumentList.tsx'; // Assuming this is the path
import documentsApi from '../../api/documentsApi';

interface Document {
  document_id: number;
  full_name: string;
  title: string;
  thumbnail_url: string;
  is_public: boolean;
}

interface ResponseData {
  documents: Document[];
  pagination: {
    currentPage: number;
    totalCount: number;
    totalPages: number;
  };
}

const Search: React.FC = () => {
  const { search } = useParams<{ search?: string }>();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchDocuments = useCallback(async () => {
    if (!search) {
      setError('Vui lòng nhập từ khóa tìm kiếm');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await documentsApi.getSearchDocuments(search, currentPage, 10);
      const data: ResponseData = response.data;

      setDocuments(data.documents);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      console.error('Lỗi khi tìm kiếm tài liệu:', err);
      setError('Không thể tải tài liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchDocuments();
  }, [fetchDocuments]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    fetchDocuments();
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">
            Kết quả tìm kiếm cho: <span className="text-blue-600">"{search || ''}"</span>
          </h1>
          {totalCount > 0 && (
            <p className="mt-1 text-sm text-gray-600">
              Tìm thấy {totalCount} tài liệu
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Đang tìm kiếm tài liệu...</p>
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
              Không có kết quả phù hợp với từ khóa "{search}". Hãy thử từ khóa khác!
            </p>
          </div>
        )}

        {/* Results State with DocumentList */}
        {!loading && !error && documents.length > 0 && (
          <DocumentList
            documents={documents}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default Search;