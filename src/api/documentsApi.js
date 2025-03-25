import axiosInstance from "./axiosInstance";
import Cookies from "js-cookie";

const documentsApi = {
  //read document by id
  getDocumentByID: (documentID) => {
    const authToken = Cookies.get("token");
    return axiosInstance.get(`Documents/public/document/${documentID}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  },
  //Lấy dữ liệu theo tim kiếm
  getSearchDocuments: (search) =>{
    return axiosInstance.get(`Documents/public/search-documents?search=${search}`);
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
  postDocument: (file) => {
    const authToken = Cookies.get("token");
    return axiosInstance.post("Documents/upload-document", file, {
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
  deleteDocumentByID: (docID) => {
    const authToken = Cookies.get("token");
    return axiosInstance.delete(
      `Documents/delete-document?documentID=${docID}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
  },
  //API tải xuống tài liệu
  downloadDocumentByID: (documentID) => {
    const authToken = Cookies.get("token");
    return axiosInstance.get(`Documents/download-document/${documentID}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  },
};
export default documentsApi;
