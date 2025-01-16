import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import UploadSuccessComponent from "./UploadSuccessComponent.tsx";
import documentsApi from "../../api/documentsApi.js";
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
  const [documentResponse, setDocumentResponse] =
    useState<DocumentResponse | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null); // Clear error if file selected
      console.log("Selected file:", file.name);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null); // Clear error if file selected
      console.log("Dropped file:", file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file before uploading.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await documentsApi.postDocument(formData);
      const data: DocumentResponse = response.data;
      if (data.success) {
        setDocumentResponse({
          message: "File uploaded successfully!",
          success: true,
          document_id: data.document_id,
          title: data.title,
          thumbnail_url: data.thumbnail_url,
        });
        setUploadSuccess(true);
        setLoading(false);
      }
      // Fake upload request simulation
    } catch (err) {
      setError("An error occurred during upload. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-5">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 mt-10">
        Publish to the world
      </h1>
      <p className="text-gray-600 mb-8">
        Các bài thuyết trình, tài liệu nghiên cứu, tài liệu pháp lý, v.v.
      </p>

      {!uploadSuccess && (
        <div
          className={`lg:border-2 ${
            isDragging
              ? "border-teal-500 bg-teal-50"
              : "border-gray-300 bg-white"
          } border-dashed md:border-2 md:p-8 p-4 w-full md:w-1/2 rounded-lg flex flex-col items-center`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label
            htmlFor="file-upload"
            className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 cursor-pointer focus:outline-none"
          >
            Chọn tài liệu để tải lên
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="application/pdf, .docx, .txt"
            onChange={handleFileChange}
          />
          <p className="text-gray-500 mt-4">or drag & drop</p>
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {selectedFile && !uploadSuccess && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <div className="text-gray-700">
            Đã chọn file: <strong>{selectedFile.name}</strong>
          </div>
          <button
            onClick={handleUpload}
            type="button"
            disabled={loading ? true : false}
            className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 cursor-pointer focus:outline-none flex items-center"
          >
            {loading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <FontAwesomeIcon icon={faArrowUp} className="mr-2" />
                <span>Tải lên</span>
              </>
            )}
          </button>
        </div>
      )}

      {uploadSuccess && documentResponse && (
        <UploadSuccessComponent document={documentResponse} />
      )}
      {uploadSuccess && documentResponse && (
        <button
          type="button"
          className="bg-teal-500 text-white  px-4 py-2 mt-8 rounded-md hover:bg-teal-600 cursor-pointer focus:outline-none flex items-center"
          onClick={() => window.location.reload()}
        >Tiếp tục tải lên</button>
      )}
      <p className="text-sm text-gray-500 mt-5">
        Supported file types: pdf, txt, docx
      </p>
      <p className="text-sm text-gray-500">
        By uploading, you agree to our{" "}
        <a href="/#" className="text-teal-500 underline">
          Uploader Agreement
        </a>
      </p>
      <p className="text-sm text-gray-500">
        You must own the copyright to any document you share. You can read more
        about this in our{" "}
        <a href="/" className="text-teal-500 underline">
          Copyright FAQs
        </a>
      </p>
    </div>
  );
}

export default UploadDocument;
