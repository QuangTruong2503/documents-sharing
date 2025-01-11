// src/api/userApi.js
import axiosInstance from './axiosInstance';

const userApi = {
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
  createUser: (data) => {
    return axiosInstance.post('/Users', data);
  },
  updateUser: (id, data) => {
    return axiosInstance.put(`/Users/${id}`, data);
  },
  deleteUser: (id) => {
    return axiosInstance.delete(`/Users/${id}`);
  },
};

export default userApi;
