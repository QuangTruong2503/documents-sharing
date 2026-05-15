import React, { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faLock, faTrash } from "@fortawesome/free-solid-svg-icons";
import collectionsApi from "../../api/collectionsApi.js";
import PageTitle from "../../Component/PageTitle.js";
import Loader from "../../Component/Loaders/Loader.js";
import { formatDateToVN } from "../../Helpers/formatDateToVN";

interface CollectionDocument {
  document_id: number;
  added_at: string;
  title: string;
  description: string;
  thumbnail_url: string;
  uploaded_at: string;
  is_public: boolean;
  owner_name: string;
}

interface CollectionDetailData {
  collection_id: number;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  document_count: number;
  documents: CollectionDocument[];
}

const CollectionDetail: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [collection, setCollection] = useState<CollectionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) {
        setError("Không tìm thấy bộ sưu tập.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await collectionsApi.getCollectionDetail(collectionId);
        setCollection(response.data);
      } catch (err: any) {
        console.error("Lỗi khi tải chi tiết bộ sưu tập:", err);
        setError(err?.response?.data?.message || "Không thể tải bộ sưu tập.");
      } finally {
        setLoading(false);
      }
    };

    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchCollection();
  }, [collectionId]);

  const handleRemoveDocument = async (documentId: number) => {
    if (!collectionId) return;

    setRemovingId(documentId);
    try {
      const response = await collectionsApi.removeDocumentFromCollection(collectionId, documentId);
      toast.success(response.data?.message || "Đã xóa tài liệu khỏi bộ sưu tập.");
      setCollection((prev) => {
        if (!prev) return prev;

        const documents = prev.documents.filter((doc) => doc.document_id !== documentId);
        return {
          ...prev,
          documents,
          document_count: Math.max(0, prev.document_count - 1),
        };
      });
    } catch (err: any) {
      console.error("Lỗi khi xóa tài liệu khỏi bộ sưu tập:", err);
      toast.error(err?.response?.data?.message || "Xóa tài liệu thất bại.");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader />
        <p className="text-sm text-ink-secondary">Đang tải bộ sưu tập...</p>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="surface-card mx-auto max-w-xl p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Không thể mở bộ sưu tập</h1>
        <p className="mt-2 text-sm text-ink-secondary">{error}</p>
        <NavLink to="/my-collections" className="btn-primary mt-6">
          Quay lại
        </NavLink>
      </div>
    );
  }

  return (
    <>
      <PageTitle title={collection.name} description={collection.description} />
      <div className="mx-auto max-w-6xl">
        <NavLink
          to="/my-collections"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-secondary transition hover:text-primary"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Bộ sưu tập của tôi
        </NavLink>

        <section className="mb-6 border-b border-line pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-ink">{collection.name}</h1>
                <span className="rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-secondary">
                  {collection.is_public ? "Công khai" : "Riêng tư"}
                </span>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-ink-secondary">
                {collection.description || "Bộ sưu tập này chưa có mô tả."}
              </p>
            </div>
            <div className="text-sm text-ink-secondary md:text-right">
              <p>{collection.document_count} tài liệu</p>
              <p>Tạo ngày {formatDateToVN(collection.created_at)}</p>
            </div>
          </div>
        </section>

        {collection.documents.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <FontAwesomeIcon icon={faLock} className="text-3xl text-neutral" />
            <h2 className="mt-4 text-lg font-bold text-ink">Chưa có tài liệu</h2>
            <p className="mt-2 text-sm text-ink-secondary">
              Hãy mở một tài liệu và bấm Save để lưu vào bộ sưu tập này.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collection.documents.map((document) => (
              <article key={document.document_id} className="surface-card surface-card-hover overflow-hidden">
                <NavLink to={`/document/${document.document_id}`} className="block">
                  <div className="flex h-48 justify-center overflow-hidden bg-canvas">
                    <img
                      src={document.thumbnail_url}
                      alt={document.title}
                      className="h-full w-3/4 border border-line object-fill transition duration-300 hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                </NavLink>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <NavLink
                        to={`/document/${document.document_id}`}
                        className="line-clamp-2 text-base font-bold leading-6 text-ink hover:text-primary"
                      >
                        {document.title}
                      </NavLink>
                      <p className="mt-2 line-clamp-2 text-sm text-ink-secondary">
                        {document.description || "Không có mô tả."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(document.document_id)}
                      disabled={removingId === document.document_id}
                      className="rounded-md p-2 text-neutral transition hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-50"
                      title="Xóa khỏi bộ sưu tập"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-ink-secondary">
                    <span>{document.owner_name}</span>
                    <span>Đã lưu {formatDateToVN(document.added_at)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default CollectionDetail;
