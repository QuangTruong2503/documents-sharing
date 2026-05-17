import axiosInstance from "./axiosInstance";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );

const notificationsApi = {
  getNotifications: (params) => axiosInstance.get("notifications", { params: cleanParams(params) }),
  getUnreadCount: () => axiosInstance.get("notifications/unread-count"),
  markAsRead: (notificationId) => axiosInstance.patch(`notifications/${notificationId}/read`),
  markAllAsRead: () => axiosInstance.patch("notifications/read-all"),
  deleteNotification: (notificationId) => axiosInstance.delete(`notifications/${notificationId}`),
};

export default notificationsApi;
