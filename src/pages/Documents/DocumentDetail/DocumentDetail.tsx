import React, { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import documentsApi from "api/documentsApi";
import collectionsApi from "api/collectionsApi";
import reportsApi from "api/reportsApi";
import DocumentSummaryByAI from "components/Chat/DocumentSummaryByAI.tsx";
import DocumentCommentsPanel from "components/Documents/DocumentCommentsPanel.tsx";
import DocumentVersionsPanel from "components/Documents/DocumentVersionsPanel.tsx";
import { checkNotSigned } from "utils/CheckSigned";
import { formatDateToVN } from "utils/formatDateToVN";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faBookmark,
  faThumbsUp,
  faThumbsDown,
  faShareAlt,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";
import PageTitle from "components/PageTitle";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import workspaceLibraryApi from "api/workspaceLibraryApi.ts";
import featureUpgradesApi from "api/featureUpgradesApi.ts";

interface DocumentData {
  document_id: number;
  user_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type?: string;
  file_size?: number;
  is_public: boolean;
  download_count: number;
  uploaded_at: string;
  full_name: string;
  like_count: number;
  dislike_count: number;
  myReaction: number | null;
  categories?: Array<string | { category_id?: string | number; name?: string; category_name?: string }>;
  parent_folder_id?: number | null;
  folder_visibility?: string | null;
  access_source?: string | null;
}

interface Collection {
  collection_id: number;
  name: string;
  description: string;
  is_public: boolean;
  documentCount: number;
}

interface ReportStatusData {
  canReport: boolean;
  blockedReason: "OWN_DOCUMENT" | "HAS_ACTIVE_REPORT" | null;
  hasActiveReport: boolean;
  activeReport?: {
    report_id: number;
    document_id: number;
    reason: string;
    status: string;
    created_at: string;
  } | null;
  latestReport?: {
    report_id: number;
    document_id: number;
    reason: string;
    status: string;
    created_at: string;
  } | null;
}

const VIEWER_RETRY_DELAY = 8000;
const MAX_VIEWER_RETRIES = 3;

const isPdfDocument = (documentData: DocumentData) => {
  const fileType = documentData.file_type?.toLowerCase() || "";
  const fileUrl = documentData.file_url.toLowerCase().split("?")[0];

  return fileType.includes("pdf") || fileUrl.endsWith(".pdf");
};

const folderVisibilityLabel: Record<string, string> = {
  private: "Thư mục riêng tư",
  shared: "Thư mục chia sẻ",
  public: "Thư mục công khai",
};

const accessSourceLabel: Record<string, string> = {
  folder: "Truy cập qua thư mục",
  public: "Tài liệu công khai",
  owner: "Tài liệu của bạn",
};

const formatFileSize = (size?: number) => {
  if (!size) return null;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const getCategoryName = (category: NonNullable<DocumentData["categories"]>[number]) => {
  if (typeof category === "string") return category;
  return category.name || category.category_name || String(category.category_id || "");
};

const reportBlockedMessages: Record<string, string> = {
  OWN_DOCUMENT: "Bạn không thể báo cáo tài liệu của chính mình.",
  HAS_ACTIVE_REPORT: "Bạn đã có báo cáo đang được xử lý cho tài liệu này.",
};

const buildGoogleViewerUrl = (fileUrl: string, attempt: number) => {
  const params = new URLSearchParams({
    url: fileUrl,
    embedded: "true",
    viewerAttempt: String(attempt),
  });

  return `https://docs.google.com/gview?${params.toString()}`;
};

const PdfViewer: React.FC = () => {
  const { documentID } = useParams<{ documentID: string }>();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showAISummaryModal, setShowAISummaryModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | "">("");
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [savingToCollection, setSavingToCollection] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSettings, setShareSettings] = useState<any>(null);
  const [shareSaving, setShareSaving] = useState(false);
  const [shareDisabling, setShareDisabling] = useState(false);
  const [shareForm, setShareForm] = useState({
    access: "anyone_with_link",
    permission: "viewer",
    allowDownload: true,
    password: "",
    expiresAt: "",
    maxViews: "",
    maxDownloads: "",
  });
  const [reportOptions, setReportOptions] = useState({
    suggestedReasons: [
      "Nội dung vi phạm bản quyền",
      "Nội dung sai sự thật",
      "Tài liệu spam hoặc quảng cáo",
      "Tài liệu không phù hợp",
      "File lỗi hoặc không thể xem",
      "Lý do khác",
    ],
    reasonRules: {
      minLength: 5,
      maxLength: 1000,
    },
  });
  const [selectedReason, setSelectedReason] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState<ReportStatusData | null>(null);
  const [reportStatusLoading, setReportStatusLoading] = useState(false);
  const [viewerAttempt, setViewerAttempt] = useState(0);
  const [viewerLoaded, setViewerLoaded] = useState(false);

  // Hàm lưu lịch sử truy cập vào Cookies
  const saveHistoryToCookies = (docID: string) => {
    const history = Cookies.get("documentHistory")
      ? JSON.parse(Cookies.get("documentHistory")!)
      : [];

    // Loại bỏ documentID trùng lặp nếu đã tồn tại
    const updatedHistory = history.filter((id: string) => id !== docID);

    // Thêm documentID mới vào đầu mảng
    updatedHistory.unshift(docID);

    // Giới hạn tối đa 5 documentID
    if (updatedHistory.length > 5) {
      updatedHistory.pop(); // Xóa phần tử cuối nếu vượt quá 5
    }

    // Lưu lại vào Cookies với thời hạn hết hạn (ví dụ: 7 ngày)
    Cookies.set("documentHistory", JSON.stringify(updatedHistory), {
      expires: 7,
    });
    console.log("Document history saved to cookies:", updatedHistory);
  };

  // Fetch document data và lưu lịch sử
  useEffect(() => {
    window.scroll({ top: 0, behavior: "smooth" });

    const fetchDocumentData = async () => {
      if (!documentID) {
        setError("Document ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await documentsApi.getDocumentByID(documentID);
        if (response.data) {
          setDocumentData(response.data);
          // Lưu documentID vào Cookies sau khi tải dữ liệu thành công
          saveHistoryToCookies(documentID);
        } else {
          setError("No document data returned");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error && "response" in err
            ? (err as any).response?.data?.message
            : "Đây là tài liệu riêng tư hoặc đã bị xóa.";
        setError(errorMessage || "Đây là tài liệu riêng tư hoặc đã bị xóa.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [documentID]);

  useEffect(() => {
    setViewerAttempt(0);
    setViewerLoaded(false);
  }, [documentData?.file_url]);

  useEffect(() => {
    if (!documentID || !documentData || !Cookies.get("token")) {
      setReportStatus(null);
      return;
    }

    let isMounted = true;
    setReportStatusLoading(true);
    reportsApi
      .getDocumentReportStatus(documentID)
      .then((response) => {
        if (isMounted) setReportStatus(response.data?.data ?? null);
      })
      .catch(() => {
        if (isMounted) setReportStatus(null);
      })
      .finally(() => {
        if (isMounted) setReportStatusLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [documentID, documentData]);

  useEffect(() => {
    if (!documentID || !documentData) return;
    featureUpgradesApi.recordView(documentID, "document_detail").catch(() => undefined);
  }, [documentID, documentData]);

  useEffect(() => {
    if (!documentData || viewerLoaded || viewerAttempt >= MAX_VIEWER_RETRIES) {
      return;
    }

    const retryTimer = window.setTimeout(() => {
      setViewerAttempt((currentAttempt) => currentAttempt + 1);
    }, VIEWER_RETRY_DELAY);

    return () => window.clearTimeout(retryTimer);
  }, [documentData, viewerAttempt, viewerLoaded]);

  const handleReloadViewer = () => {
    setViewerLoaded(false);
    setViewerAttempt((currentAttempt) => currentAttempt + 1);
  };

  const handleDownloadDocument = async () => {
    setIsDownloading(true);
    try {
      checkNotSigned();
      const response = await documentsApi.downloadDocumentByID(documentID);

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      const fileName = documentData?.title || "document.pdf"; // Tên file mặc định

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      // Cập nhật số lượt tải tài liệu sau khi tải thành công
      setDocumentData((prev) => {
        if (prev) {
          return { ...prev, download_count: prev.download_count + 1 };
        }
        return prev;
      });
    } catch (error: any) {
      console.error("Error downloading document:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!Cookies.get("token")) {
      checkNotSigned();
      return;
    }

    setShowSaveModal(true);
    setCollectionsLoading(true);
    try {
      const response = await collectionsApi.getMyCollection();
      const data = response.data || [];
      setCollections(data);
      setSelectedCollectionId(data[0]?.collection_id || "");
    } catch (err: any) {
      console.error("Lỗi khi tải bộ sưu tập:", err);
      toast.error(err?.response?.data?.message || "Không thể tải bộ sưu tập.");
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleAddDocumentToCollection = async () => {
    if (!documentID || !selectedCollectionId) return;

    setSavingToCollection(true);
    try {
      const response = await collectionsApi.addDocumentToCollection(selectedCollectionId, Number(documentID));
      toast.success(response.data?.message || "Đã lưu tài liệu vào bộ sưu tập.");
      setShowSaveModal(false);
    } catch (err: any) {
      console.error("Lỗi khi lưu tài liệu vào bộ sưu tập:", err);
      toast.error(err?.response?.data?.message || "Lưu tài liệu thất bại.");
    } finally {
      setSavingToCollection(false);
    }
  };

  const handleLike = async () => {
    checkNotSigned();
    const response = await documentsApi.updateDocumentLikeStatus(documentID, 1);
    setDocumentData((prev) => ({
      ...prev!,
      myReaction: response.data.reaction,
      like_count: response.data.likeCount,
      dislike_count: response.data.dislikeCount,
    }));
  }
  const handleDislike = () => {
    alert("Chức năng Dislike chưa được triển khai!");
  };
  const toDateTimeLocalValue = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  const handleShare = async () => {
    if (!Cookies.get("token")) {
      checkNotSigned();
      return;
    }
    setShowShareModal(true);
    try {
      const response = await workspaceLibraryApi.getShareLinkSettings({ itemId: Number(documentID), itemType: "document" });
      const shareLink = response.shareLink;
      if (shareLink) {
        setShareSettings(shareLink);
        setShareForm({
          access: shareLink.access || "anyone_with_link",
          permission: shareLink.permission || "viewer",
          allowDownload: shareLink.allowDownload !== false,
          password: "",
          expiresAt: toDateTimeLocalValue(shareLink.expiresAt),
          maxViews: shareLink.maxViews ? String(shareLink.maxViews) : "",
          maxDownloads: shareLink.maxDownloads ? String(shareLink.maxDownloads) : "",
        });
      }
    } catch {
      setShareSettings(null);
    }
  };

  const saveShareLink = async () => {
    setShareSaving(true);
    try {
      const response = await workspaceLibraryApi.createShareLink({
        itemId: Number(documentID),
        itemType: "document",
        access: shareForm.access,
        permission: shareForm.permission,
        allowDownload: shareForm.allowDownload,
        password: shareForm.password || null,
        expiresAt: shareForm.expiresAt || null,
        maxViews: shareForm.maxViews ? Number(shareForm.maxViews) : null,
        maxDownloads: shareForm.maxDownloads ? Number(shareForm.maxDownloads) : null,
      });
      setShareSettings(response.shareLink);
      toast.success("Đã lưu liên kết chia sẻ.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không tạo được liên kết chia sẻ.");
    } finally {
      setShareSaving(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareSettings?.shareUrl) {
      await saveShareLink();
      return;
    }
    await navigator.clipboard.writeText(shareSettings.shareUrl);
    toast.success("Đã sao chép liên kết.");
  };

  const disableShareLink = async () => {
    if (!shareSettings?.id) return;
    setShareDisabling(true);
    try {
      await workspaceLibraryApi.disableShareLink(shareSettings.id);
      setShareSettings(null);
      toast.success("Đã tắt liên kết chia sẻ.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không tắt được liên kết.");
    } finally {
      setShareDisabling(false);
    }
  };
  const handleReport = async () => {
    if (!Cookies.get("token")) {
      checkNotSigned();
      return;
    }

    if (reportStatus?.canReport === false) {
      const blockedMessage = reportStatus.blockedReason
        ? reportBlockedMessages[reportStatus.blockedReason]
        : "Hiện chưa thể báo cáo tài liệu này.";
      toast.info(blockedMessage);
      return;
    }

    setShowReportModal(true);
    try {
      const response = await reportsApi.getOptions();
      const options = response.data?.data;
      if (options) {
        setReportOptions({
          suggestedReasons: options.suggestedReasons ?? reportOptions.suggestedReasons,
          reasonRules: options.reasonRules ?? reportOptions.reasonRules,
        });
        const firstReason = options.suggestedReasons?.[0] ?? "";
        setSelectedReason(firstReason);
        setReportReason(firstReason);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải tùy chọn báo cáo:", err);
      setSelectedReason(reportOptions.suggestedReasons[0]);
      setReportReason(reportOptions.suggestedReasons[0]);
    }
  };

  const handleSelectReportReason = (value: string) => {
    setSelectedReason(value);
    if (value !== "Lý do khác") {
      setReportReason(value);
    } else {
      setReportReason("");
    }
  };

  const handleSubmitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!documentID) return;

    const reason = reportReason.trim();
    const { minLength, maxLength } = reportOptions.reasonRules;

    if (reason.length < minLength) {
      toast.error(`Lý do báo cáo cần ít nhất ${minLength} ký tự.`);
      return;
    }

    if (reason.length > maxLength) {
      toast.error(`Lý do báo cáo không được vượt quá ${maxLength} ký tự.`);
      return;
    }

    setIsSubmittingReport(true);
    try {
      const response = await reportsApi.createReport({
        documentId: Number(documentID),
        reason,
      });
      toast.success(response.data?.message || "Đã gửi báo cáo tài liệu.");
      const createdReport = response.data?.data;
      if (createdReport) {
        setReportStatus({
          canReport: false,
          blockedReason: "HAS_ACTIVE_REPORT",
          hasActiveReport: true,
          activeReport: createdReport,
          latestReport: createdReport,
        });
      }
      setShowReportModal(false);
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 409 && data?.data) {
        setReportStatus((current) => ({
          ...(current ?? {}),
          canReport: false,
          blockedReason: "HAS_ACTIVE_REPORT",
          hasActiveReport: true,
          activeReport: data.data,
          latestReport: data.data,
        }));
        toast.info(data.message || "Bạn đã có báo cáo đang xử lý cho tài liệu này.");
      } else {
        toast.error(data?.message || "Gửi báo cáo thất bại.");
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Render logic
  if (loading) {
    return <div className="text-center p-4">Đang tải...</div>;
  }

  if (error) {
    return <div className="text-center p-4 font-semibold text-xl">{error}</div>;
  }

  if (!documentData) {
    return <div className="text-center p-4">Không có dữ liệu tài liệu</div>;
  }

  const description = documentData.description || "Không có mô tả.";
  const fileSize = formatFileSize(documentData.file_size);
  const categories = (documentData.categories || []).map(getCategoryName).filter(Boolean);
  const accessSource = documentData.access_source ? accessSourceLabel[documentData.access_source] || documentData.access_source : null;
  const folderVisibility = documentData.folder_visibility ? folderVisibilityLabel[documentData.folder_visibility] || documentData.folder_visibility : null;
  const viewerUrl = isPdfDocument(documentData)
    ? documentData.file_url
    : buildGoogleViewerUrl(documentData.file_url, viewerAttempt);
  const viewerFallbackUrl = documentData.file_url;
  const activeReport = reportStatus?.activeReport;
  const latestReport = reportStatus?.latestReport;
  const reportButtonDisabled = reportStatusLoading || reportStatus?.canReport === false;
  const reportButtonLabel = reportStatusLoading
    ? "Đang kiểm tra"
    : activeReport
      ? "Đã báo cáo"
      : reportStatus?.blockedReason === "OWN_DOCUMENT"
        ? "Tài liệu của bạn"
        : "Report";

  return (
    <>
      <PageTitle
        title={documentData.title}
        description={documentData.description || documentData.title}
      />
      <div className="flex w-full flex-col gap-5 md:flex-row">
        {/* Left Sidebar */}
        <div className="surface-card flex w-full flex-col items-start p-4 md:w-1/4">
          <h1 className="mb-2 font-display text-2xl font-bold tracking-[-0.03em] text-ink">
            {documentData.title}
          </h1>
          <p className="mb-4 text-sm text-ink-secondary line-clamp-4">
            {description}
          </p>
          <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">
              {documentData.is_public ? "Công khai" : "Riêng tư"}
            </span>
            {folderVisibility && (
              <span className="rounded-full bg-canvas px-3 py-1 text-ink-secondary">
                {folderVisibility}
              </span>
            )}
            {accessSource && (
              <span className="rounded-full bg-canvas px-3 py-1 text-ink-secondary">
                {accessSource}
              </span>
            )}
          </div>
          <p className="mb-4 text-sm text-neutral">
            Được tải bởi{" "}
            <NavLink
              to={`/public-profile/${documentData.user_id}`}
              className="font-semibold text-ink-secondary hover:text-primary"
            >
              {documentData.full_name}
            </NavLink>{" "}
            vào {formatDateToVN(documentData.uploaded_at)}
          </p>
          <div className="mb-4 flex w-full items-center justify-between text-sm text-ink-secondary">
            <span>{documentData.download_count} lượt tải</span>
            <span>{[documentData.file_type?.toUpperCase(), fileSize].filter(Boolean).join(" · ")}</span>
          </div>
          {documentData.parent_folder_id && (
            <NavLink
              to={`/library/folders/${documentData.parent_folder_id}`}
              className="mb-4 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm font-medium text-ink-secondary transition hover:text-primary"
            >
              Mở thư mục chứa tài liệu
            </NavLink>
          )}
          {categories.length > 0 && (
            <div className="mb-4 flex w-full flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category} className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink-secondary">
                  {category}
                </span>
              ))}
            </div>
          )}
          <div className="grid w-full grid-cols-2 gap-2 lg:grid-cols-3">
            <button
              onClick={() => setShowAISummaryModal(true)}
              className="flex flex-col items-center rounded-md border border-line bg-canvas p-2 text-ink-secondary transition hover:-translate-y-px hover:text-primary"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M10.171 2.828A3.333 3.333 0 0 0 13 0a3.334 3.334 0 0 0 2.828 2.828A3.333 3.333 0 0 0 13 5.657a3.333 3.333 0 0 0-2.829-2.829ZM.636 9.364A7.5 7.5 0 0 0 7 3a7.5 7.5 0 0 0 6.364 6.364A7.5 7.5 0 0 0 7 15.728 7.5 7.5 0 0 0 .636 9.364Z"
                  fill="currentColor"
                ></path>
              </svg>
              <span className="text-sm">Tóm tắt AI</span>
            </button>

            <button
              onClick={handleDownloadDocument}
              disabled={isDownloading}
              className={`flex flex-col items-center p-2 rounded-lg ${isDownloading
                  ? "cursor-not-allowed bg-gray-300"
                  : "border border-line bg-canvas text-ink-secondary hover:-translate-y-px hover:text-primary"
                }`}
            >
              <FontAwesomeIcon
                icon={faDownload}
                className="mb-1"
              />
              <span className="text-sm">
                {isDownloading ? "..." : "Download"}
              </span>
            </button>
             {/* nút Like */} 
            <button
              onClick={handleLike}
              className={`flex flex-col items-center p-2 rounded-lg
                ${documentData.myReaction === 1
                              ? "bg-primary-soft"
                              : "border border-line bg-canvas hover:-translate-y-px hover:text-primary"
                            }
              `}
                        >
              <FontAwesomeIcon
                icon={faThumbsUp}
                className={`mb-1 ${documentData.myReaction === 1
                    ? "text-primary"
                    : "text-ink-secondary"
                  }`}
              />
              <span
                className={`text-sm ${documentData.myReaction === 1
                    ? "text-primary font-semibold"
                    : "text-ink-secondary"
                  }`}
              >
                {documentData.like_count}
              </span>
            </button>

            <button
              onClick={handleDislike}
              className={`flex flex-col items-center p-2 rounded-lg
                ${documentData.myReaction === -1
                              ? "bg-primary-soft"
                              : "border border-line bg-canvas hover:-translate-y-px hover:text-primary"
                            }
              `}
            >
              <FontAwesomeIcon
                icon={faThumbsDown}
                className={`mb-1 ${documentData.myReaction === -1
                    ? "text-primary"
                    : "text-ink-secondary"
                  }`}
              />
              <span
                className={`text-sm ${documentData.myReaction === -1
                    ? "text-primary font-semibold"
                    : "text-ink-secondary"
                  }`}
              >
                {documentData.dislike_count}
              </span>
            </button>

            <button
              onClick={handleSave}
              className="flex flex-col items-center rounded-md border border-line bg-canvas p-2 text-ink-secondary transition hover:-translate-y-px hover:text-primary"
            >
              <FontAwesomeIcon
                icon={faBookmark}
                className="mb-1"
              />
              <span className="text-sm">Lưu</span>
            </button>
            <button
              onClick={handleShare}
              className="flex flex-col items-center rounded-md border border-line bg-canvas p-2 text-ink-secondary transition hover:-translate-y-px hover:text-primary"
            >
              <FontAwesomeIcon
                icon={faShareAlt}
                className="mb-1"
              />
              <span className="text-sm">Chia sẻ</span>
            </button>
            <button
              onClick={handleReport}
              disabled={reportButtonDisabled}
              className={`flex flex-col items-center rounded-md border border-line p-2 transition ${
                activeReport
                  ? "bg-amber-50 text-amber-700"
                  : reportStatus?.blockedReason === "OWN_DOCUMENT"
                    ? "bg-gray-50 text-neutral"
                    : "bg-canvas text-ink-secondary hover:-translate-y-px hover:text-danger"
              } disabled:cursor-not-allowed disabled:opacity-80`}
            >
              <FontAwesomeIcon icon={faFlag} className="mb-1" />
              <span className="text-sm">{reportButtonLabel}</span>
            </button>
          </div>
          {(activeReport || latestReport || reportStatus?.blockedReason === "OWN_DOCUMENT") && (
            <div className="mt-4 w-full rounded-md border border-line bg-canvas p-3 text-sm">
              {activeReport ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink">Báo cáo đang hoạt động</span>
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                      {activeReport.status}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-ink-secondary">{activeReport.reason}</p>
                  <NavLink to={`/my-reports/${activeReport.report_id}`} className="mt-3 inline-flex font-medium text-primary hover:text-primary-hover">
                    Xem báo cáo
                  </NavLink>
                </>
              ) : reportStatus?.blockedReason === "OWN_DOCUMENT" ? (
                <p className="text-ink-secondary">{reportBlockedMessages.OWN_DOCUMENT}</p>
              ) : latestReport ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink">Báo cáo gần nhất</span>
                    <span className="rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-100">
                      {latestReport.status}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-ink-secondary">{latestReport.reason}</p>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="surface-card w-full p-4 md:w-3/4 md:p-6">
          <div className="relative h-[600px] max-h-svh w-full overflow-hidden rounded-lg border border-line">
            {!viewerLoaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface/95 p-6 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary" />
                <div>
                  <p className="font-medium text-ink">Đang tải tài liệu...</p>
                  <p className="mt-1 text-sm text-ink-secondary">
                    Nếu Google Viewer phản hồi chậm, hệ thống sẽ tự thử lại.
                  </p>
                </div>
              </div>
            )}
            <iframe
              key={`${documentData.document_id}-${viewerAttempt}`}
              src={viewerUrl}
              className="h-full w-full rounded-lg"
              title="PDF Viewer"
              onLoad={() => setViewerLoaded(true)}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-secondary">
            <span>
              {viewerLoaded
                ? "Tài liệu đã được tải."
                : `Đang thử tải lần ${viewerAttempt + 1}/${MAX_VIEWER_RETRIES + 1}.`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReloadViewer}
                className="btn-secondary px-3 py-2"
              >
                Tải lại khung xem
              </button>
              <a
                href={viewerFallbackUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-3 py-2"
              >
                Mở file gốc
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <DocumentCommentsPanel documentId={documentData.document_id} />
        <DocumentVersionsPanel
          documentId={documentData.document_id}
          currentFileUrl={documentData.file_url}
          currentFileType={documentData.file_type}
          currentFileSize={documentData.file_size}
        />
      </div>
      {showAISummaryModal && documentData?.document_id && (
        <DocumentSummaryByAI
          documentId={documentData.document_id}
          onClose={() => setShowAISummaryModal(false)}
        />
      )}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="surface-card w-full max-w-xl bg-surface p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-ink">Chia sẻ tài liệu</h2>
                <p className="mt-2 line-clamp-2 text-sm text-ink-secondary">{documentData.title}</p>
              </div>
              <button type="button" onClick={() => setShowShareModal(false)} className="rounded-md p-2 text-ink-secondary hover:bg-canvas">
                Đóng
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm font-semibold text-ink">Quyền truy cập</span>
                <select value={shareForm.access} onChange={(event) => setShareForm({ ...shareForm, access: event.target.value })} className="input-field">
                  <option value="restricted">Restricted</option>
                  <option value="anyone_with_link">Anyone with link</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold text-ink">Permission</span>
                <select value={shareForm.permission} onChange={(event) => setShareForm({ ...shareForm, permission: event.target.value })} className="input-field">
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </label>
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-md border border-line p-3 text-sm text-ink-secondary">
              <input type="checkbox" checked={shareForm.allowDownload} onChange={(event) => setShareForm({ ...shareForm, allowDownload: event.target.checked })} />
              <span>Cho phép tải xuống</span>
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm font-semibold text-ink">Mật khẩu</span>
                <input value={shareForm.password} onChange={(event) => setShareForm({ ...shareForm, password: event.target.value })} className="input-field" placeholder="Không bắt buộc" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold text-ink">Ngày hết hạn</span>
                <input type="datetime-local" value={shareForm.expiresAt} onChange={(event) => setShareForm({ ...shareForm, expiresAt: event.target.value })} className="input-field" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold text-ink">Giới hạn lượt xem</span>
                <input type="number" min="1" value={shareForm.maxViews} onChange={(event) => setShareForm({ ...shareForm, maxViews: event.target.value })} className="input-field" placeholder="Không giới hạn" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold text-ink">Giới hạn lượt tải</span>
                <input type="number" min="1" value={shareForm.maxDownloads} onChange={(event) => setShareForm({ ...shareForm, maxDownloads: event.target.value })} className="input-field" placeholder="Không giới hạn" />
              </label>
            </div>
            <div className="mt-5 rounded-md border border-line bg-canvas p-3 text-sm text-ink-secondary">
              {shareSettings?.shareUrl || "Chưa có link. Bấm tạo/cập nhật để lấy liên kết."}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {shareSettings?.id && (
                <button type="button" onClick={disableShareLink} disabled={shareDisabling} className="btn-secondary border-danger text-danger hover:border-danger hover:text-danger">
                  {shareDisabling ? "Đang tắt..." : "Tắt link"}
                </button>
              )}
              <button type="button" onClick={saveShareLink} disabled={shareSaving} className="btn-secondary">
                {shareSaving ? "Đang lưu..." : "Tạo/Cập nhật link"}
              </button>
              <button type="button" onClick={copyShareLink} className="btn-primary">Sao chép liên kết</button>
            </div>
          </div>
        </div>
      )}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="surface-card w-full max-w-md bg-surface p-6 shadow-card">
            <h2 className="text-xl font-bold text-ink">Lưu vào bộ sưu tập</h2>
            <p className="mt-2 text-sm text-ink-secondary line-clamp-2">
              {documentData.title}
            </p>

            {collectionsLoading ? (
              <div className="py-8 text-center text-sm text-ink-secondary">
                Đang tải bộ sưu tập...
              </div>
            ) : collections.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-ink-secondary">
                  Bạn chưa có bộ sưu tập nào. Hãy tạo bộ sưu tập trước khi lưu tài liệu.
                </p>
                <NavLink to="/my-collections" className="btn-primary mt-5">
                  Tạo bộ sưu tập
                </NavLink>
              </div>
            ) : (
              <div className="mt-5">
                <label className="block text-sm font-medium text-ink">
                  Chọn bộ sưu tập
                </label>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(Number(e.target.value))}
                  className="input-field mt-2"
                >
                  {collections.map((collection) => (
                    <option key={collection.collection_id} value={collection.collection_id}>
                      {collection.name} ({collection.documentCount ?? 0})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="btn-secondary"
              >
                Hủy
              </button>
              {collections.length > 0 && !collectionsLoading && (
                <button
                  type="button"
                  onClick={handleAddDocumentToCollection}
                  disabled={!selectedCollectionId || savingToCollection}
                  className="btn-primary"
                >
                  {savingToCollection ? "Đang lưu..." : "Lưu"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <form onSubmit={handleSubmitReport} className="surface-card w-full max-w-lg bg-surface p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink">Báo cáo tài liệu</h2>
                <p className="mt-2 line-clamp-2 text-sm text-ink-secondary">
                  {documentData.title}
                </p>
              </div>
              <FontAwesomeIcon icon={faFlag} className="mt-1 text-danger" />
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-ink">
                Lý do gợi ý
              </label>
              <select
                value={selectedReason}
                onChange={(event) => handleSelectReportReason(event.target.value)}
                className="input-field mt-2"
              >
                {reportOptions.suggestedReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-ink">
                Nội dung báo cáo
              </label>
              <textarea
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                minLength={reportOptions.reasonRules.minLength}
                maxLength={reportOptions.reasonRules.maxLength}
                rows={5}
                className="input-field mt-2 resize-none"
                placeholder="Nhập lý do báo cáo..."
                required
              />
              <div className="mt-2 flex justify-between text-xs text-neutral">
                <span>
                  {reportOptions.reasonRules.minLength}-{reportOptions.reasonRules.maxLength} ký tự
                </span>
                <span>
                  {reportReason.trim().length}/{reportOptions.reasonRules.maxLength}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="btn-secondary"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmittingReport}
                className="btn-primary bg-danger hover:bg-red-700"
              >
                {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default PdfViewer;
