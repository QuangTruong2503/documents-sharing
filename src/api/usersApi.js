// src/api/userApi.js
import axiosInstance from './axiosInstance';

const userApi = {
  getAllUsers: () => {
    return axiosInstance.get('/users');
  },
  getUserById: (id) => {
    return axiosInstance.get(`/users/${id}`);
  },
  createUser: (data) => {
    return axiosInstance.post('/users', data);
  },
  updateUser: (id, data) => {
    return axiosInstance.put(`/users/${id}`, data);
  },
  deleteUser: (id) => {
    return axiosInstance.delete(`/users/${id}`);
  },
};

export default userApi;
