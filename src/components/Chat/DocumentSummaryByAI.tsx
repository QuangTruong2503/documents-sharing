import React, { useState, useEffect } from "react";
import Marked from "marked-react";
import aiGenerate from "api/aiGenerate";
import config from "config/config";
import { apiMessage } from "utils/apiMessage";
import { readAIHistory, writeAIHistory } from "utils/aiHistory";
import Modal from "components/Workspace/dialogs/Modal";
const DocumentSummaryByAI: React.FC<{
  documentId: number;
  onClose: () => void;
}> = ({ documentId, onClose }) => {
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setSummary("");
    setError(false);
    setStatus("Đang đọc tài liệu và tạo tóm tắt…");
    if (!documentId) {
      setError(true);
      setStatus("Mã tài liệu không hợp lệ.");
      return;
    }
    aiGenerate
      .getSummarizeDocument(documentId, controller.signal)
      .then(({ data }) => {
        if (!active) return;
        if (typeof data.summary !== "string" || !data.summary.trim())
          throw new Error("AI không trả về tóm tắt.");
        setSummary(data.summary);
        setStatus(
          data.truncated
            ? `Đã tóm tắt một phần tài liệu (${data.processed_pages}/${data.total_pages} trang); nội dung vượt giới hạn xử lý.`
            : "Đã hoàn tất tóm tắt.",
        );
        const key = config.SESSION_STORAGE_KEY_FOR_AI_CHAT;
        writeAIHistory(key, [
          ...readAIHistory(key),
          {
            role: "ai",
            content: `Tóm tắt tài liệu #${documentId}${data.truncated ? " (một phần)" : ""}:\n\n${data.summary}`,
          },
        ]);
      })
      .catch((failure) => {
        if (active) {
          setError(true);
          setStatus(
            apiMessage(failure, "Không tạo được tóm tắt. Vui lòng thử lại."),
          );
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [documentId, revision]);
  return (
    <Modal label="Tóm tắt tài liệu bằng AI" onClose={onClose}>
      <section className="w-full space-y-4 rounded-xl bg-surface p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Tóm tắt tài liệu bằng AI</h2>
          <button
            aria-label="Đóng tóm tắt"
            className="btn-secondary"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
        <p
          role={error ? "alert" : "status"}
          className="text-sm text-ink-secondary"
        >
          {status}
        </p>
        {error && (
          <button
            className="btn-secondary"
            onClick={() => setRevision((value) => value + 1)}
          >
            Thử lại
          </button>
        )}
        {summary && (
          <div className="prose prose-sm max-h-96 max-w-none overflow-y-auto rounded border border-line bg-canvas p-4">
            <Marked>{summary}</Marked>
          </div>
        )}
      </section>
    </Modal>
  );
};
export default DocumentSummaryByAI;
