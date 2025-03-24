import React from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import config from "../../config/config";
import userApi from "../../api/usersApi";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import Loader from "../../Component/Loaders/Loader";
import { useNavigate } from "react-router-dom";

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
  const [isActing, setIsActing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false); // Thêm state cho loading
  const navigate = useNavigate();
  const handleLoginSuccess = async (response) => {
    const token = response.access_token;
    setIsActing(true);
    setIsLoading(true); // Kích hoạt loading
    try {
      const response = await userApi.loginGoogle(token);
      const data: LoginResponse = response.data;
      if (data.success) {
        toast.success(data.message);
        Cookies.set("token", data.token, { expires: 1 });
        Cookies.set("user", JSON.stringify(data.user), { expires: 1 });
        navigate("/");
      } else {
        toast.warning(data.message);
      }
    } catch (error: any) {
      console.error("Error logging in:", error.response?.data || error.message);
    } finally {
      setIsActing(false);
      setIsLoading(false); // Không cần set false ở đây vì trang sẽ redirect
    }
  };

  const handleLoginFailure = (error) => {
    console.log("Đăng nhập thất bại:", error);
    setIsActing(false);
    setIsLoading(false); // Tắt loading nếu thất bại
  };

  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: handleLoginFailure,
  });

  return (
    <>
      <button
        className={`bg-white flex items-center justify-center gap-4 rounded py-3 shadow-md shadow-gray-300 transition-all ease-in-out duration-200 hover:-translate-y-0.5 ${
          isActing ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => login()}
        disabled={isActing}
      >
        <img
          src={"https://img.icons8.com/color/512/google-logo.png"}
          width={20}
          height={20}
          alt="Google Icon"
          loading="lazy"
        />
        <span className="font-semibold text-blue-500">Google</span>
      </button>

      {/* Giao diện loading toàn trang */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50">
          <Loader />
        </div>
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