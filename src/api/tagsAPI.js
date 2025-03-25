import axiosInstance from "./axiosInstance";

const tagsAPI = {
    getAll: () => {
        return axiosInstance.get("Tags/public/get-all-tags");
    },
    getBySearch: (search) => {
        return axiosInstance.get(`Tags/public/search-tags?search=${search}`);
    },

}
export default tagsAPI;