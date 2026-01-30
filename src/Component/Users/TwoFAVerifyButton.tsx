import { useState } from "react";
import { toast } from "react-toastify";
import userApi from "../../api/usersApi";
import OtpModal from "../Modal/OtpModal.tsx";

interface SecuritySettingsProps {
  isTwoFactorEnabled: boolean;
}

export default function SecuritySettings({ isTwoFactorEnabled }: SecuritySettingsProps) {
  const [openOtp, setOpenOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [maskedContact, setMaskedContact] = useState("");
  const [twoFactorMethod, setTwoFactorMethod] =
    useState<"email" | "app">("email");

  // Request enable 2FA
  const handleEnable2FA = async () => {
    if (isTwoFactorEnabled) {
      toast.info("Bảo mật 2FA đã được bật trước đó");
      return;
    }

    try {
      setLoading(true);
      const response = await userApi.requestEnable2FA();

      const {
        success,
        tempToken,
        maskedContact,
        twoFactorMethod,
        message,
      } = response.data;

      if (!success) {
        toast.warning(message || "Không thể bật xác thực 2FA");
        return;
      }

      setTempToken(tempToken);
      setMaskedContact(maskedContact || "");
      setTwoFactorMethod(twoFactorMethod?.toLowerCase() as "email" | "app");
      setOpenOtp(true);

      toast.info(
        "Mã xác thực đã được gửi đến " +
          (maskedContact || "email của bạn")
      );
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "Không thể khởi tạo xác thực 2FA";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };
  // Disable 2FA
  const handleDisable2FA = async () => {
    toast.info("Tính năng tắt 2FA đang được phát triển.");
    // Bạn có thể implement API tắt 2FA tương tự như bật 2FA ở đây
  };
  // Verify OTP
  const handleVerifyOtp = async (otp: string) => {
    if (!tempToken) {
      toast.error("Phiên xác thực không hợp lệ. Vui lòng thử lại.");
      setOpenOtp(false);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        tempToken,
        code: otp,
      };

      const response = await userApi.verify2FASetup(payload);
      const { success, message } = response.data;

      if (success) {
        toast.success(message || "Bật bảo mật 2FA thành công 🎉");
        setOpenOtp(false);
        window.location.reload();
        // 👉 Nên cập nhật lại user state từ component cha / context
        // hoặc reload profile
      } else {
        toast.error(message || "Mã OTP không đúng hoặc đã hết hạn");
      }
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "Xác thực thất bại. Vui lòng thử lại.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
  {/* Enable / Status button */}
  <button
    onClick={handleEnable2FA}
    disabled={loading || isTwoFactorEnabled}
    className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-all
      ${
        isTwoFactorEnabled
          ? "bg-gray-400 cursor-default"
          : loading
          ? "bg-blue-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
      }`}
  >
    {isTwoFactorEnabled ? (
      <>
        2FA đã được kích hoạt
      </>
    ) : loading ? (
      <>
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
        </svg>
        Đang xử lý...
      </>
    ) : (
      <>
        <i className="fa-solid fa-lock"></i>
        Bật xác thực 2FA
      </>
    )}
  </button>

  {/* Disable 2FA */}
  {isTwoFactorEnabled && (
    <button
      onClick={handleDisable2FA} // 👈 bạn sẽ implement API này
      disabled={loading}
      className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      <i className="fa-solid fa-shield-xmark"></i>
      Tắt 2FA
    </button>
  )}

  {/* OTP Modal */}
  <OtpModal
    open={openOtp}
    onClose={() => !loading && setOpenOtp(false)}
    onSubmit={handleVerifyOtp}
    isLoading={loading}
    twoFactorMethod={twoFactorMethod}
    maskedContact={maskedContact}
    tempToken={tempToken}
  />
</div>

  );
}
