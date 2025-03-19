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