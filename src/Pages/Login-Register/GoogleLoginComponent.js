  import React from "react";
  import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import config from "../../config/config";

  // Inner component that uses the hook
  function LoginButton() {
    const handleLoginSuccess = (response) => {
      console.log("Đăng nhập thành công:", response);
      // Xử lý token hoặc thông tin người dùng tại đây
    };

    const handleLoginFailure = (error) => {
      console.log("Đăng nhập thất bại:", error);
    };

    const login = useGoogleLogin({
      onSuccess: handleLoginSuccess,
      onError: handleLoginFailure, // Use onError instead of onFailure
    });

    return (
      <button
        className="flex items-center justify-center gap-4 rounded py-3 shadow-md shadow-gray-300 transition-all ease-in-out duration-200 hover:-translate-y-0.5"
        onClick={() => login()}
      >
        <img
          src={"https://img.icons8.com/color/512/google-logo.png"}
          width={20}
          height={20}
          alt="Google Icon"
          loading="lazy" // Tối ưu tải hình ảnh
        />
        <span className="font-semibold text-blue-500">Google</span>
      </button>
    );
  }

  // Outer component that provides the OAuth context
  function GoogleLoginComponent() {
    return (
      <GoogleOAuthProvider clientId={config.googleClientId}>
        <LoginButton />
      </GoogleOAuthProvider>
    );
  }

  export default GoogleLoginComponent;
