import axiosInstance from "./axiosInstance";

const verificationsApi = {
    generateVerifyEmailToken: (email) => {
        return axiosInstance.post('Verification/public/generate-verify-email-token',  email , {
            headers: {
                "Content-Type": "application/json"
            }
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
