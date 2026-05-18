import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight,
  faArrowUp,
  faCheckCircle,
  faCloudArrowUp,
  faFileLines,
  faShieldHalved,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import UploadSuccessComponent from "./UploadSuccessComponent.tsx";
import documentsApi from "api/documentsApi.js";
import PageTitle from "components/PageTitle.js";

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

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setError(null);
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

  const formatFileSize = (size: number) => {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageTitle title="Tải tài liệu" description="Tải lên và chia sẻ tài liệu của bạn" />

      <section className="mb-8 border-b border-line pb-6">
        <p className="mb-2 text-sm font-semibold text-primary">Đóng góp tài liệu</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">Tải lên tài liệu mới</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Chọn tài liệu, kiểm tra lại thông tin, thêm danh mục và tag để người khác tìm thấy dễ hơn.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-ink-secondary">
            <span className="rounded-md border border-line px-3 py-2">PDF</span>
            <span className="rounded-md border border-line px-3 py-2">DOCX</span>
            <span className="rounded-md border border-line px-3 py-2">TXT</span>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl">
        {!uploadSuccess ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div
              className={`surface-card flex min-h-[320px] flex-col items-center justify-center border-2 border-dashed p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary-soft" : "border-line bg-surface"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
                <FontAwesomeIcon icon={faCloudArrowUp} className="text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-ink">Kéo thả tài liệu vào đây</h2>
              <p className="mt-2 text-sm text-ink-secondary">
                Hoặc chọn file từ máy tính của bạn.
              </p>

              <label
                htmlFor="file-upload"
                className="btn-primary mt-6 cursor-pointer px-6 py-3"
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

              <p className="mt-4 text-xs text-neutral">
                Chỉ hỗ trợ PDF, DOCX, TXT. Hãy đảm bảo bạn có quyền chia sẻ tài liệu.
              </p>
            </div>

            <aside className="surface-card p-5">
              <h2 className="text-base font-bold text-ink">Trạng thái upload</h2>
              {selectedFile ? (
                <div className="mt-4 rounded-lg border border-line bg-canvas p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                      <FontAwesomeIcon icon={faFileLines} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-ink">
                        {selectedFile.name}
                      </p>
                      <p className="mt-1 text-xs text-ink-secondary">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="rounded-md p-1 text-neutral transition hover:bg-danger/10 hover:text-danger"
                      title="Bỏ chọn"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-line bg-canvas p-4 text-sm text-ink-secondary">
                  Chưa chọn tài liệu.
                </div>
              )}

              <div className="mt-5 space-y-3 text-sm text-ink-secondary">
                <p className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
                  Sau khi upload, bạn sẽ bổ sung tiêu đề, mô tả, tag và danh mục.
                </p>
                <p className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-primary" />
                  Có thể đặt tài liệu công khai hoặc riêng tư ở bước tiếp theo.
                </p>
              </div>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="btn-primary mt-6 w-full gap-2 px-6 py-3"
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
              )}
            </aside>
          </div>
        ) : (
          documentResponse && <UploadSuccessComponent document={documentResponse} />
        )}

        {error && (
          <div className="mt-4 rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </div>
        )}

        {uploadSuccess && (
          <button
            onClick={resetUpload}
            className="btn-secondary mx-auto mt-8 flex items-center gap-2 px-6 py-3"
          >
            <FontAwesomeIcon icon={faArrowRotateRight} />
            Tải lên tài liệu khác
          </button>
        )}
      </div>
    </div>
  );
}

export default UploadDocument;
