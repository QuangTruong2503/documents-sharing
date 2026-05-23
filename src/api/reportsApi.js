import axiosInstance from "./axiosInstance";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );

const reportsApi = {
  getOptions: () => axiosInstance.get("reports/options"),
  getDocumentReportStatus: (documentId) => axiosInstance.get(`reports/document/${documentId}/status`),
  createReport: (data) => axiosInstance.post("reports", data),
  getMyReports: (params) => axiosInstance.get("reports/my", { params: cleanParams(params) }),
  getMyReport: (reportId) => axiosInstance.get(`reports/my/${reportId}`),
  cancelMyReport: (reportId) => axiosInstance.delete(`reports/my/${reportId}`),
};

export default reportsApi;
