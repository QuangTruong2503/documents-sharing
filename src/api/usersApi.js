// src/api/userApi.js
import axiosInstance from './axiosInstance';

const userApi = {
  //Lấy tất cả người dùng
  getAllUsers: () => {
    return axiosInstance.get('/Users');
  },
  getUserById: (userID) => {
    return axiosInstance.get(`/Users/my-profile?userID=${userID}`);
  },
  postLogin: (data) => {
    return axiosInstance.post('/Users/request-login', data);
  },
  postRegister: (data) =>{
    return axiosInstance.post('/Users/request-register', data);
  },
  verifyToken: (token) =>{
    return axiosInstance.get(`Users/verify-token/${token}`)
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
