import React, { useState, useEffect, useRef, useCallback } from "react";
import Marked from "marked-react";
import geminiGenerate from "api/geminiGenerate";
import config from "config/config";

interface DocumentSummaryByAIProps {
  documentId: number;
  onClose: () => void;
}

const DocumentSummaryByAI: React.FC<DocumentSummaryByAIProps> = ({ documentId, onClose }) => {
  const [summary, setSummary] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // ✅ Bọc trong useCallback để dùng trong useEffect
  const fetchSummary = useCallback(async () => {
    if (!documentId) {
      alert("Thiếu document ID.");
      return;
    }

    setStatus("Đang xử lý...");
    setSummary("");

    try {
      const response = await geminiGenerate.getSummarizeDocument(documentId);
      const result = await response.data;
      const summaryText = result.summary || result.content || "Không có nội dung trả về.";
      setSummary(summaryText);
      setStatus("✅ Hoàn tất!");
    } catch (error) {
      console.error("Lỗi khi lấy tóm tắt:", error);
      setStatus("❌ Có lỗi xảy ra khi xử lý.");
    }
  }, [documentId]); // ✅ Chỉ phụ thuộc vào documentId

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchSummary();
    }
  }, [fetchSummary]); // ✅ Thêm fetchSummary vào dependencies
  useEffect(() => {
    if (summary) {
      const SESSION_STORAGE_KEY = config.SESSION_STORAGE_KEY_FOR_AI_CHAT;
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      let chatHistory = saved ? JSON.parse(saved) : [];
  
      chatHistory.push({
        role: "ai",
        content: `📝 Tóm tắt tài liệu #${documentId}:\n\n${summary}`
      });
  
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(chatHistory));
    }
  }, [summary, documentId]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-xl p-6 rounded-lg shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold mb-4">💬 Gemini AI đang tóm tắt tài liệu</h2>
        {status && <p className="text-sm text-gray-500 italic mb-3">{status}</p>}

        <div className="h-64 overflow-y-auto border border-gray-300 rounded-md p-4 bg-gray-50 prose prose-sm prose-blue max-w-none">
          {summary ? (
            <Marked>{summary}</Marked>
          ) : (
            <p className="text-gray-400">Đang chờ phản hồi từ AI...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentSummaryByAI;
