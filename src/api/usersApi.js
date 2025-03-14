// src/api/userApi.js
import axiosInstance from './axiosInstance';
import Cookies from 'js-cookie'

const userApi = {
  //Lấy tất cả người dùng
  getAllUsers: () => {
    return axiosInstance.get('/Users');
  },
  getUserById: () => {
    const authToken = Cookies.get("token");
    return axiosInstance.get(`/Users/my-profile`, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
  },
  postLogin: (data) => {
    return axiosInstance.post('/Users/request-login', data);
  },
  postRegister: (data) =>{
    return axiosInstance.post('/Users/request-register', data);
  },
  createUser: (data) => {
    return axiosInstance.post('/Users', data);
  },
  updateImage: (image, userID) => {
    return axiosInstance.put(`Users/update-image?userID=${userID}`, image, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  
  },
  updateUser: (data) => {
    return axiosInstance.put(`/Users/update-user`, data);
  },
  deleteUser: (id) => {
    return axiosInstance.delete(`/Users/${id}`);
  },
};

export default userApi;
