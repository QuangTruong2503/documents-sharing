import React, { useEffect, useState } from "react";
import documentsApi from "../../api/documentsApi";

interface DocumentInfor {
  title: string;
  description: string;
  file_size: number;
  file_type: string;
  uploaded_at: Date;
  full_name: string;
  is_public: boolean;
}

interface ModalInforProps {
  documentID: number | null; // Thêm type cho documentID
  onClose: () => void;
}

const ModalInfor: React.FC<ModalInforProps> = ({ documentID, onClose }) => {
  const [document, setDocument] = useState<DocumentInfor | undefined>(
    undefined
  );

  useEffect(() => {
    const handleGetDocument = async () => {
      try {
        const response = await documentsApi.getDocumentByID(documentID);
        setDocument(response.data);
      } catch (err) {
        console.error("Error fetching document:", err);
      }
    };

    if (documentID) {
      // Chỉ gọi API khi có documentID
      handleGetDocument();
    }
  }, [documentID]); // Thêm documentID vào dependency array

  // Debug log
  useEffect(() => {
    if (document) {
      console.log("Document updated:", document);
    }
  }, [document]);

  // Render loading state khi document chưa được tải
  if (!document) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div className="bg-white rounded-lg p-6">
          <div className="text-center text-lg">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold m-0">Thông Tin</h2>
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-3">
            <p className="m-0 line-clamp-5">
              <strong className="text-gray-700">Tiêu đề:</strong>{" "}
              {document.title}
            </p>
            <p className="m-0 line-clamp-5">
              <strong className="text-gray-700">Mô tả:</strong>{" "}
              {document.description? document.description : <small>Không có mô tả...</small>}
            </p>
            <p className="m-0">
              <strong className="text-gray-700">Dung lượng:</strong>{" "}
              {(document.file_size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="m-0">
              <strong className="text-gray-700">Kiểu file:</strong>{" "}
              {document.file_type}
            </p>
            <p className="m-0">
              <strong className="text-gray-700">Thời gian tải:</strong>{" "}
              {new Date(document.uploaded_at).toLocaleDateString()}
            </p>
            <p className="m-0">
              <strong className="text-gray-700">Tác giả:</strong>{" "}
              {document.full_name}
            </p>
            <p className="m-0">
              <strong className="text-gray-700">Trạng thái:</strong>{" "}
              {document.is_public ? "Công khai" : "Riêng tư"}
            </p>
          </div>
        </div>
        <div className="p-5 border-t border-gray-200 flex justify-end">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalInfor;
