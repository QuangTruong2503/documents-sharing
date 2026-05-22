import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import userApi from "api/usersApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import FullPageLoader from "components/Loaders/FullPageLoader";
import { GoogleOAuthProvider } from "@react-oauth/google";
import config from "config/config";
import { normalizeAuthResponse } from "utils/userMapper";
import { getDeviceInfo, saveAuthSession } from "utils/authSession";

interface TwoFARequiredData {
  message: string;
  tempToken: string;
  twoFactorMethod: string;
  maskedContact: string;
}

interface LoginButtonProps {
  onTwoFARequired?: (data: TwoFARequiredData) => void;
}

function LoginButton({ onTwoFARequired }: LoginButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const idToken = credentialResponse?.credential;

    if (!idToken) {
      toast.error("Không lấy được ID Token từ Google");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const res = await userApi.loginGoogle(
        idToken,
        getDeviceInfo()
      );

      const data = normalizeAuthResponse(res.data);

      if (data.require2FA === true) {
        onTwoFARequired?.({
          message: data.message || "Vui lòng xác thực 2FA",
          tempToken: data.tempToken || "",
          twoFactorMethod: data.twoFactorMethod || "email",
          maskedContact: data.maskedContact || "",
        });
        toast.info(data.message || "Vui lòng xác thực 2FA");
      } else if (data.success && data.token && data.user) {
        toast.success(data.message || "Đăng nhập Google thành công");
        saveAuthSession({ token: data.token, user: data.user });
        navigate("/");
      } else {
        toast.warning(data.message || "Đăng nhập Google không thành công");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Đăng nhập Google thất bại");
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

interface GoogleLoginComponentProps {
  onTwoFARequired?: (data: TwoFARequiredData) => void;
}

function GoogleLoginComponent({ onTwoFARequired }: GoogleLoginComponentProps) {
  if (!config.googleClientId) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
        Chưa cấu hình Google Client ID.
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={config.googleClientId}>
      <LoginButton onTwoFARequired={onTwoFARequired} />
    </GoogleOAuthProvider>
  );
}

export default GoogleLoginComponent;
