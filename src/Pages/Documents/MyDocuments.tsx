import React, { useEffect, useState } from "react";
import documentsApi from "../../api/documentsApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { Dropdown } from "flowbite-react";
import DeleteModal from "../../Component/Modal/DeleteModal";
import Pagination from "../../Component/Pagination/Pagination.tsx"; // Import component Pagination
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

interface Document {
  document_id: number;
  title: string;
  description: string | null;
  thumbnail_url: string;
  like_count: number;
  uploaded_at: string;
  is_public: boolean;
}

interface PaginationData {
  currentPage: number;
  totalCount: number;
  totalPages: number;
}

const MyDocuments: React.FC = () => {
  const { page } = useParams<{ page: string }>(); // Lấy tham số page từ URL
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadData, setReloadData] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [deleteID, setDeleteID] = useState<number | null >(null)
  const handleClose = () => {
    setOpenModal(false);
  };

  const handleDelete = async () => {
    setOpenModal(false); // Đóng modal trước khi thực hiện xóa
    
    // Sử dụng toast.promise để xử lý Promise
    toast.promise(
      documentsApi.deleteDocumentByID(deleteID), // Truyền Promise từ API
      {
        pending: "Đang xóa tài liệu...", // Thông báo khi đang xử lý
        success: {
          render({ data }) {
            // Khi thành công, kiểm tra response và trả về thông báo
            if (data.data.success) {
              setReloadData(!reloadData); // Cập nhật lại dữ liệu
              return data.data.message; // Hiển thị thông báo từ API
            }
            return "Xóa tài liệu thành công!";
          },
        },
        error: {
          render({ data }) {
            // Khi thất bại, hiển thị thông báo lỗi
            return  "Xóa tài liệu thất bại!";
          },
        },
      },
      {
        position: "top-right", // Vị trí thông báo
        autoClose: 3000, // Tự động đóng sau 3 giây
      }
    ).catch((err) => {
      // Xử lý lỗi ngoài Promise nếu cần
      setError("Failed to delete document");
    });
  };

  const fetchDocuments = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await documentsApi.getMyUploadedDocument(pageNum);
      setDocuments(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pageNum = page ? parseInt(page, 10) : 1; // Nếu không có page, mặc định là 1
    if (!isNaN(pageNum)) {
      fetchDocuments(pageNum);
    } else {
      navigate("/my-documents"); // Nếu page không hợp lệ, chuyển về trang mặc định
    }
  }, [page, navigate, reloadData]);

  const handlePageChange = (newPage: number) => {
    // Điều hướng đến URL mới dựa trên số trang
    if (newPage === 1) {
      navigate("/my-documents");
    } else {
      navigate(`/my-documents/page/${newPage}`);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">
        Tài Liệu Bạn Đã Tải Lên
      </h2>
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className="bg-white shadow-lg rounded-lg overflow-hidden transition-all hover:shadow-gray-400 duration-200 ease-in relative"
            >
              <img
                src={doc.thumbnail_url}
                alt={doc.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 relative">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg truncate hover:text-blue-500 transition-all duration-300">
                    {doc.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {doc.description ? doc.description : "Không có mô tả..."}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
                <div className="flex justify-between gap-2 items-center mt-3 relative">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-md ${
                      doc.is_public
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {doc.is_public ? "Public" : "Private"}
                  </span>
                  <Dropdown
                    label={<FontAwesomeIcon icon={faGear} />}
                    inline
                    className="w-44 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
                    arrowIcon={false}
                    placement="bottom-end"
                  >
                    <Dropdown.Item>
                      <span className="block w-full text-left text-sm text-gray-700">
                        Chỉnh sửa
                      </span>
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      setOpenModal(true)
                      setDeleteID(doc.document_id)
                    }}>
                      <span className="block w-full text-left text-sm text-gray-700">
                        Xóa
                      </span>
                    </Dropdown.Item>
                  </Dropdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No documents uploaded yet.</p>
      )}
      {documents.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          onPageChange={handlePageChange}
        />
      )}
      {openModal && (
        <DeleteModal onClose={handleClose} onAction={handleDelete} />
      )}
    </div>
  );
};

export default MyDocuments;