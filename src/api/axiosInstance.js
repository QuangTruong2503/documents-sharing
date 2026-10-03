import { stopNotificationRealtime } from "./notificationRealtime";
// src/api/axiosInstance.js
import axios from 'axios';
import config from 'config/config';
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

let redirecting = false;
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = new URL(error.config?.url || "", window.location.origin).pathname;
    const isPublic = /(?:^|\/)public(?:\/|$)/i.test(path) || /(?:^|\/)s(?:\/|$)/i.test(path);
    const requestToken = error.config?.headers?.Authorization;
    const currentToken = Cookies.get("token");
    if (error.response?.status === 401 && !isPublic && currentToken && requestToken === `Bearer ${currentToken}` && !redirecting) {
      redirecting = true;
      Cookies.remove("token");
      Cookies.remove("user");
      stopNotificationRealtime();
      const redirect = window.location.pathname + window.location.search + window.location.hash;
      window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
