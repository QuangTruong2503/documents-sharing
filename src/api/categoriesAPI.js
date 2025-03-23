import axiosInstance from "./axiosInstance";

const categoriesAPI = {
    getAll: () => {
        return axiosInstance.get("Categories/public/get-all-categories");
    },
    getBySearch: (search) => {
        return axiosInstance.get(`Categories/public/search-category?search=${search}`);
    },

}
export default categoriesAPI;