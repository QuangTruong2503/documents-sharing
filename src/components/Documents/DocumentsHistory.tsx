import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import DocumentListWithStyles from "./DocumentList.tsx"; // Đường dẫn tới DocumentListWithStyles
import documentsApi from "api/documentsApi.js";

interface Document {
  document_id: number;
  full_name: string;
  title: string;
  thumbnail_url: string;
  is_public: boolean;
  uploaded_at: string;
}

// Giả định DocumentCardSkeleton component
const DocumentCardSkeleton: React.FC = () => (
  <div className="surface-card flex h-full animate-pulse flex-col overflow-hidden">
    {/* Skeleton Thumbnail */}
    <div className="relative flex h-[200px] justify-center overflow-hidden bg-canvas">
      <div className="h-full w-3/4 rounded-md bg-gray-200"></div>
    </div>
    {/* Skeleton Content */}
    <div className="flex flex-1 flex-col justify-between p-4">
      <div className="space-y-2">
        <div className="h-6 w-3/4 rounded-md bg-gray-200"></div>
        <div className="h-5 w-1/2 rounded-md bg-gray-200"></div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="h-8 w-24 rounded-md bg-gray-200"></div>
      </div>
    </div>
  </div>
);

const HistoryViewedDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages] = useState<number>(1); // Giả sử không có phân trang từ API
  const [totalCount, setTotalCount] = useState<number>(0);

  // Hàm gọi API để lấy danh sách tài liệu từ documentIDs
  const fetchHistoryDocuments = async (documentHistory: string[]) => {
    try {
      setLoading(true);
      const response = await documentsApi.getDocumentsByHistory(documentHistory);
      if (response.data) {
        setDocuments(response.data);
        setTotalCount(response.data.length);
      } else {
        setError("No documents found in history.");
      }
    } catch (err) {
      console.error("Error fetching history documents:", err);
      setError("Failed to load history documents.");
    } finally {
      setLoading(false);
    }
  };

  // Lấy documentIDs từ Cookies và gọi API khi component mount
  useEffect(() => {
    const history = Cookies.get("documentHistory")
      ? JSON.parse(Cookies.get("documentHistory")!)
      : [];

    if (history.length > 0) {
      fetchHistoryDocuments(history);
    } else {
      setLoading(false);
      setError("No viewing history available.");
    }
  }, []);

  // Xử lý thay đổi trang (nếu có phân trang trong tương lai)
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Nếu API hỗ trợ phân trang, bạn có thể gọi lại fetchHistoryDocuments với page
  };

  // Render logic
  if (loading) {
    return (
      <div className="w-full py-8">
        <h2 className="mb-5 font-display text-2xl font-bold tracking-[-0.03em] text-ink">Tài Liệu Đã Xem</h2>
        <div className="grid grid-cols-1 gap-5 py-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array(5) // Hiển thị 5 skeleton cards khi đang tải
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <DocumentCardSkeleton />
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 text-red-500"></div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-4"></div>
    );
  }

  return (
    <div className="w-full py-8">
      <h2 className="mb-5 font-display text-2xl font-bold tracking-[-0.03em] text-ink">Tài Liệu Đã Xem</h2>
      <DocumentListWithStyles
        documents={documents}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default HistoryViewedDocuments;
