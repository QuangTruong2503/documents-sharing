// src/api/axiosInstance.js
import axios from 'axios';
import config from '../config/config';
import Cookies from 'js-cookie';
const axiosInstance = axios.create({
  baseURL: config.apiUrl, // Thay bằng URL API của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors if needed
axiosInstance.interceptors.request.use(
  (config) => {
    // Thêm token vào headers nếu cần
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
