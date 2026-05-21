import React, { useEffect, useId, useRef } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

type ConfirmVariant = "danger" | "primary";

interface WorkspaceConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const WorkspaceConfirmDialog: React.FC<WorkspaceConfirmDialogProps> = ({
  title,
  message,
  confirmLabel,
  cancelLabel = "Hủy",
  variant = "danger",
  loading = false,
  onCancel,
  onConfirm,
}) => {
  const titleId = useId();
  const messageId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmClass =
    variant === "danger"
      ? "border-danger bg-danger text-white hover:bg-danger/90"
      : "border-primary bg-primary text-white hover:bg-primary/90";

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-danger/10 text-danger">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 id={titleId} className="text-lg font-bold text-ink">{title}</h2>
              <p id={messageId} className="mt-2 text-sm leading-6 text-ink-secondary">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md p-2 text-ink-secondary hover:bg-canvas hover:text-ink disabled:pointer-events-none disabled:opacity-50"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelButtonRef} type="button" onClick={onCancel} disabled={loading} className="btn-secondary px-4">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-60 ${confirmClass}`}
          >
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceConfirmDialog;
