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
    return axiosInstance.post('/Users/public/request-login', data);
  },
  loginGoogle: (token) => {
    return axiosInstance.post('/Users/public/request-login-google', token);
  },
  postLogout: (token) => {
    return axiosInstance.post('/Users/request-logout', token);
  },
  postRegister: (data) =>{
    return axiosInstance.post('/Users/public/request-register', data);
  },
  createUser: (data) => {
    return axiosInstance.post('/Users', data);
  },
  updateImage: (image) => {
    const authToken = Cookies.get("token");
    return axiosInstance.put(`Users/update-image`, image, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${authToken}`
      },
    });
  
  },
  updateUser: (data) => {
    const authToken = Cookies.get("token")
    return axiosInstance.put(`/Users/update-user`, data, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
  },
  deleteUser: (id) => {
    return axiosInstance.delete(`/Users/${id}`);
  },
};

export default userApi;
