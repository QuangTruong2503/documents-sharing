import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

function UploadDocument() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log("Selected file:", file.name);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      console.log("Dropped file:", file.name);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-24 py-10 px-5 bg-white shadow-white">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 mt-10">Publish to the world</h1>
      <p className="text-gray-600 mb-8">
        Các bài thuyết trình, tài liệu nghiên cứu, tài liệu pháp lý, v.v.
      </p>
      <div
        className={`lg:border-2 ${
            isDragging ? "border-teal-500 bg-teal-50" : "border-gray-300 bg-white"
          } border-dashed md:border-2 md:p-8 p-4 w-full md:w-1/2 rounded-lg flex flex-col items-center`}
          
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor="file-upload"
          className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 cursor-pointer focus:outline-none"
        >
          Select Documents To Upload
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
      {selectedFile && (
        <div className="flex flex-col items-center gap-2">
            <div className="mt-4 text-gray-700">
                Đã chọn file: <strong>{selectedFile.name}</strong>
            </div>
            <button type="button" className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 cursor-pointer focus:outline-none">
                <span className="me-2"><FontAwesomeIcon icon={faArrowUp}/></span>
                <span>Tải lên</span>
            </button>
        </div>
      )}
      <p className="text-sm text-gray-500 mt-8">
        Supported file types: pdf, txt, docx
      </p>
      <p className="text-sm text-gray-500">
        By uploading, you agree to our{" "}
        <a href="/" className="text-teal-500 underline">
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
