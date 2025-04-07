import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import DocumentListWithStyles from "./DocumentList.tsx"; // Đường dẫn tới DocumentListWithStyles
import documentsApi from "../../api/documentsApi.js";

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
  <div className="relative overflow-hidden bg-white rounded-lg shadow-md h-full flex flex-col animate-pulse">
    {/* Skeleton Thumbnail */}
    <div className="relative h-48 flex justify-center overflow-hidden">
      <div className="w-3/4 h-full bg-gray-200 rounded-md"></div>
    </div>
    {/* Skeleton Content */}
    <div className="p-4 flex flex-col justify-between flex-1">
      <div className="space-y-2">
        <div className="w-3/4 h-6 bg-gray-200 rounded-md"></div>
        <div className="w-1/2 h-5 bg-gray-200 rounded-md"></div>
      </div>
      <div className="mt-3 flex justify-between items-center text-sm">
        <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
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
      <div className="w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Tài Liệu Đã Xem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 py-4">
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
    <div className="w-full p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Tài Liệu Đã Xem</h2>
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