import React, { useEffect, useRef, useState, useCallback } from "react";
import documentsApi from "../../../api/documentsApi";
import tagsAPI from "../../../api/tagsAPI";
import { toast } from "react-toastify";
import { NavLink } from "react-router-dom";
import categoriesAPI from "../../../api/categoriesAPI";
import CategorySelector from "../../../Component/Categories/CategoriesSelector.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEye,
  faFileLines,
  faLock,
  faTag,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

interface DocumentUpload {
  document_id: number;
  title: string;
  description: string;
  is_public: boolean;
  tags: Tag[];
  categories: string[];
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
  category_id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  children: Category[];
}

interface Tag {
  name: string;
}

const MAX_CATEGORIES = 3;

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
    tags: [],
    categories: [],
  });
  const [updateResponse, setUpdateResponse] = useState<UpdateResponse | null>(
    null
  );
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const debouncedTagSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestedTags([]);
        return;
      }
      try {
        const response = await tagsAPI.getBySearch(query);
        setSuggestedTags(
          response.data.filter(
            (tag: Tag) => !documentForm.tags.some((t) => t.name === tag.name)
          )
        );
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    },
    [documentForm.tags]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setDocumentForm((prev) => ({
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
    if (
      !trimmedTag ||
      documentForm.tags.some((t) => t.name === trimmedTag)
    )
      return;

    setDocumentForm((prev) => ({
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
    setDocumentForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.name !== tagName),
    }));
  };
  //chọn category (Tree)
  const toggleCategory = (categoryId: string) => {
    setDocumentForm((prev) => {
      const exists = prev.categories.includes(categoryId);

      if (!exists && prev.categories.length >= MAX_CATEGORIES) {
        toast.warning(`Chỉ được chọn tối đa ${MAX_CATEGORIES} danh mục`);
        return prev;
      }

      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((id) => id !== categoryId)
          : [...prev.categories, categoryId],
      };
    });
  };
  const getCategoryName = (id: string) => {
    const find = (nodes: Category[]): Category | undefined => {
      for (const node of nodes) {
        if (node.category_id === id) return node;
        const found = node.children && find(node.children);
        if (found) return found;
      }
    };
    return find(categories)?.name || id;
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
        const response = await documentsApi.deleteDocumentByID(
          document.document_id
        );
        const data: UpdateResponse = response.data;
        if (data.success) {
          toast.success("Tài liệu đã được xóa thành công");
          window.location.reload();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa tài liệu");
      }
    }
  };
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);
  //Lấy Categories từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategoryTree();
        setCategories(response.data);
        console.log("Fetched categories:", response.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const shareUrl = `${window.location.origin}/document/${updateResponse?.document_id || document.document_id}`;

  return (
    <div className="surface-card w-full p-4 md:p-6">
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-success/20 bg-success/10 p-4 text-success">
        <FontAwesomeIcon icon={faCheck} className="mt-0.5" />
        <div>
          <h2 className="font-bold">Tải lên thành công</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Hoàn tất thông tin bên dưới để tài liệu sẵn sàng hiển thị.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-lg border border-line bg-canvas">
          <img
            src={document.thumbnail_url}
            alt={document.title}
              className="h-auto w-full object-fill"
          />
            <span className="absolute right-2 top-2 rounded-md bg-ink px-2 py-1 text-xs font-semibold text-white">
              Preview
          </span>
        </div>
          <div className="mt-4 rounded-lg border border-line bg-canvas p-4 text-sm text-ink-secondary">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <FontAwesomeIcon icon={faFileLines} className="text-primary" />
              Bản nháp tài liệu
            </p>
            <p className="mt-2">
              Tài liệu đã được upload. Bạn có thể xóa nếu chọn nhầm file.
            </p>
          </div>
        </div>

        <div>
          {!updateResponse?.success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-ink">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  name="title"
                  value={documentForm.title}
                  onChange={handleInputChange}
                  required
                  className="input-field mt-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={documentForm.description}
                  onChange={handleInputChange}
                  className="input-field mt-2 min-h-28"
                  placeholder="Tóm tắt nội dung, đối tượng phù hợp hoặc điểm nổi bật của tài liệu..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <FontAwesomeIcon icon={faTag} className="text-primary" />
                  Tags
                  <span className="text-xs font-medium text-ink-secondary">
                    thêm tag để dễ tìm kiếm
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Nhập tag..."
                    className="input-field mt-2"
                  />
                  {suggestedTags.length > 0 && (
                    <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-line bg-surface shadow-card">
                      {suggestedTags.map((tag) => (
                        <li
                          key={tag.name}
                          onClick={() => addTag(tag.name)}
                          className="cursor-pointer px-4 py-2 text-sm text-ink-secondary hover:bg-canvas hover:text-primary"
                        >
                          {tag.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {documentForm.tags.map((tag) => (
                    <span
                      key={tag.name}
                      className="inline-flex items-center rounded-md bg-primary-soft px-2 py-1 text-sm font-medium text-primary"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.name)}
                        className="ml-2 text-primary hover:text-danger"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              {/* Category Selector */}
              <div className="rounded-lg border border-line bg-canvas p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      Phân loại tài liệu
                    </h3>
                    <p className="text-xs text-ink-secondary">
                      Chọn danh mục phù hợp để người khác dễ tìm
                    </p>
                  </div>

                  {documentForm.categories.length > 0 && (
                    <span className="text-xs font-medium text-primary">
                      Đã chọn {documentForm.categories.length}
                    </span>
                  )}
                </div>

                <CategorySelector
                  categories={categories}
                  selected={documentForm.categories}
                  onToggle={toggleCategory}
                />
              </div>
              {/* Selected Categories */}
              {documentForm.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {documentForm.categories.map((id) => (
                    <span
                      key={id}
                      className="flex items-center gap-1 rounded-md bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
                    >
                      {getCategoryName(id)}
                      <button
                      type="button"
                        onClick={() => toggleCategory(id)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <label className="flex items-center rounded-lg border border-line bg-canvas p-4">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={!documentForm.is_public}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                />
                <span className="ml-3 text-sm font-medium text-ink">
                  <FontAwesomeIcon icon={faLock} className="mr-2 text-ink-secondary" />
                  Đặt tài liệu ở chế độ riêng tư
                </span>
              </label>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="btn-secondary border-danger text-danger hover:border-danger hover:text-danger"
                  onClick={handleDelete}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Xóa
                </button>
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={documentForm.categories.length === 0}
                  className={`inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    documentForm.categories.length === 0
                      ? "cursor-not-allowed bg-line text-neutral"
                      : "bg-primary text-white hover:-translate-y-px hover:bg-primary-hover hover:shadow-glow"
                  }`}
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Hoàn tất
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-lg border border-line bg-canvas p-6">
              <h3 className="text-lg font-bold text-ink">Tài liệu đã sẵn sàng</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Mở tài liệu để kiểm tra trang hiển thị hoặc chia sẻ đường dẫn bên dưới.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="input-field mt-4 flex-1 bg-surface"
                />
                <NavLink
                  to={`/document/${updateResponse.document_id}`}
                  className="btn-primary mt-4"
                >
                  <FontAwesomeIcon icon={faEye} className="mr-2" />
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
