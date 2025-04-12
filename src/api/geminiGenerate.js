import axiosInstance from "./axiosInstance";

const categoriesAPI = {
    getSummarizeDocument: (documentId) => {
        return axiosInstance.get(`public/gemini/document-summary?documentId=${documentId}`);
    },
    

}
export default categoriesAPI;