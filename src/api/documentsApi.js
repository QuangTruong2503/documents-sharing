import axiosInstance from "./axiosInstance";
import Cookies from "js-cookie";

const authHeaders = () => {
  const authToken = Cookies.get("token");
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
};

const documentsApi = {
  //read document by id
  getDocumentByID: (documentID) => {
    return axiosInstance.get(`public/document/${documentID}`, {
      headers: authHeaders(),
    });
  },
  //Lấy dữ liệu theo tim kiếm
  getSearchDocuments: (search, pageNumber, pageSize) =>{
    return axiosInstance.get(`public/search-documents?search=${search}&PageNumber=${pageNumber}&PageSize=${pageSize}`);
  },
  //Lấy dữ liệu theo tim kiếm
  getDocumentsByCategory: (categoryID, pageNumber, pageSize) =>{
    return axiosInstance.get(`public/documents-by-category?categoryID=${categoryID}&PageNumber=${pageNumber}&PageSize=${pageSize}`);
  },
  //Lấy dữ liệu theo lịch sử truy cập
  getDocumentsByHistory: (documentHistory) =>{
    return axiosInstance.post(`public/history-documents`, documentHistory, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
  // read documents uploaded by user
  getMyUploadedDocument: (params) => {
    const authToken = Cookies.get("token");
    const queryParams = new URLSearchParams({
      pageNumber: params.pageNumber || 1,
      sortBy: params.sortBy || "date", // Default sort by date
      ...(params.isPublic !== null &&
        params.isPublic !== undefined && { isPublic: params.isPublic }),
    }).toString();

    return axiosInstance.get(`Documents/my-uploaded-documents?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  },
  //upload document
  postDocument: (file, folderId) => {
    const authToken = Cookies.get("token");
    const endpoint = folderId
      ? `folders/${folderId}/upload-document`
      : "Documents/upload-document";

    return axiosInstance.post(endpoint, file, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${authToken}`,
      },
    });
  },
  //Cập nhật tài liệu sau khi tải lên
  putDocumentUpdateTitle: (data) => {
    const authToken = Cookies.get("token");
    return axiosInstance.put("Documents/update-document-after-upload", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
  },
  //Cập nhật tài liệu với ID
    putDocumentUpdate: (data) => {
        const authToken = Cookies.get("token");
        return axiosInstance.put("Documents/update-document", data, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        });
    },
  deleteDocuments: (documentIds) => {
    const authToken = Cookies.get("token");
    return axiosInstance.delete("Documents/delete-document", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        document_ids: documentIds.map(Number),
      },
    });
  },
  deleteDocumentByID: (docID) => {
    return documentsApi.deleteDocuments([docID]);
  },
  //API tải xuống tài liệu
  downloadDocumentByID: (documentID) => {
    const authToken = Cookies.get("token");
    return axiosInstance.get(`Documents/download-document/${documentID}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        
      },
      responseType: "blob", // Set response type to blob for file download
    });
  },
  // API cập nhật trạng thái lượt thích tài liệu
  updateDocumentLikeStatus: (documentID, reaction) => {
    const authToken = Cookies.get("token");
    return axiosInstance.post(`Likes/reaction?documentId=${documentID}&reaction=${reaction}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  },
};
export default documentsApi;
