import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import documentsApi from "../../../api/documentsApi";
import { checkNotSigned } from "../../../Helpers/CheckSigned";
import { formatDateToVN } from "../../../Helpers/formatDateToVN";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faBookmark,
  faThumbsUp,
  faThumbsDown,
  faShareAlt,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";
import PageTitle from "../../../Component/PageTitle";
import Cookies from "js-cookie";

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
  const [likePercentage, setLikePercentage] = useState(62);
  const [dislikePercentage, setDislikePercentage] = useState(38);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Hàm lưu lịch sử truy cập vào Cookies
  const saveHistoryToCookies = (docID: string) => {
    const history = Cookies.get("documentHistory")
      ? JSON.parse(Cookies.get("documentHistory")!)
      : [];
    
    // Loại bỏ documentID trùng lặp nếu đã tồn tại
    const updatedHistory = history.filter((id: string) => id !== docID);
    
    // Thêm documentID mới vào đầu mảng
    updatedHistory.unshift(docID);
    
    // Giới hạn tối đa 5 documentID
    if (updatedHistory.length > 5) {
      updatedHistory.pop(); // Xóa phần tử cuối nếu vượt quá 5
    }
    
    // Lưu lại vào Cookies với thời hạn hết hạn (ví dụ: 7 ngày)
    Cookies.set("documentHistory", JSON.stringify(updatedHistory), { expires: 7 });
    console.log("Document history saved to cookies:", updatedHistory);
  };

  // Fetch document data và lưu lịch sử
  useEffect(() => {
    window.scroll({ top: 0, behavior: "smooth" });

    const fetchDocumentData = async () => {
      if (!documentID) {
        setError("Document ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await documentsApi.getDocumentByID(documentID);
        if (response.data) {
          setDocumentData(response.data);
          // Lưu documentID vào Cookies sau khi tải dữ liệu thành công
          saveHistoryToCookies(documentID);
        } else {
          setError("No document data returned");
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError(err.response?.data?.message || "Error fetching document");
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [documentID]);

  // Handle download
  const handleDownloadDocument = async () => {
    setIsDownloading(true);
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
      setIsDownloading(false);
    }
  };

  // Placeholder handlers
  const handleSave = () => alert("Chức năng Save chưa được triển khai!");
  const handleLike = () => {
    alert("Chức năng Like chưa được triển khai!");
    setLikePercentage((prev) => prev + 1);
  };
  const handleDislike = () => {
    alert("Chức năng Dislike chưa được triển khai!");
    setDislikePercentage((prev) => prev);
  };
  const handleShare = () => alert("Chức năng Share chưa được triển khai!");
  const handleReport = () => alert("Chức năng Report chưa được triển khai!");

  // Render logic
  if (loading) {
    return <div className="text-center p-4">Đang tải...</div>;
  }

  if (error) {
    return <div className="text-center p-4 font-semibold text-xl">{error}</div>;
  }

  if (!documentData) {
    return <div className="text-center p-4">Không có dữ liệu tài liệu</div>;
  }

  return (
    <>
      <PageTitle title={documentData.title} description={documentData.description} />
      <div className="w-full flex flex-col md:flex-row gap-4">
        {/* Left Sidebar */}
        <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-md flex flex-col items-start">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">{documentData.title}</h1>
          <p className="text-gray-600 mb-4 text-sm line-clamp-4">{documentData.description}</p>
          <p className="text-gray-500 text-sm mb-4">
            Được tải bởi{" "}
            <a href="/public-profile" className="font-semibold text-gray-600 underline">
              {documentData.full_name}
            </a>{" "}
            vào {formatDateToVN(documentData.uploaded_at)}
          </p>
          <div className="flex items-center justify-between w-full mb-4">
            <span>{documentData.download_count} lượt tải</span>
          </div>
          <div className="w-full grid lg:grid-cols-3 grid-cols-2 gap-2">
            <button
              onClick={handleDownloadDocument}
              disabled={isDownloading}
              className={`flex flex-col items-center p-2 rounded-lg ${
                isDownloading ? "bg-gray-300 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <FontAwesomeIcon icon={faDownload} className="text-gray-600 mb-1" />
              <span className="text-sm text-gray-600">{isDownloading ? "..." : "Download"}</span>
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
              <FontAwesomeIcon icon={faThumbsDown} className="text-gray-600 mb-1" />
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
              className="flex flex-col items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <FontAwesomeIcon icon={faFlag} className="text-gray-600 mb-1" />
              <span className="text-sm text-gray-600">Report</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow-md">
          <div className="w-full h-[600px] max-h-svh border border-gray-300 rounded-lg">
            <iframe
              src={`https://docs.google.com/gview?url=${documentData.file_url}&embedded=true`}
              className="w-full h-full rounded-lg"
              title="PDF Viewer"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PdfViewer;