import axiosInstance from "./axiosInstance";
import Cookies from 'js-cookie'

const documentsApi = {
    //read documents uploaded by user
    getMyUploadedDocument:() =>{
        const authToken = Cookies.get("token")
        return axiosInstance.get('Documents/my-uploaded-documents', {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });
    },
    //upload document
    postDocument: (file) =>{
        const authToken = Cookies.get("token");
        return axiosInstance.post('Documents/upload-document', file, {
            headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${authToken}`,
            }
        });
    },
    putDocumentUpdateTitle: (data) =>{
        const authToken = Cookies.get("token");
        return axiosInstance.put('Documents/update-title-description', data, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
            }
        });
    }
}
export default documentsApi;