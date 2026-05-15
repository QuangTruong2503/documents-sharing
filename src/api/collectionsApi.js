import axiosInstance from "./axiosInstance";
import Cookies from "js-cookie";

const collectionsApi = {
    getMyCollection: () =>{
        const authToken = Cookies.get("token");
        return axiosInstance.get('Collections/my-collections', {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });
    },
    postCreateCollection: (collection) =>{
        const authToken = Cookies.get("token");
        return axiosInstance.post('Collections/create-collection', collection , {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            }
        });
    },
    updateCollection: (id, collection) =>{
        const authToken = Cookies.get("token");
        return axiosInstance.put(`Collections/update/${id}`, collection , {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            }
        });
    },
    getCollectionDetail: (id) => {
        const authToken = Cookies.get("token");
        return axiosInstance.get(`Collections/${id}`, {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });
    },
    addDocumentToCollection: (collectionId, documentId) => {
        const authToken = Cookies.get("token");
        return axiosInstance.post(`Collections/${collectionId}/documents`, {
            document_id: documentId
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            }
        });
    },
    removeDocumentFromCollection: (collectionId, documentId) => {
        const authToken = Cookies.get("token");
        return axiosInstance.delete(`Collections/${collectionId}/documents/${documentId}`, {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });
    },
    deleteCollection: (id) => {
        const authToken = Cookies.get("token");
        return axiosInstance.delete(`Collections/delete?id=${id}` , {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });
    }
}
export default collectionsApi;
