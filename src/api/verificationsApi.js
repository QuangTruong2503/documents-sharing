import axiosInstance from "./axiosInstance";
import Cookies from 'js-cookie';
const verificationsApi = {
    //Kiểm tra Người dùng đã xác thực email chưa
    checkUserVerified: () => {
        return axiosInstance.get('Verification/check-user-verified', {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Cookies.get('token')}`
            }
        });
    },
    //Tạo mã xác thực email
    generateVerifyEmailToken: (email) => {
        return axiosInstance.post('Verification/public/generate-verify-email-token',  email , {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Cookies.get('token')}`
            },
            
        });
    },
    //Gửi mã xác thực email
    verifyEmailToken: (token) => {
        return axiosInstance.get(`Verification/public/verify-email?token=${token}`, {
            headers: {
                "Content-Type": "application/json"
            },
        });
    },
    //tạo mã xác thực reset password
    generateResetPasswordToken: (email) => {
        return axiosInstance.post(`Verification/public/generate-reset-password-token`, email , {
            headers: {
                "Content-Type": "application/json"
            },
        });
    },
    //xác thực mã reset password
    verifyResetPasswordToken: (token) => {
        return axiosInstance.post(`Verification/public/verify-reset-password-token`, token , {
            headers: {
                "Content-Type": "application/json"
            },
        });
    },
    //đổi mật khẩu sau khi xác thực mã reset password
    changePassword: (data) => {
        return axiosInstance.post(`Verification/public/change-password`, data , {
            headers: {
                "Content-Type": "application/json"
            },
        });
    }
};

export default verificationsApi;
