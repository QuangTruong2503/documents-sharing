import React, { useEffect, useState } from "react";
import documentsApi from "../../../api/documentsApi.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { Dropdown } from "flowbite-react";
import DeleteModal from "../../../Component/Modal/DeleteModal.js";
import Pagination from "../../../Component/Pagination/Pagination.tsx"; // Import Pagination component
import { NavLink, useSearchParams } from "react-router-dom"; // Sử dụng useSearchParams
import { toast } from "react-toastify";
import Loader from "../../../Component/Loaders/Loader.js";
import ModalInfor from "../../../Component/Modal/ModalInfor.tsx";

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
  const [searchParams, setSearchParams] = useSearchParams(); // Lấy và cập nhật tham số trên URL
  const page = parseInt(searchParams.get("page") || "1", 10); // Lấy page từ URL, mặc định 1
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [deleteID, setDeleteID] = useState<number | null>(null);

  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [detailID, setDetailID] = useState<number | null>(null)
  const handleClose = () => {
    setOpenModal(false);
  };

  const handleDelete = async () => {
    setOpenModal(false);
    
    toast.promise(
      documentsApi.deleteDocumentByID(deleteID),
      {
        pending: "Đang xóa tài liệu...",
        success: {
          render({ data }) {
            if (data.data.success) {
              setDocuments(documents.filter((doc) => doc.document_id !== deleteID));  // Xóa tài liệu khỏi state
              return data.data.message;
            }
            return "Xóa tài liệu thành công!";
          },
        },
        error: "Xóa tài liệu thất bại!",
      },
      {
        position: "top-right",
        autoClose: 3000,
      }
    ).catch(() => {
      setError("Failed to delete document");
    });
  };

  const fetchDocuments = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await documentsApi.getMyUploadedDocument(pageNum);
      setDocuments(response.data?.data || []);
      setPagination(response.data?.pagination || { currentPage: 1, totalCount: 0, totalPages: 1 });
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(page)) {
      fetchDocuments(page);
    } else {
      setSearchParams({ page: "1" }); // Nếu page không hợp lệ, đặt lại về 1
    }
    window.scroll({
      top: 0,
      behavior: "smooth",
    }); //Cuộn trang lên đầu
  }, [page, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() }); // Cập nhật URL khi đổi trang
  };

  if (loading) return <div className="flex justify-center"><Loader /></div>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">
        Tài Liệu Đã Tải Lên
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
                  <NavLink
                    to={`/document/${doc.document_id}`}
                    className="font-semibold text-lg truncate hover:text-blue-500 transition-all duration-300"
                  >
                    {doc.title}
                  </NavLink>
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
                    placement="auto"
                  >
                    <Dropdown.Item onClick={() =>{
                      setOpenDetailModal(true);
                      setDetailID(doc.document_id)
                    }}>
                      <span className="block w-full text-left text-sm text-gray-700 hover:text-yellow-500">
                        Thông tin
                      </span>
                    </Dropdown.Item>
                    <Dropdown.Item>
                      <span className="block w-full text-left text-sm text-gray-700 hover:text-green-500">
                        Chỉnh sửa
                      </span>
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => {
                        setOpenModal(true);
                        setDeleteID(doc.document_id);
                      }}
                    >
                      <span className="block w-full text-left text-sm text-gray-700 hover:text-red-500">
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
        <div className="text-center text-gray-500 text-lg">
          <p>Hiện tại bạn chưa có tài liệu nào.</p>
          <NavLink to="/upload-document" className="text-blue-500 hover:underline">
            Tải lên ngay bây giờ!
          </NavLink>
        </div>
      )}
      {documents.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          onPageChange={handlePageChange} // Cập nhật trang bằng useSearchParams
        />
      )}
      {openModal && (
        <DeleteModal onClose={handleClose} onAction={handleDelete} />
      )}
      {openDetailModal && (
        <ModalInfor documentID={detailID} onClose={() => {
          setOpenDetailModal(false)
          setDetailID(null)
        }}/>
      )}
    </div>
  );
};

export default MyDocuments;
