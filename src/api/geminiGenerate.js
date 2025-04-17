import axiosInstance from "./axiosInstance";

const geminiGenerate = {
    getSummarizeDocument: (documentId) => {
        return axiosInstance.get(`public/gemini/document-summary?documentId=${documentId}`);
    },
    postGeminiChat: (message) => {
        return axiosInstance.post(`public/gemini/chat`, message, {
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

}
export default geminiGenerate;