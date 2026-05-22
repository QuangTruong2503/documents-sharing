import React, { useEffect, useState } from "react";
import documentsApi from "api/documentsApi.js";
import { useSearchParams, NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import DeleteModal from "components/Modal/DeleteModal.js";
import ModalInfor from "components/Modal/ModalDocumentInfor.tsx";
import Pagination from "components/Pagination/Pagination.tsx";
import DocumentList from "components/Documents/DocumentEdit/DocumentList.tsx";
import ActionButtons from "components/Documents/DocumentEdit/ActionButtons.tsx";
import EditModal from "components/Modal/EditDocumentModal.tsx"; // Adjust path as needed
import PageTitle from "components/PageTitle.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RefreshCw } from "lucide-react";
import {
  faArrowUpAZ,
  faCloudArrowUp,
  faFileLines,
  faFilter,
  faGlobe,
  faHeart,
  faLock,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

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

  const publicCount = documents.filter((doc) => doc.is_public).length;
  const privateCount = documents.length - publicCount;
  const totalLikes = documents.reduce((total, doc) => total + (doc.like_count || 0), 0);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-ink-secondary">Đang tải tài liệu của bạn...</p>
      </div>
    );

  if (error)
    return (
      <div className="surface-card mx-auto max-w-lg p-8 text-center">
        <FontAwesomeIcon icon={faRotateRight} className="text-3xl text-danger" />
        <h1 className="mt-4 text-xl font-bold text-ink">Tải dữ liệu thất bại</h1>
        <p className="mt-2 text-sm text-ink-secondary">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary mt-6"
        >
          Thử lại
        </button>
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
      <div className="mx-auto max-w-6xl py-6">
        <section className="mb-6 flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-primary">Thư viện cá nhân</p>
            <h1 className="text-3xl font-bold text-ink">Tài liệu đã tải lên</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Theo dõi trạng thái, chỉnh sửa thông tin và quản lý các tài liệu bạn đã chia sẻ.
            </p>
          </div>
          <NavLink to="/upload-document" className="btn-primary w-full sm:w-auto">
            <FontAwesomeIcon icon={faCloudArrowUp} className="mr-2" />
            Tải tài liệu mới
          </NavLink>
        </section>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="surface-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-secondary">Tổng tài liệu</span>
              <FontAwesomeIcon icon={faFileLines} className="text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold text-ink">{pagination.totalCount}</p>
          </div>
          <div className="surface-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-secondary">Trang này</span>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faGlobe} className="text-success" />
                <FontAwesomeIcon icon={faLock} className="text-danger" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-ink">
              {publicCount} / {privateCount}
            </p>
            <p className="mt-1 text-xs text-ink-secondary">Công khai / riêng tư</p>
          </div>
          <div className="surface-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-secondary">Lượt thích</span>
              <FontAwesomeIcon icon={faHeart} className="text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold text-ink">{totalLikes}</p>
            <p className="mt-1 text-xs text-ink-secondary">Tính trên tài liệu đang hiển thị</p>
          </div>
        </div>

        <div className="surface-card mb-5 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FontAwesomeIcon icon={faFilter} className="text-primary" />
              Bộ lọc hiển thị
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-ink-secondary">
                  <FontAwesomeIcon icon={faArrowUpAZ} />
                  Sắp xếp
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field"
                >
                  <option value="date">Ngày tải lên</option>
                  <option value="title">Tiêu đề</option>
                  <option value="downloads">Lượt tải</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-ink-secondary">
                  <FontAwesomeIcon icon={faGlobe} />
                  Trạng thái
                </span>
                <select
                  value={isPublic === null ? "all" : isPublic.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIsPublic(value === "all" ? null : value === "true");
                  }}
                  className="input-field"
                >
                  <option value="all">Tất cả</option>
                  <option value="true">Công khai</option>
                  <option value="false">Riêng tư</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {documents.length > 0 ? (
          <section>
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
          </section>
        ) : (
          <div className="surface-card mx-auto max-w-xl p-10 text-center">
            <FontAwesomeIcon icon={faFileLines} className="text-4xl text-neutral" />
            <h2 className="mt-4 text-xl font-bold text-ink">Chưa có tài liệu phù hợp</h2>
            <p className="mt-2 text-sm text-ink-secondary">
              Hiện tại không có tài liệu ở trang này hoặc bộ lọc đang quá hẹp.
            </p>
            {page === 1 && (
              <NavLink
                to="/upload-document"
                className="btn-primary mt-6"
              >
                Tải lên tài liệu đầu tiên
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
