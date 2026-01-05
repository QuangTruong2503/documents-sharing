import React from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import config from "../../config/config";
import userApi from "../../api/usersApi";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import FullPageLoader from "../../Component/Loaders/FullPageLoader";
import { UAParser } from "ua-parser-js";

interface LoginResponse {
  message: string;
  success: boolean;
  token: string;
  user: User;
}

interface User {
  Email: string;
  FullName: string;
  AvatarUrl: string;
}

function LoginButton() {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleGetDeviceInfo = () => {
    const parser = new UAParser();
    const result = parser.getResult();

    return `${result.device.model || "PC"} | ${
      result.os.name
    } ${result.os.version} | ${result.browser.name}`;
  };

  const handleLoginSuccess = async (googleResponse: any) => {
    if (!googleResponse?.access_token) {
      toast.error("Không lấy được token Google");
      return;
    }

    const token = googleResponse.access_token;
    const userDevice = handleGetDeviceInfo();
    setLoading(true);

    try {
      const apiResponse = await userApi.loginGoogle(token, userDevice);
      const data: LoginResponse = apiResponse.data;

      if (data.success) {
        toast.success(data.message);
        Cookies.set("token", data.token, { expires: 3 });
        Cookies.set("user", JSON.stringify(data.user), { expires: 3 });
        navigate("/");
      } else {
        toast.warning(data.message);
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error("Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: () => {
      toast.error("Đăng nhập Google thất bại");
      setLoading(false);
    },
    prompt: "select_account",
  });

  return (
    <>
      <button
        onClick={() => login()}
        disabled={loading}
        className={`bg-white flex items-center justify-center gap-4 rounded-lg py-3
          shadow-md border transition-all duration-200
          ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
      >
        <img
          src="https://img.icons8.com/color/512/google-logo.png"
          width={20}
          height={20}
          alt="Google"
        />
        <span className="font-semibold text-blue-500">Google</span>
      </button>

      {loading && (
        <FullPageLoader text="Đang đăng nhập với tài khoản Google..." />
      )}
    </>
  );
}


function GoogleLoginComponent() {
  const clientId = config.googleClientId;
  return (
    <GoogleOAuthProvider clientId={clientId ? clientId : ""}>
      <LoginButton />
    </GoogleOAuthProvider>
  );
}

export default GoogleLoginComponent;