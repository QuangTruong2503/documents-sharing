import React, { useEffect, useRef, useState } from "react";
import documentsApi from "../../../api/documentsApi";
import { toast } from "react-toastify";
import { NavLink } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance"; // Assuming this is your axios setup

interface DocumentUpload {
  document_id: number;
  title: string;
  description: string;
  is_public: boolean;
  category_id?: number; // Add category_id to the interface
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

interface Category {
  category_id: number;
  name: string;
  description: string;
  parent_id: number | null;
}

const UploadSuccessComponent = ({
  document,
}: {
  document: DocumentResponse;
}) => {
  const [documentForm, setDocumentForm] = useState<DocumentUpload>({
    document_id: document.document_id,
    title: document.title || "",
    description: "",
    is_public: true,
    category_id: 0, // Initialize category_id
  });
  const [updateResponse, setUpdateResponse] = useState<UpdateResponse>({
    message: "",
    success: false,
    document_id: 0,
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Handle input changes for the form
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target as HTMLInputElement;
    if (type === "checkbox") {
      const checked = !(event.target as HTMLInputElement).checked;
      setDocumentForm((prevForm) => ({
        ...prevForm,
        [name]: checked,
      }));
    } else {
      setDocumentForm((prevForm) => ({
        ...prevForm,
        [name]: value,
      }));
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  
    if (query.trim() === "") {
      setCategories([]);
      setIsDropdownOpen(false);
      setDocumentForm((prevForm) => ({
        ...prevForm,
        category_id: undefined,
      }));
      return;
    }
  
    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await axiosInstance.get(
          `Categories/public/search-category?search=${query}`
        );
        setCategories(response.data);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }, 600);
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    setDocumentForm((prevForm) => ({
      ...prevForm,
      category_id: category.category_id,
    }));
    setSearchQuery(category.name); // Display selected category name in input
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  const handleDelete = () => {
    console.log("Document deleted:", documentForm.document_id);
    // Logic to delete the document
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await documentsApi.putDocumentUpdateTitle(documentForm);
      const data: UpdateResponse = response.data;
      if (data.success) {
        toast.success(data.message);
        setUpdateResponse(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    console.log(documentForm);
  }, [documentForm]);

  return (
    <div className="w-full max-w-3xl bg-white p-6 rounded-md shadow-md mx-auto">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Thumbnail */}
        <div className="w-full md:w-1/3 h-auto relative border">
          <img
            src={document.thumbnail_url}
            alt="Document Thumbnail"
            className="w-full h-full object-cover rounded"
          />
          <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
            PDF
          </span>
        </div>

        {/* Form */}
        {!updateResponse.success && (
          <form className="flex-grow" onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Tiêu đề
              </label>
              <input
                type="text"
                name="title"
                value={documentForm.title}
                onChange={handleInputChange}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Mô tả
              </label>
              <textarea
                name="description"
                rows={4}
                value={documentForm.description}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                placeholder="Thêm mô tả vào đây..."
              ></textarea>
            </div>

            {/* Category Search */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700">
                Danh mục<small className="text-gray-500"> (Để trống nếu không cần thiết)</small>
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm danh mục..."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
              {isDropdownOpen && categories.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                  {categories.map((category) => (
                    <li
                      key={category.category_id}
                      onClick={() => handleCategorySelect(category)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {category.name} - {category.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Privacy Checkbox */}
            <div className="mb-4">
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

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleDelete}
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
        )}

        {/* Share */}
        {updateResponse.success && (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700">
              Chia sẻ
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                name="linkDoc"
                value={`${window.location.origin}/document/${updateResponse.document_id}`}
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