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
import Modal from "components/Workspace/dialogs/Modal";

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
  const busy = React.useRef(false);
  const [pendingToken, setPendingToken] = React.useState<string | null>(null);
  const [linkPassword, setLinkPassword] = React.useState("");
  const closeLink = () => {
    if (!busy.current) {
      setPendingToken(null);
      setLinkPassword("");
    }
  };
  const navigate = useNavigate();

  const handleGoogleSuccess = async (
    credentialResponse: any,
    password?: string,
  ) => {
    const idToken = credentialResponse?.credential;

    if (!idToken) {
      toast.error("Không lấy được ID Token từ Google");
      return;
    }

    if (busy.current) return;
    busy.current = true;
    setLoading(true);

    try {
      const res = await userApi.loginGoogle(idToken, getDeviceInfo(), password);

      const data = normalizeAuthResponse(res.data);
      setPendingToken(null);
      setLinkPassword("");

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
        saveAuthSession({
          token: data.token,
          user: data.user,
          expiresIn: data.expiresIn,
        });
        navigate("/");
      } else {
        toast.warning(data.message || "Đăng nhập Google không thành công");
      }
    } catch (err: any) {
      if (
        err?.response?.data?.code === "GOOGLE_LINK_CONFIRMATION_REQUIRED" &&
        !password
      ) {
        setPendingToken(idToken);
      } else
        toast.error(
          err?.response?.data?.message || "Đăng nhập Google thất bại",
        );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <GoogleLogin
        onSuccess={(response) => handleGoogleSuccess(response)}
        onError={() => toast.error("Đăng nhập Google thất bại")}
        useOneTap={false}
      />
      {pendingToken !== null && (
        <Modal
          onClose={closeLink}
          busy={loading}
          label="Liên kết tài khoản Google"
        >
          <form
            className="w-full space-y-4 rounded-xl bg-surface p-5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleGoogleSuccess(
                { credential: pendingToken },
                linkPassword,
              );
            }}
          >
            <h2 className="text-lg font-semibold">Liên kết tài khoản Google</h2>
            <p className="text-sm text-ink-secondary">
              Email này đã có tài khoản. Nhập mật khẩu hiện tại để xác nhận liên
              kết; tài khoản bật 2FA vẫn cần mã xác thực. Nếu trước đây chỉ đăng
              nhập Google, hãy đặt mật khẩu qua chức năng Quên mật khẩu trước.
            </p>
            <label className="block text-sm">
              Mật khẩu hiện tại
              <input
                type="password"
                autoComplete="current-password"
                className="input-field mt-2 w-full"
                value={linkPassword}
                onChange={(event) => setLinkPassword(event.target.value)}
                disabled={loading}
                required
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                disabled={loading}
                onClick={closeLink}
              >
                Hủy
              </button>
              <button className="btn-primary" disabled={loading}>
                {loading ? "Đang xác minh…" : "Xác nhận liên kết"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {loading && <FullPageLoader text="Đang đăng nhập với Google..." />}
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
