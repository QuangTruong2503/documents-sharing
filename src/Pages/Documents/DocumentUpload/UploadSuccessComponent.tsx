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
  const [documentForm, setDocumentForm] = useState<DocumentUpload>({
    document_id: document.document_id,
    title: document.title || "",
    description: "",
    is_public: true,
    tags: [],
  });
  const [updateResponse, setUpdateResponse] = useState<UpdateResponse | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedTagSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestedTags([]);
      return;
    }
    try {
      const response = await tagsAPI.getBySearch(query);
      setSuggestedTags(response.data.filter((tag: Tag) => 
        !documentForm.tags.some(t => t.name === tag.name)
      ));
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  }, [documentForm.tags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setDocumentForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? !checked : value,
    }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setTagInput(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => debouncedTagSearch(query), 300);
  };

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim();
    if (!trimmedTag || documentForm.tags.length >= MAX_TAGS || 
        documentForm.tags.some(t => t.name === trimmedTag)) return;

    setDocumentForm(prev => ({
      ...prev,
      tags: [...prev.tags, { name: trimmedTag }],
    }));
    setTagInput("");
    setSuggestedTags([]);
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const removeTag = (tagName: string) => {
    setDocumentForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.name !== tagName),
    }));
  };
  //Cập nhật thông tin tài liệu sau khi upload thành công
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentForm.title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }

    try {
      const response = await documentsApi.putDocumentUpdateTitle(documentForm);
      const data: UpdateResponse = response.data;
      if (data.success) {
        toast.success("Cập nhật thành công");
        setUpdateResponse(data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật tài liệu");
    }
  };
  //Hàm xóa tài liệu
  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      try {
        const response = await documentsApi.deleteDocumentByID(document.document_id);
        const data: UpdateResponse = response.data;
        if (data.success) {
          toast.success("Tài liệu đã được xóa thành công");
          window.location.reload();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa tài liệu");
      }
    }
  }
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);
  useEffect(() => {
    console.log(document);
  }, [document]);

  const shareUrl = `${window.location.origin}/document/${updateResponse?.document_id || document.document_id}`;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <img
            src={document.thumbnail_url}
            alt={document.title}
            className="w-full h-fit object-fill border border-gray-300"
          />
          <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
            PDF
          </span>
        </div>

        <div className="md:col-span-2">
          {!updateResponse?.success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                <input
                  type="text"
                  name="title"
                  value={documentForm.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  name="description"
                  rows={3}
                  value={documentForm.description}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Thêm mô tả..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tags (tối đa {MAX_TAGS})
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Nhập tag..."
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {suggestedTags.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                      {suggestedTags.map(tag => (
                        <li
                          key={tag.name}
                          onClick={() => addTag(tag.name)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {tag.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {documentForm.tags.map(tag => (
                    <span
                      key={tag.name}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.name)}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={!documentForm.is_public}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Tài liệu riêng tư</label>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={handleDelete}
                >
                  Xóa
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Hoàn tất
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Chia sẻ tài liệu</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <NavLink
                  to={`/document/${updateResponse.document_id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Xem
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadSuccessComponent;