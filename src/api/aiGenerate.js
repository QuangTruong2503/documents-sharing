import axiosInstance from "./axiosInstance";
const aiGenerate = {
  getSummarizeDocument: (documentId, signal) =>
    axiosInstance.get("public/ai/document-summary", {
      params: { documentId },
      signal,
    }),
  postChat: (message, signal) =>
    axiosInstance.post("public/ai/chat", { message }, { signal }),
};
export default aiGenerate;
