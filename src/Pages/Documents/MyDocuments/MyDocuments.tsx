import React, { useEffect, useState } from "react";
import documentsApi from "../../../api/documentsApi.js";
import { useSearchParams, NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../../../Component/Loaders/Loader.js";
import DeleteModal from "../../../Component/Modal/DeleteModal.js";
import ModalInfor from "../../../Component/Modal/ModalDocumentInfor.tsx";
import Pagination from "../../../Component/Pagination/Pagination.tsx";
import DocumentList from "../../../Component/Documents/DocumentEdit/DocumentList.tsx";
import ActionButtons from "../../../Component/Documents/DocumentEdit/ActionButtons.tsx";
import EditModal from "../../../Component/Modal/EditDocumentModal.tsx"; // Adjust path as needed
import PageTitle from "../../../Component/PageTitle.js";

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
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editID, setEditID] = useState<number | null>(null);

  // Filter states
  const [sortBy, setSortBy] = useState<string>("date");
  const [isPublic, setIsPublic] = useState<boolean | null>(null);

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
                setDocuments(
                  documents.filter((doc) => doc.document_id !== deleteID)
                );
                return data.data.message;
              }
              return "Xóa tài liệu thành công!";
            },
          },
          error: "Xóa tài liệu thất bại!",
        },
        { autoClose: 3000 }
      )
      .catch(() => console.error("Failed to delete document"));
  };
  const handleDocumentUpdate = (updatedDoc: Document) => {
    setDocuments(
      documents.map((doc) =>
        doc.document_id === updatedDoc.document_id ? updatedDoc : doc
      )
    );
  };

  useEffect(() => {
    window.scroll({ top: 0, behavior: "smooth" });
    const fetchDocuments = async (pageNum: number) => {
      try {
        setLoading(true);
        const params = {
          pageNumber: pageNum,
          sortBy,
          ...(isPublic !== null && { isPublic }),
        };
        const response = await documentsApi.getMyUploadedDocument(params);
        setDocuments(response.data?.data || []);
        setPagination(
          response.data?.pagination || {
            currentPage: 1,
            totalCount: 0,
            totalPages: 1,
          }
        );
      } catch (err) {
        setError("Tải dữ liệu thất bại!");
      } finally {
        setLoading(false);
      }
    };
    if (!isNaN(page)) {
      fetchDocuments(page);
    } else {
      setSearchParams({ page: "1" });
    }
  }, [page, sortBy, isPublic, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  if (loading || error)
    return (
      <div className="text-center flex items-center justify-center flex-col gap-2">
        <Loader />
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          "Đang tải dữ liệu..."
        )}
      </div>
    );

  const renderActionButtons = (doc: Document) => (
    <ActionButtons
      onInfo={() => {
        setOpenDetailModal(true);
        setDetailID(doc.document_id);
      }}
      onEdit={() => {
        setOpenEditModal(true);
        setEditID(doc.document_id);
      }}
      onDelete={() => {
        setOpenModal(true);
        setDeleteID(doc.document_id);
      }}
    />
  );

  return (
    <>
      <PageTitle
        title="Tài liệu của bạn"
        description="Danh sách tài liệu bạn đã tải lên"
      />
      <div className="md:container mx-auto py-6">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Tài Liệu Đã Tải Lên
        </h2>

        {/* Filter Controls */}
        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="date">Ngày tải lên</option>
            <option value="title">Tiêu đề</option>
            <option value="downloads">Lượt tải</option>
          </select>

          <select
            value={isPublic === null ? "all" : isPublic.toString()}
            onChange={(e) => {
              const value = e.target.value;
              setIsPublic(value === "all" ? null : value === "true");
            }}
            className="p-2 border rounded"
          >
            <option value="all">Tất cả</option>
            <option value="true">Công khai</option>
            <option value="false">Riêng tư</option>
          </select>
        </div>

        {documents.length > 0 ? (
          <>
            <DocumentList
              documents={documents}
              actionButtons={renderActionButtons}
            />
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center text-gray-500 text-lg">
            <p>Hiện tại không có tài liệu ở trang này.</p>
            {page === 1 && (
              <NavLink
                to="/upload-document"
                className="text-blue-500 hover:underline"
              >
                Tải lên ngay bây giờ!
              </NavLink>
            )}
          </div>
        )}
        {openModal && (
          <DeleteModal onClose={handleClose} onAction={handleDelete} />
        )}
        {openDetailModal && (
          <ModalInfor
            documentID={detailID}
            onClose={() => {
              setOpenDetailModal(false);
              setDetailID(null);
            }}
          />
        )}
        {openEditModal && (
          <EditModal
            documentID={editID}
            onClose={() => {
              setOpenEditModal(false);
              setEditID(null);
            }}
            onUpdate={handleDocumentUpdate}
          />
        )}
      </div>
    </>
  );
};

export default MyDocuments;
