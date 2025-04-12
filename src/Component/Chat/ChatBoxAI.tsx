import React, { useState, useEffect, useRef } from "react";
import config from "../../config/config";
import Marked from "marked-react";
interface Message {
  role: "user" | "ai";
  content: string;
}

const SESSION_STORAGE_KEY = config.SESSION_STORAGE_KEY_FOR_AI_CHAT;

const ChatBoxAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Save to sessionStorage whenever messages change
  useEffect(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
  
      // Chỉ cập nhật nếu nội dung khác
      if (JSON.stringify(parsed) !== JSON.stringify(messages)) {
        setMessages(parsed);
      }
    }, 1500); // check mỗi 1.5 giây
  
    return () => clearInterval(interval); // cleanup
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);
    setInput("");

    // Simulate AI response (replace with real API as needed)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `🤖 Echo: "${input}"` },
      ]);
    }, 1000);
  };

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2"
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
          AI Chat
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`
      w-[90vw] h-[60vh] 
      md:w-[600px] sm:h-[600px] 
      bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden 
      transition-all duration-300 animate-in slide-in-from-bottom-10
    `}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-medium">AI Assistant</h3>
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
                <Marked >{msg.content}</Marked>
              </div>
            ))}

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
                placeholder="Type your message..."
              />
              <button
                onClick={handleSend}
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
