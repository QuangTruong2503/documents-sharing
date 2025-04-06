import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import UploadSuccessComponent from "./UploadSuccessComponent.tsx";
import documentsApi from "../../../api/documentsApi.js";
import PageTitle from "../../../Component/PageTitle.js";

interface DocumentResponse {
  message: string;
  success: boolean;
  document_id: number;
  title: string;
  thumbnail_url: string;
}

function UploadDocument() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentResponse, setDocumentResponse] = useState<DocumentResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFileType(file)) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError("Chỉ hỗ trợ các định dạng: PDF, DOCX, TXT");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && isValidFileType(file)) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError("Chỉ hỗ trợ các định dạng: PDF, DOCX, TXT");
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    return validTypes.includes(file.type);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn một tài liệu trước khi tải lên");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await documentsApi.postDocument(formData);
      const data: DocumentResponse = response.data;
      if (data.success) {
        setDocumentResponse(data);
        setUploadSuccess(true);
      } else {
        setError(data.message || "Tải lên thất bại");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đã xảy ra lỗi khi tải lên");
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadSuccess(false);
    setDocumentResponse(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <PageTitle title="Upload Document" description="Upload your documents here" />
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Chia sẻ với thế giới</h1>
        <p className="mt-2 text-gray-600">Tài liệu, bài thuyết trình, nghiên cứu...</p>
      </div>

      <div className="w-full max-w-2xl">
        {!uploadSuccess ? (
          <>
            <div
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors font-medium"
              >
                Chọn tài liệu
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
              />
              <p className="mt-3 text-gray-500">hoặc kéo và thả vào đây</p>
            </div>

            {selectedFile && (
              <div className="mt-6 text-center">
                <p className="text-gray-700 mb-4">
                  Đã chọn: <span className="font-medium">{selectedFile.name}</span>
                </p>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    "Đang tải..."
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faArrowUp} />
                      Tải lên
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          documentResponse && <UploadSuccessComponent document={documentResponse} />
        )}

        {error && (
          <p className="text-red-600 mt-4 text-center">{error}</p>
        )}

        {uploadSuccess && (
          <button
            onClick={resetUpload}
            className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mx-auto block"
          >
            Tải lên tài liệu khác
          </button>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500 space-y-2">
        <p>Hỗ trợ: PDF, TXT, DOCX</p>
        <p>
          Bằng cách tải lên, bạn đồng ý với{" "}
          <a href="/#" className="text-blue-600 hover:underline">
            Thỏa thuận tải lên
          </a>
        </p>
        <p>
          Bạn phải sở hữu bản quyền tài liệu. Xem thêm tại{" "}
          <a href="/" className="text-blue-600 hover:underline">
            Copyright FAQs
          </a>
        </p>
      </div>
    </div>
  );
}

export default UploadDocument;