import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import userApi from "../../api/usersApi";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import FullPageLoader from "../../Component/Loaders/FullPageLoader";
import { UAParser } from "ua-parser-js";
import { GoogleOAuthProvider } from "@react-oauth/google";
import config from "../../config/config";
function LoginButton() {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleGetDeviceInfo = () => {
    const parser = new UAParser();
    const result = parser.getResult();
    return `${result.device.model || "PC"} | ${result.os.name} ${
      result.os.version
    } | ${result.browser.name}`;
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const idToken = credentialResponse?.credential;

    if (!idToken) {
      toast.error("Không lấy được ID Token từ Google");
      return;
    }

    setLoading(true);

    try {
      const res = await userApi.loginGoogle(
        idToken,
        handleGetDeviceInfo()
      );

      const data = res.data;

      if (data.success) {
        toast.success(data.message);
        Cookies.set("token", data.token, { expires: 3 });
        Cookies.set("user", JSON.stringify(data.user), { expires: 3 });
        navigate("/");
      } else {
        toast.warning(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => toast.error("Đăng nhập Google thất bại")}
        useOneTap={false}
      />

      {loading && (
        <FullPageLoader text="Đang đăng nhập với Google..." />
      )}
    </>
  );
}
function GoogleLoginComponent() {
  return (
    <GoogleOAuthProvider clientId={config.googleClientId || ''}>
      <LoginButton />
    </GoogleOAuthProvider>
  );
}

export default GoogleLoginComponent;