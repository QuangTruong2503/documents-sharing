import axiosInstance from "./axiosInstance";

const categoriesAPI = {
    getAll: () => {
        return axiosInstance.get("public/get-all-categories");
    },
    getBySearch: (search) => {
        return axiosInstance.get(`public/search-category?search=${search}`);
    },
    getCategoryTree: () => {
        return axiosInstance.get("public/get-category-tree");
    }

}
export default categoriesAPI;