import axiosInstance from "./axiosInstance";
import Cookies from 'js-cookie';
const verificationsApi = {
    generateVerifyEmailToken: (email) => {
        return axiosInstance.post('Verification/generate-verify-email-token',  email , {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Cookies.get('token')}`
            },
            
        });
    },
    verifyEmailToken: (token) => {
        return axiosInstance.post(`Verification/public/verify-email-token`, token , {
            headers: {
                "Content-Type": "application/json"
            },
        });
    }
};

export default verificationsApi;
