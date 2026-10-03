import Modal from "./Modal.tsx";
import React, { useState } from "react";

import { File, RefreshCw, Upload } from "lucide-react";
import { toast } from "react-toastify";

import workspaceLibraryApi from "api/workspaceLibraryApi.ts";

import { apiMessage } from "utils/apiMessage.ts";

const UploadDialog = ({ parentFolderId, onClose, onDone }: { parentFolderId: number | null; onClose: () => void; onDone: () => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const maxUploadFileBytes = 10 * 1024 * 1024;

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter((file) => file.size <= maxUploadFileBytes);
    const oversizedCount = selectedFiles.length - validFiles.length;
    if (oversizedCount > 0) {
      toast.warning(`${oversizedCount} file vượt quá 10MB đã bị bỏ qua.`);
    }
    setFiles(validFiles);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const response = await workspaceLibraryApi.uploadDocuments(files, parentFolderId, setUploadProgress);
      setUploadProgress(100);
      if (response.failed?.length) {
        toast.warning(`${response.documents?.length || 0} file tải lên thành công, ${response.failed.length} file lỗi.`);
      } else {
        toast.success("Đã tải file lên.");
      }
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tải file lên."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal onClose={onClose} busy={uploading}>
      <form onSubmit={submit} className="w-full max-w-xl rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Tải tài liệu</h2>
        <p className="mt-1 text-sm text-ink-secondary">{parentFolderId ? "File sẽ được tải vào thư mục hiện tại." : "File sẽ được tải vào thư viện gốc."}</p>
        <label className="mt-5 block rounded-lg border border-dashed border-line bg-canvas p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-primary" />
          <span className="mt-2 block text-sm font-semibold text-ink">Chọn một hoặc nhiều file</span>
          <input type="file" multiple className="mt-4 block w-full text-sm text-ink-secondary" onChange={handleFilesChange} />
        </label>
        {files.length > 0 && <p className="mt-3 text-sm text-ink-secondary">{files.length} file đã chọn</p>}
        {uploading && (
          <div className="mt-4 rounded-lg border border-line bg-canvas p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-secondary">
              <span>Đang tải lên</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={uploading || files.length === 0} className="btn-primary">
            {uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Đang tải..." : "Tải lên"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadDialog;
