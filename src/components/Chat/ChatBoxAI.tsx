import React, { useState, useEffect, useRef } from "react";
import config from "config/config";
import Marked from "marked-react";
import aiGenerate from "api/aiGenerate";
import { apiMessage } from "utils/apiMessage";
import { readAIHistory, writeAIHistory } from "utils/aiHistory";

interface Message {
  role: "user" | "ai";
  content: string;
}

const SESSION_STORAGE_KEY = config.SESSION_STORAGE_KEY_FOR_AI_CHAT;

const ChatBoxAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() =>
    readAIHistory(SESSION_STORAGE_KEY),
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // Thêm trạng thái loading
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);

  // Scroll to bottom on new message or when chat is opened
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, isOpen]); // Cuộn khi tin nhắn mới hoặc khi mở hội thoại

  // Save to sessionStorage whenever messages change
  useEffect(() => {
    writeAIHistory(SESSION_STORAGE_KEY, messages);
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (busy.current) return;
      const parsed = readAIHistory(SESSION_STORAGE_KEY);

      // Chỉ cập nhật nếu nội dung khác
      if (JSON.stringify(parsed) !== JSON.stringify(messages)) {
        setMessages(parsed);
      }
    }, 1500); // check mỗi 1.5 giây

    return () => clearInterval(interval); // cleanup
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || busy.current) return;
    busy.current = true;
    const controller = new AbortController();
    activeRequest.current = controller;

    // Add the user's message to the messages state
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true); // Đặt loading là true khi bắt đầu gửi yêu cầu

    // Create the prompt with chat history
    const chatHistory = messages
      .slice(-12)
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "AI"}: ${msg.content.slice(0, 1200)}`,
      )
      .join("\n");

    const prompt = `${chatHistory}\nUser: ${input.trim().slice(0, 4000)}\nAI:`;

    try {
      // Call the API to get the AI's response
      const response = await aiGenerate.postChat(prompt, controller.signal);
      if (controller.signal.aborted) return;

      // Assuming the response is structured as { message: "AI's response" }
      const aiMessage: Message = {
        role: "ai",
        content: response.data.message || "AI không trả về nội dung.",
      };

      // Add the AI's message to the messages state
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false); // Set loading to false after getting response
    } catch (error) {
      if (controller.signal.aborted) return;
      const aiMessage: Message = {
        role: "ai",
        content: apiMessage(
          error,
          "Không kết nối được trợ lý AI. Vui lòng thử lại.",
        ),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false); // Set loading to false even if there is an error
    } finally {
      busy.current = false;
      if (!controller.signal.aborted) setLoading(false);
      activeRequest.current = null;
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-3 rounded-full shadow-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Trò chuyện AI
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`w-[90vw] h-[60vh] 
      md:w-[600px] sm:h-[600px] 
      bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden 
      transition-all duration-300 animate-in slide-in-from-bottom-10
    `}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-medium">Trợ Lý AI</h3>
            </div>
            <button
              onClick={toggleChat}
              className="text-white hover:bg-white/20 p-1 rounded-full transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`w-fit max-w-[80%] p-3 rounded-xl prose prose-sm ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white ml-auto"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <Marked>{msg.content}</Marked>
              </div>
            ))}

            {/* Display loading indicator when AI is responding */}
            {loading && (
              <div className="w-fit max-w-[80%] p-3 rounded-xl prose prose-sm bg-gray-200 text-gray-800 font-light">
                <p>Đang phản hồi...</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Nhập câu hỏi của bạn…"
                aria-label="Câu hỏi cho trợ lý AI"
                maxLength={4000}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                aria-label="Gửi câu hỏi"
                disabled={loading || !input.trim()}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBoxAI;
