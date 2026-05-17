// src/api/userApi.js
import axiosInstance from './axiosInstance';
import Cookies from 'js-cookie'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );

const userApi = {
  getUserById: () => {
    const authToken = Cookies.get("token");
    return axiosInstance.get(`/Users/my-profile`, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
  },
  getPublicProfile: (userID) => {
    return axiosInstance.get(`/public/profile/${userID}`);
  },
  getFollowRelation: (followerID, followingID) => {
    return axiosInstance.get(`/public/follows/${followerID}/${followingID}`);
  },
  getFollowStatus: (userID) => {
    return axiosInstance.get(`/public/follows/status/${userID}`);
  },
  followUser: (followingID) => {
    return axiosInstance.post(`/follows/${followingID}`);
  },
  unfollowUser: (followingID) => {
    return axiosInstance.delete(`/follows/${followingID}`);
  },
  removeFollower: (followerID) => {
    return axiosInstance.delete(`/follows/followers/${followerID}`);
  },
  getPublicFollowers: (userID, params) => {
    return axiosInstance.get(`/public/users/${userID}/followers`, { params: cleanParams(params) });
  },
  getPublicFollowing: (userID, params) => {
    return axiosInstance.get(`/public/users/${userID}/following`, { params: cleanParams(params) });
  },
  getPublicDocuments: (userID, params) => {
    return axiosInstance.get(`/public/users/${userID}/documents`, { params: cleanParams(params) });
  },
  getPublicCollections: (userID, params) => {
    return axiosInstance.get(`/public/users/${userID}/collections`, { params: cleanParams(params) });
  },
  getPublicCollectionDetail: (collectionID, params) => {
    return axiosInstance.get(`/public/collections/${collectionID}`, { params: cleanParams(params) });
  },
  postLogin: (data) => {
    return axiosInstance.post('/Users/public/request-login', data);
  },
  loginGoogle: (token, userDevice) => {
    return axiosInstance.post('/Users/public/request-login-google', { token, userDevice });
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
    return axiosInstance.put(`Users/update-avatar`, image, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${authToken}`
      },
    });
  
  },
  updateUser: (data) => {
    const authToken = Cookies.get("token")
    return axiosInstance.put(`/Users/update-profile`, data, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
  },
  deleteUser: (id) => {
    return axiosInstance.delete(`/Users/${id}`);
  },
  verifyTwoFA: (data) => {
    return axiosInstance.post('/Users/public/verify-2fa-login', data, {
      headers: {
        "Content-Type": `application/json`,
      }
    });
  },
  resend2FA: (data) => {
    return axiosInstance.post('/Users/public/resend-2fa', data, {
      headers: {
        "Content-Type": `application/json`,
      }
    });
  },
  requestEnable2FA: (data) => {
    const authToken = Cookies.get("token");
    return axiosInstance.post('/Users/request-enable-2fa', data, {
      headers: {
        "Content-Type": `application/json`,
        "Authorization": `Bearer ${authToken}`
      }
    });
  },
  requestDisable2FA: (data) => {
    const authToken = Cookies.get("token");
    return axiosInstance.post('/Users/request-disable-2fa', data, {
      headers: {
        "Content-Type": `application/json`,
        "Authorization": `Bearer ${authToken}`
      }
    });
  },
  verify2FASetup: (data) => {
    const authToken = Cookies.get("token");
    return axiosInstance.post('/Users/request-verify-2fa-setup', data, {
      headers: {
        "Content-Type": `application/json`,
        "Authorization": `Bearer ${authToken}`
      }
    });
  }
};

export default userApi;
