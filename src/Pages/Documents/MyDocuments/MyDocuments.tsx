import React, { useEffect, useState } from "react";
import documentsApi from "../../../api/documentsApi.js";
import { useSearchParams, NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../../../Component/Loaders/Loader.js";
import DeleteModal from "../../../Component/Modal/DeleteModal.js";
import ModalInfor from "../../../Component/Modal/ModalInfor.tsx";
import Pagination from "../../../Component/Pagination/Pagination.tsx";
import DocumentList from "../../../Component/Documents/DocumentEdit/DocumentList.tsx";
import ActionButtons from "../../../Component/Documents/DocumentEdit/ActionButtons.tsx";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
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
  const [detailID, setDetailID] = useState<number | null>(null);

  const handleClose = () => setOpenModal(false);

  const handleDelete = async () => {
    setOpenModal(false);
    toast
      .promise(
        documentsApi.deleteDocumentByID(deleteID),
        {
          pending: "Đang xóa tài liệu...",
          success: {
            render({ data }) {
              if (data.data.success) {
                setDocuments(documents.filter((doc) => doc.document_id !== deleteID));
                return data.data.message;
              }
              return "Xóa tài liệu thành công!";
            },
          },
          error: "Xóa tài liệu thất bại!",
        },
        { position: "top-right", autoClose: 3000 }
      )
      .catch(() => setError("Failed to delete document"));
  };

  const fetchDocuments = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await documentsApi.getMyUploadedDocument(pageNum);
      setDocuments(response.data?.data || []);
      setPagination(
        response.data?.pagination || { currentPage: 1, totalCount: 0, totalPages: 1 }
      );
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scroll({ top: 0, behavior: "smooth" }); //Cuộn lên đầu trang
    if (!isNaN(page)) {
      fetchDocuments(page);
    } else {
      setSearchParams({ page: "1" });
    }
  }, [page, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  if (loading) return <div className="flex justify-center"><Loader /></div>;
  if (error) return <p className="text-red-500">{error}</p>;

  const renderActionButtons = (doc: Document) => (
    <ActionButtons
      onInfo={() => {
        setOpenDetailModal(true);
        setDetailID(doc.document_id);
      }}
      onEdit={() => console.log("Edit document", doc.document_id)} // Thay bằng logic chỉnh sửa
      onDelete={() => {
        setOpenModal(true);
        setDeleteID(doc.document_id);
      }}
    />
  );

  return (
    <div className="md:container mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6 text-center">Tài Liệu Đã Tải Lên</h2>
      {documents.length > 0 ? (
        <>
          <DocumentList documents={documents} actionButtons={renderActionButtons} />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center text-gray-500 text-lg">
          <p>Hiện tại bạn chưa có tài liệu nào.</p>
          <NavLink to="/upload-document" className="text-blue-500 hover:underline">
            Tải lên ngay bây giờ!
          </NavLink>
        </div>
      )}
      {openModal && <DeleteModal onClose={handleClose} onAction={handleDelete} />}
      {openDetailModal && (
        <ModalInfor
          documentID={detailID}
          onClose={() => {
            setOpenDetailModal(false);
            setDetailID(null);
          }}
        />
      )}
    </div>
  );
};

export default MyDocuments;