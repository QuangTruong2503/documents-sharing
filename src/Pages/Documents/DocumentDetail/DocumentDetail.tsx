import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import documentsApi from "../../../api/documentsApi";
import { checkNotSigned } from "../../../Helpers/CheckSigned";
import { formatDateToVN } from "../../../Helpers/formatDateToVN";

// Font Awesome Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faBookmark,
  faThumbsUp,
  faThumbsDown,
  faShareAlt,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";

// Định nghĩa interface
interface DocumentData {
  document_id: number;
  user_id: string;
  title: string;
  description: string;
  file_url: string;
  is_public: boolean;
  download_count: number;
  uploaded_at: string;
  full_name: string;
}

const PdfViewer: React.FC = () => {
  const { documentID } = useParams<{ documentID: string }>();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [likePercentage, setLikePercentage] = useState(62); // Giả lập giá trị
  const [dislikePercentage, setDislikePercentage] = useState(38); // Giả lập giá trị
  const [isDownloading, setIsDownloading] = useState<boolean>(false); // Thêm state mới

  // Hàm tải xuống tài liệu
  const handleDownloadDocument = async () => {
    setIsDownloading(true); // Disable nút download
    try {
      checkNotSigned();
      const response = await documentsApi.downloadDocumentByID(documentID);
      if (response.data.success) {
        const downloadURL = response.data.downloadURL;
        const link = document.createElement("a");
        link.href = downloadURL;
        link.target = "_blank";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadURL);
      }
    } catch (error) {
      console.error("Error downloading document:", error);
    } finally {
      setIsDownloading(false); // Enable lại nút download
    }
  };

  // Các hàm xử lý cho các nút khác (chưa triển khai logic cụ thể)
  const handleSave = () => {
    alert("Chức năng Save chưa được triển khai!");
  };

  const handleLike = () => {
    alert("Chức năng Like chưa được triển khai!");
    setLikePercentage(likePercentage + 1);
  };

  const handleDislike = () => {
    alert("Chức năng Dislike chưa được triển khai!");
    setDislikePercentage(dislikePercentage);
  };

  const handleShare = () => {
    alert("Chức năng Share chưa được triển khai!");
  };

  const handleReport = () => {
    alert("Chức năng Report chưa được triển khai!");
  };

  useEffect(() => {
    window.scroll({ top: 0, behavior: "smooth" }); // Cuộn lên đầu trang
    // Lấy dữ liệu danh sách tài liệu
    const fetchDocumentData = async () => {
      if (!documentID) {
        setError("Document ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await documentsApi.getDocumentByID(documentID);
        setDocumentData(response.data);
      } catch (err) {
        console.error("Error fetching document:", err);
        setError(err.response?.data || "Error fetching document");
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [documentID]);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 font-semibold text-xl">{error}</div>;
  }

  if (!documentData) {
    return <div className="text-center p-4">No document data available</div>;
  }

  return (
    <div className="w-full flex flex-col md:flex-row gap-4">
      {/* Left Sidebar with Interaction Buttons */}
      <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-md flex flex-col items-start">
        {/* Title */}
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          {documentData.title}
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-4 text-sm line-clamp-4">
          {documentData.description}
        </p>

        {/* Author and Date */}
        <p className="text-gray-500 text-sm mb-4">
          Được tải bởi{" "}
          <a
            href="/public-profile"
            className="font-semibold text-gray-600 underline"
          >
            {documentData.full_name}
          </a>{" "}
          vào {formatDateToVN(documentData.uploaded_at)}
        </p>

        {/* Download count */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center space-x-2">
            <span>{documentData.download_count} lượt tải</span>
          </div>
        </div>

        {/* Interaction Buttons */}
        <div className="w-full grid lg:grid-cols-3 grid-cols-2 gap-2">
          <button
            onClick={handleDownloadDocument}
            disabled={isDownloading} // Disable nút khi đang tải xuống
            className={`flex flex-col items-center p-2 rounded-lg ${
              isDownloading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <FontAwesomeIcon icon={faDownload} className="text-gray-600 mb-1" />
            <span className="text-sm text-gray-600">
              {isDownloading ? "..." : "Download"}
            </span>
          </button>

          <button
            onClick={handleLike}
            className="flex flex-col items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <FontAwesomeIcon icon={faThumbsUp} className="text-gray-600 mb-1" />
            <span className="text-sm text-gray-600">{likePercentage}%</span>
          </button>
          <button
            onClick={handleDislike}
            className="flex flex-col items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <FontAwesomeIcon
              icon={faThumbsDown}
              className="text-gray-600 mb-1"
            />
            <span className="text-sm text-gray-600">{dislikePercentage}%</span>
          </button>
          <button
            onClick={handleSave}
            className="flex flex-col items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <FontAwesomeIcon icon={faBookmark} className="text-gray-600 mb-1" />
            <span className="text-sm text-gray-600">Save</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <FontAwesomeIcon icon={faShareAlt} className="text-gray-600 mb-1" />
            <span className="text-sm text-gray-600">Share</span>
          </button>
          <button
            onClick={handleReport}
            className=" flex flex-col items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <FontAwesomeIcon icon={faFlag} className="text-gray-600 mb-1" />
            <span className="text-sm text-gray-600">Report</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow-md">
        {/* PDF Viewer */}
        <div className="w-full h-[600px] max-h-svh border border-gray-300 rounded-lg">
          <iframe
            src={
              "https://docs.google.com/gview?url=" +
              documentData.file_url +
              "&embedded=true"
            }
            className="w-full h-full rounded-lg"
            title="PDF Viewer"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
