import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Download, FileText, RefreshCw, RotateCcw, Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import featureUpgradesApi from "api/featureUpgradesApi.ts";
import { formatDateToVN } from "utils/formatDateToVN";

interface VersionPermissions {
  canViewVersions?: boolean;
  canUploadVersion?: boolean;
  canRestoreVersion?: boolean;
  canDownloadVersion?: boolean;
}

interface DocumentVersion {
  id?: number | string;
  versionId?: number | string;
  versionNumber?: number;
  changeNote?: string | null;
  createdAt?: string;
  uploadedAt?: string;
  uploader?: { fullName?: string; username?: string };
  uploaderName?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileUrl?: string;
  downloadUrl?: string;
  checksum?: string;
  isCurrent?: boolean;
  status?: string;
}

interface DocumentVersionsPanelProps {
  documentId: number | string;
  currentFileUrl?: string;
  currentFileType?: string;
  currentFileSize?: number;
}

const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "zip",
  "rar",
  "png",
  "jpg",
  "jpeg",
];
const MAX_VERSION_FILE_BYTES = 10 * 1024 * 1024;

const versionIdOf = (version: DocumentVersion) => version.id ?? version.versionId;

const uploaderName = (version: DocumentVersion) =>
  version.uploaderName || version.uploader?.fullName || version.uploader?.username || "DocShare";

const formatSize = (size?: number) => {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const fileExtension = (value?: string | null) => {
  if (!value) return "";
  const cleanValue = value.split("?")[0].toLowerCase();
  const name = cleanValue.split("/").pop() || cleanValue;
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const versionLabel = (version: DocumentVersion, fallbackIndex = 0) =>
  `v${version.versionNumber ?? version.id ?? version.versionId ?? fallbackIndex + 1}`;

const normalizeVersion = (raw: any): DocumentVersion => ({
  id: raw?.id ?? raw?.versionId ?? raw?.version_id,
  versionId: raw?.versionId ?? raw?.version_id,
  versionNumber: raw?.versionNumber ?? raw?.version_number,
  changeNote: raw?.changeNote ?? raw?.change_note ?? raw?.note ?? null,
  createdAt: raw?.createdAt ?? raw?.created_at,
  uploadedAt: raw?.uploadedAt ?? raw?.uploaded_at,
  uploader: raw?.uploader ?? raw?.user,
  uploaderName: raw?.uploaderName ?? raw?.uploader_name ?? raw?.full_name,
  fileName: raw?.fileName ?? raw?.file_name ?? raw?.name,
  fileSize: raw?.fileSize ?? raw?.file_size ?? raw?.size,
  mimeType: raw?.mimeType ?? raw?.mime_type,
  fileUrl: raw?.fileUrl ?? raw?.file_url ?? raw?.previewUrl ?? raw?.preview_url,
  downloadUrl: raw?.downloadUrl ?? raw?.download_url,
  checksum: raw?.checksum ?? raw?.fileChecksum ?? raw?.file_checksum,
  isCurrent: Boolean(raw?.isCurrent ?? raw?.is_current ?? raw?.isActive ?? raw?.is_active),
  status: raw?.status,
});

const normalizeVersionsResponse = (response: any) => {
  const body = response?.data ?? response;
  const list = body?.versions ?? body?.items ?? body?.data?.versions ?? body?.data ?? [];
  const permissions = body?.permissions ?? body?.data?.permissions ?? {};
  const versions = Array.isArray(list) ? list.map(normalizeVersion).filter((version) => versionIdOf(version)) : [];

  return {
    versions: versions.sort((a, b) => {
      const versionDelta = Number(b.versionNumber ?? 0) - Number(a.versionNumber ?? 0);
      if (versionDelta !== 0) return versionDelta;
      return new Date(b.createdAt || b.uploadedAt || 0).getTime() - new Date(a.createdAt || a.uploadedAt || 0).getTime();
    }),
    permissions: {
      canViewVersions: body?.canViewVersions ?? permissions.canViewVersions ?? permissions.can_view_versions ?? true,
      canUploadVersion: body?.canUploadVersion ?? permissions.canUploadVersion ?? permissions.can_upload_version ?? true,
      canRestoreVersion: body?.canRestoreVersion ?? permissions.canRestoreVersion ?? permissions.can_restore_version ?? true,
      canDownloadVersion: body?.canDownloadVersion ?? permissions.canDownloadVersion ?? permissions.can_download_version ?? true,
    } as VersionPermissions,
  };
};

export default function DocumentVersionsPanel({
  documentId,
  currentFileUrl,
  currentFileType,
  currentFileSize,
}: DocumentVersionsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [permissions, setPermissions] = useState<VersionPermissions>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [restoringId, setRestoringId] = useState<string | number | null>(null);
  const [pendingRestore, setPendingRestore] = useState<DocumentVersion | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  const currentExtension = useMemo(
    () => fileExtension(currentFileUrl) || fileExtension(currentFileType),
    [currentFileType, currentFileUrl]
  );
  const selectedExtension = fileExtension(file?.name);
  const differentExtension = Boolean(currentExtension && selectedExtension && currentExtension !== selectedExtension);
  const canUpload = permissions.canUploadVersion !== false;
  const canRestore = permissions.canRestoreVersion !== false;
  const canDownload = permissions.canDownloadVersion !== false;

  const validateFile = (nextFile: File | null) => {
    if (!nextFile) return "";
    if (nextFile.size <= 0) return "File không hợp lệ hoặc rỗng.";
    if (nextFile.size > MAX_VERSION_FILE_BYTES) return "File phiên bản không được vượt quá 10MB.";
    const extension = fileExtension(nextFile.name);
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return `Định dạng .${extension || "unknown"} chưa được hỗ trợ.`;
    }
    return "";
  };

  const loadVersions = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await featureUpgradesApi.getVersions(documentId);
      const normalized = normalizeVersionsResponse(response);
      setVersions(normalized.versions);
      setPermissions(normalized.permissions);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setPermissions({ canViewVersions: false, canUploadVersion: false, canRestoreVersion: false, canDownloadVersion: false });
        setLoadError("Bạn chưa có quyền xem lịch sử phiên bản của tài liệu này.");
      } else {
        setLoadError(error?.response?.data?.message || "Không tải được lịch sử phiên bản.");
      }
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    setValidationMessage(validateFile(nextFile));
  };

  const resetUploadForm = () => {
    setFile(null);
    setChangeNote("");
    setValidationMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadVersion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canUpload) {
      toast.info("Bạn không có quyền tải phiên bản mới.");
      return;
    }
    const nextValidation = validateFile(file);
    setValidationMessage(nextValidation);
    if (!file || nextValidation) return;

    const note = changeNote.trim();
    if (note.length > 500) {
      setValidationMessage("Ghi chú thay đổi không được vượt quá 500 ký tự.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      await featureUpgradesApi.uploadVersion(documentId, file, note || "Cập nhật phiên bản tài liệu", setUploadProgress);
      setUploadProgress(100);
      toast.success("Đã tải phiên bản mới.");
      resetUploadForm();
      await loadVersions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không tải được phiên bản mới.");
    } finally {
      setUploading(false);
    }
  };

  const restoreVersion = async () => {
    if (!pendingRestore) return;
    const id = versionIdOf(pendingRestore);
    if (!id || !canRestore) return;

    setRestoringId(id);
    try {
      await featureUpgradesApi.restoreVersion(documentId, id);
      toast.success("Đã khôi phục phiên bản.");
      setPendingRestore(null);
      await loadVersions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không khôi phục được phiên bản.");
    } finally {
      setRestoringId(null);
    }
  };

  const openVersionFile = async (version: DocumentVersion) => {
    const id = versionIdOf(version);
    const url = version.downloadUrl || version.fileUrl;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!id) return;
    try {
      const response = await featureUpgradesApi.downloadVersion(documentId, id);
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: response.headers["content-type"] }));
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không mở được file phiên bản.");
    }
  };

  return (
    <section className="surface-card p-4 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <Clock3 className="h-5 w-5 text-primary" />
            Phiên bản tài liệu
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Quản lý file thay thế, lịch sử thay đổi và điểm khôi phục.
          </p>
        </div>
        <button type="button" onClick={loadVersions} disabled={loading || uploading} className="btn-secondary px-3 py-2" title="Tải lại phiên bản">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {canUpload ? (
        <form onSubmit={uploadVersion} className="rounded-lg border border-line bg-canvas p-3">
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">File phiên bản mới</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
                onChange={handleSelectFile}
                disabled={uploading}
                className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            {file && (
              <div className="rounded-md border border-line bg-surface p-3 text-sm">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{file.name}</p>
                    <p className="mt-1 text-xs text-ink-secondary">
                      {formatSize(file.size)}
                      {currentFileSize ? ` · file hiện tại ${formatSize(currentFileSize)}` : ""}
                    </p>
                  </div>
                </div>
                {differentExtension && (
                  <div className="mt-3 flex gap-2 rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-ink-secondary">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                    <span>
                      File mới là .{selectedExtension}, khác định dạng hiện tại .{currentExtension}. BE nên kiểm tra preview và metadata sau upload.
                    </span>
                  </div>
                )}
              </div>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">Ghi chú thay đổi</span>
              <textarea
                value={changeNote}
                onChange={(event) => setChangeNote(event.target.value)}
                maxLength={500}
                disabled={uploading}
                className="input-field min-h-24 resize-none"
                placeholder="Ví dụ: Cập nhật số liệu chương 2, sửa lỗi chính tả, bổ sung phụ lục..."
              />
              <span className="mt-1 block text-right text-xs text-neutral">{changeNote.trim().length}/500</span>
            </label>
            {validationMessage && (
              <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{validationMessage}</div>
            )}
            {uploading && (
              <div className="rounded-md border border-line bg-surface p-3">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-secondary">
                  <span>Đang tải phiên bản</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {(file || changeNote) && (
                <button type="button" onClick={resetUploadForm} disabled={uploading} className="btn-secondary px-3 py-2">
                  Hủy
                </button>
              )}
              <button type="submit" disabled={!file || uploading || Boolean(validationMessage)} className="btn-primary px-3 py-2">
                {uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploading ? "Đang tải..." : "Tải phiên bản"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-line bg-canvas p-4 text-sm text-ink-secondary">
          Bạn chỉ có quyền xem lịch sử phiên bản, không thể tải file thay thế.
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="py-8 text-center text-sm text-ink-secondary">Đang tải lịch sử phiên bản...</div>
        ) : loadError ? (
          <div className="rounded-lg border border-dashed border-line bg-canvas p-6 text-center text-sm text-ink-secondary">
            <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-warning" />
            {loadError}
          </div>
        ) : versions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-canvas p-8 text-center text-sm text-ink-secondary">
            Chưa có phiên bản nào.
          </div>
        ) : (
          versions.map((version, index) => {
            const id = versionIdOf(version);
            const isRestoring = restoringId === id;
            const label = versionLabel(version, index);
            const createdAt = version.createdAt || version.uploadedAt || "";
            const hasFileAccess = canDownload && Boolean(version.downloadUrl || version.fileUrl || id);

            return (
              <div key={String(id ?? index)} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">Phiên bản {label}</p>
                      {version.isCurrent && (
                        <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Hiện hành
                        </span>
                      )}
                      {version.status && !version.isCurrent && (
                        <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-secondary">{version.status}</span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">
                      {version.changeNote || "Không có ghi chú thay đổi."}
                    </p>
                    <p className="mt-2 text-xs text-neutral">
                      {uploaderName(version)}
                      {createdAt ? ` · ${formatDateToVN(createdAt)}` : ""}
                      {version.fileSize ? ` · ${formatSize(version.fileSize)}` : ""}
                    </p>
                    {(version.fileName || version.checksum) && (
                      <p className="mt-1 truncate text-xs text-neutral">
                        {[version.fileName, version.checksum ? `checksum ${version.checksum}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {hasFileAccess && (
                      <button type="button" onClick={() => openVersionFile(version)} className="btn-secondary px-3 py-2">
                        <Download className="mr-2 h-4 w-4" />
                        File
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingRestore(version)}
                      disabled={!id || !canRestore || isRestoring || version.isCurrent}
                      className="btn-secondary px-3 py-2"
                      title={version.isCurrent ? "Phiên bản này đang hiện hành" : "Khôi phục phiên bản"}
                    >
                      {isRestoring ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                      Khôi phục
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pendingRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="surface-card w-full max-w-md bg-surface p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-ink">Khôi phục phiên bản</h3>
                <p className="mt-2 text-sm text-ink-secondary">
                  Phiên bản hiện hành sẽ được thay bằng {versionLabel(pendingRestore)}. Hành động này nên được BE ghi audit log.
                </p>
              </div>
              <button type="button" onClick={() => setPendingRestore(null)} className="rounded-md p-2 text-ink-secondary hover:bg-canvas" title="Đóng">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-ink-secondary">
              <AlertTriangle className="mr-2 inline h-4 w-4 text-warning" />
              Người dùng đang xem tài liệu có thể thấy file thay đổi sau khi tải lại trang.
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingRestore(null)} disabled={Boolean(restoringId)} className="btn-secondary">
                Hủy
              </button>
              <button type="button" onClick={restoreVersion} disabled={Boolean(restoringId)} className="btn-primary">
                {restoringId ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
