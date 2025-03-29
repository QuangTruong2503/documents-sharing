import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import DocumentList from '../../Component/Documents/DocumentList.tsx';
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

function Search() {
  const { search } = useParams<{ search?: string }>();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchDocuments = useCallback(async () => {
    if (!search) return;

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
      setError('Đã có lỗi xảy ra khi tìm kiếm tài liệu.');
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    window.scroll({top: 0, behavior: "smooth"})
    fetchDocuments();
  }, [fetchDocuments]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {loading && <p>Đang tải tài liệu...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && documents.length === 0 && (
        <p className="text-gray-600">Không tìm thấy tài liệu phù hợp với từ khóa "{search}"</p>
      )}
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
  );
}

export default Search;
