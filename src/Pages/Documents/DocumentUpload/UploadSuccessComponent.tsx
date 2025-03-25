import React, { useEffect, useRef, useState, useCallback } from "react";
import documentsApi from "../../../api/documentsApi";
import tagsAPI from "../../../api/tagsAPI";
import { toast } from "react-toastify";
import { NavLink } from "react-router-dom";

interface DocumentUpload {
  document_id: number;
  title: string;
  description: string;
  is_public: boolean;
  tags: Tag[];
}

interface DocumentResponse {
  message: string;
  success: boolean;
  document_id: number;
  title: string;
  thumbnail_url: string;
}

interface UpdateResponse {
  message: string;
  success: boolean;
  document_id: number;
}

interface Tag {
  name: string;
}

const MAX_TAGS = 3;

const UploadSuccessComponent = ({ document }: { document: DocumentResponse }) => {
  const [documentForm, setDocumentForm] = useState<DocumentUpload>(() => ({
    document_id: document.document_id,
    title: document.title || "",
    description: "",
    is_public: true,
    tags: [],
  }));
  
  const [updateResponse, setUpdateResponse] = useState<UpdateResponse>({
    message: "",
    success: false,
    document_id: 0,
  });
  
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize handlers để tránh tạo lại functions không cần thiết
  const debouncedTagSearch = useCallback(async (query: string) => {
    try {
      const response = await tagsAPI.getBySearch(query);
      setSuggestedTags(response.data);
      setIsDropdownOpen(true);
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type, checked } = e.target as HTMLInputElement;
      setDocumentForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? !checked : value,
      }));
    },
    []
  );

  const handleTagInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setTagInput(query);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (!query.trim()) {
        setSuggestedTags([]);
        setIsDropdownOpen(false);
        return;
      }

      searchTimeoutRef.current = setTimeout(() => debouncedTagSearch(query), 300);
    },
    [debouncedTagSearch]
  );

  const addTag = useCallback((tagName: string) => {
    const trimmedTag = tagName.trim();
    if (!trimmedTag) return;

    setDocumentForm((prev) => {
      const currentTags = prev.tags || [];
      if (currentTags.length >= MAX_TAGS) {
        toast.warning(`Tối đa chỉ được thêm ${MAX_TAGS} tags!`);
        return prev;
      }
      if (currentTags.some(tag => tag.name === trimmedTag)) return prev;

      return {
        ...prev,
        tags: [...currentTags, { name: trimmedTag }],
      };
    });
    setTagInput("");
    setIsDropdownOpen(false);
  }, []);

  const handleTagKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && tagInput.trim()) {
        e.preventDefault();
        addTag(tagInput);
      }
    },
    [tagInput, addTag]
  );

  const handleTagRemove = useCallback((tagToRemove: string) => {
    setDocumentForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.name !== tagToRemove),
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentForm.title.trim()) {
      toast.error("Tiêu đề không được để trống!");
      return;
    }

    try {
      const response = await documentsApi.putDocumentUpdateTitle(documentForm);
      const data: UpdateResponse = response.data;
      if (data.success) {
        toast.success(data.message);
        setUpdateResponse(data);
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Có lỗi xảy ra khi cập nhật!");
    }
  }, [documentForm]);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    console.log("documentForm changed:", documentForm);
  }, [documentForm]);

  const shareUrl = `${window.location.origin}/document/${updateResponse.document_id}`;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-md shadow-md">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full h-fit md:w-1/3 relative border">
          <img
            src={document.thumbnail_url}
            alt={`${document.title} thumbnail`}
            className="w-fit h-fit object-fill rounded"
            loading="lazy"
          />
          <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
            PDF
          </span>
        </div>

        {!updateResponse.success ? (
          <form onSubmit={handleSubmit} className="flex-grow space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
              <input
                type="text"
                name="title"
                value={documentForm.title}
                onChange={handleInputChange}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                name="description"
                rows={4}
                value={documentForm.description}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                placeholder="Thêm mô tả vào đây..."
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">
                Tags <small className="text-gray-500">(tối đa {MAX_TAGS} tags)</small>
              </label>
              <input
                ref={inputRef}
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyPress={handleTagKeyPress}
                placeholder="Nhập tag và nhấn Enter..."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
              {isDropdownOpen && suggestedTags.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                  {suggestedTags.map((tag) => (
                    <li
                      key={tag.name}
                      onClick={() => addTag(tag.name)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {tag.name}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {documentForm.tags.map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag.name)}
                      className="ml-1 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={!documentForm.is_public}
                  onChange={handleInputChange}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Tài liệu riêng tư
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded shadow-sm hover:bg-red-700 focus:outline-none"
              >
                Xóa
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 focus:outline-none"
              >
                Hoàn tất
              </button>
            </div>
          </form>
        ) : (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700">Chia sẻ</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="mt-1 w-full md:w-4/5 px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
              <NavLink
                to={`/document/${updateResponse.document_id}`}
                className="w-fit px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 focus:outline-none"
              >
                Truy cập
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadSuccessComponent;