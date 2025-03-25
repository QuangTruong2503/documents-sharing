// EditModal.tsx
import React, { useState, useEffect } from "react";
import documentsApi from "../../api/documentsApi";
import { toast } from "react-toastify";
import Loader from "../Loaders/Loader";

interface EditModalProps {
  documentID: number | null;
  onClose: () => void;
  onUpdate: (updatedDoc: Document) => void; // Callback to update document in parent
}

interface Document {
  document_id: number;
  title: string;
  description: string | null;
  thumbnail_url: string;
  like_count: number;
  uploaded_at: string;
  is_public: boolean;
}

const EditModal: React.FC<EditModalProps> = ({
  documentID,
  onClose,
  onUpdate,
}) => {
  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch document details when modal opens
  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentID) return;
      try {
        setLoading(true);
        const response = await documentsApi.getDocumentByID(documentID);
        setDocumentData(response.data);
      } catch (err) {
        setError(err.response?.message || "Failed to load document details");
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [documentID]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setDocumentData((prev) =>
      prev ? { ...prev, [name]: type === "checkbox" ? checked : value } : null
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentData) return;

    try {
      setLoading(true);
      const response = await documentsApi.putDocumentUpdate(documentData);
      toast.success(response.data?.message || "Cập nhật tài liệu thành công!");
      onUpdate(response.data?.data); // Update parent component
      onClose(); // Close modal
    } catch (err) {
      toast.error("Cập nhật tài liệu thất bại!");
    } finally {
      setLoading(false);
    }
  };

  if (!documentID) return null;
  if (loading || error)
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center flex items-center justify-center flex-col gap-2">
            <Loader />
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              "Đang tải dữ liệu..."
            )}
          </div>
        </div>
      </div>
    );
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        {documentData && !loading && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa tài liệu</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Tiêu đề
              </label>
              <input
                type="text"
                name="title"
                value={documentData.title}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Mô tả
              </label>
              <textarea
                name="description"
                value={documentData.description || ""}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={documentData.is_public}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Công khai
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditModal;
