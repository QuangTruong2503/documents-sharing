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
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      <PageTitle title="Upload Document" description="Upload your documents here" />
      
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-ink">Chia sẻ với thế giới</h1>
        <p className="mt-2 text-ink-secondary">Tài liệu, bài thuyết trình, nghiên cứu...</p>
      </div>

      <div className="w-full max-w-2xl">
        {!uploadSuccess ? (
          <>
            <div
              className={`flex flex-col items-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                isDragging ? "border-primary bg-primary-soft" : "border-line bg-surface"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label
                htmlFor="file-upload"
                className="btn-primary cursor-pointer px-6 py-3"
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
              <p className="mt-3 text-neutral">hoặc kéo và thả vào đây</p>
            </div>

            {selectedFile && (
              <div className="mt-6 text-center">
                <p className="mb-4 text-ink-secondary">
                  Đã chọn: <span className="font-medium">{selectedFile.name}</span>
                </p>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="btn-primary mx-auto flex gap-2 px-6 py-3"
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
          <p className="mt-4 text-center text-danger">{error}</p>
        )}

        {uploadSuccess && (
          <button
            onClick={resetUpload}
            className="btn-primary mx-auto mt-8 block px-6 py-3"
          >
            Tải lên tài liệu khác
          </button>
        )}
      </div>

      <div className="mt-8 space-y-2 text-center text-sm text-ink-secondary">
        <p>Hỗ trợ: PDF, TXT, DOCX</p>
        <p>
          Bằng cách tải lên, bạn đồng ý với{" "}
          <a href="/#" className="text-primary hover:text-primary-hover">
            Thỏa thuận tải lên
          </a>
        </p>
        <p>
          Bạn phải sở hữu bản quyền tài liệu. Xem thêm tại{" "}
          <a href="/" className="text-primary hover:text-primary-hover">
            Copyright FAQs
          </a>
        </p>
      </div>
    </div>
  );
}

export default UploadDocument;
