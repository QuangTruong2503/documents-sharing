import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import userApi from "../../api/usersApi";

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  isLoading?: boolean;
  twoFactorMethod?: string;
  tempToken?: string;
  maskedContact?: string;
}

const OTP_LENGTH = 6;

const OtpModal: React.FC<OtpModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  twoFactorMethod = "email",
  tempToken = "",
  maskedContact = "",
}) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string>("");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0); // giây

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setOtp(Array(OTP_LENGTH).fill(""));
      setError("");
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    }
  }, [open]);
  // Timer countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);
  // Validate OTP
  const validateOtp = (code: string): boolean => {
    if (code.length !== OTP_LENGTH) {
      setError("Mã OTP phải có đủ 6 chữ số");
      return false;
    }
    if (!/^\d+$/.test(code)) {
      setError("Mã OTP chỉ được chứa số");
      return false;
    }
    return true;
  };

  // Handle input change
  const handleChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d?$/.test(value)) return;

    // Clear error when user starts typing
    if (error) setError("");

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every((d) => d !== "")) {
      const code = newOtp.join("");
      if (validateOtp(code)) {
        handleSubmit(code);
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (error) setError("");

    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputsRef.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === OTP_LENGTH && validateOtp(code)) {
        handleSubmit(code);
      }
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const digits = pastedData.replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (digits.length > 0) {
      const newOtp = Array(OTP_LENGTH).fill("");
      digits.split("").forEach((digit, index) => {
        if (index < OTP_LENGTH) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);

      // Focus appropriate input
      const nextEmptyIndex = newOtp.findIndex((d) => d === "");
      const focusIndex =
        nextEmptyIndex === -1 ? OTP_LENGTH - 1 : nextEmptyIndex;
      inputsRef.current[focusIndex]?.focus();

      // Auto-submit if complete
      if (newOtp.every((d) => d !== "")) {
        const code = newOtp.join("");
        if (validateOtp(code)) {
          handleSubmit(code);
        }
      }
    }
  };

  // Handle submit
  const handleSubmit = (code: string) => {
    if (!validateOtp(code)) return;
    onSubmit(code);
  };
  // Handle resend
  const handleResend = async () => {
    if (resendDisabled) return;

    setResendDisabled(true);

    try {
      const payload = { tempToken: tempToken }; // từ parent component

      // Gọi API resend (bạn cần thêm method này vào userApi)
      const response = await userApi.resend2FA(payload);
      const data = response.data;

      if (data.success) {
        toast.success("Mã mới đã được gửi!");
        setCountdown(60); // hoặc lấy từ data.nextResendIn
      } else {
        toast.error(data.message || "Không thể gửi lại mã");
        setResendDisabled(false);
      }
    } catch (error) {
      toast.error("Lỗi khi gửi lại mã. Vui lòng thử lại.");
      setResendDisabled(false);
    }
  };
  // Handle manual submit button click
  const handleManualSubmit = () => {
    const code = otp.join("");
    if (validateOtp(code)) {
      handleSubmit(code);
    }
  };

  // Handle input focus
  const handleFocus = (index: number) => {
    inputsRef.current[index]?.select();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  // Get method display text
  const getMethodText = () => {
    switch (twoFactorMethod?.toLowerCase()) {
      case "email":
        return "email";
      case "sms":
        return "số điện thoại";
      case "app":
        return "ứng dụng xác thực";
      default:
        return "email";
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-modal-title"
    >
      <div className="w-full max-w-md mx-4 animate-in zoom-in-95 duration-200 rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 id="otp-modal-title" className="text-2xl font-bold text-gray-900">
            Xác thực hai bước
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Mã gồm 6 chữ số đã được gửi đến {getMethodText()}
            {maskedContact && (
              <span className="block font-medium text-gray-700 mt-1">
                {maskedContact}
              </span>
            )}
          </p>
        </div>
        {/* OTP Input Fields */}
        <div className="mt-8">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((value, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                onFocus={() => handleFocus(index)}
                disabled={isLoading}
                aria-label={`Chữ số ${index + 1} của 6`}
                className={`
                  h-12 w-12 sm:h-14 sm:w-14 rounded-lg border-2 text-center text-xl font-bold
                  transition-all duration-200
                  ${
                    value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-900"
                  }
                  ${error ? "border-red-500 bg-red-50" : ""}
                  ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30
                  hover:border-blue-400
                  disabled:bg-gray-100 disabled:text-gray-400
                `}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 animate-in fade-in slide-in-from-top-2 duration-200"
              role="alert"
            >
              <p className="text-sm text-red-600 text-center font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="font-medium">Đang xác thực...</span>
            </div>
          )}
        </div>
        {/* Action Buttons */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Hủy
          </button>
          <button
            onClick={handleManualSubmit}
            disabled={isLoading || otp.some((d) => d === "")}
            className="flex-1 rounded-lg px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? "Đang xử lý..." : "Xác thực"}
          </button>
        </div>
        {/* Resend Code Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Không nhận được mã?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendDisabled || isLoading}
              className={`font-medium ${
                resendDisabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-800"
              } transition-colors duration-200 focus:outline-none focus:underline`}
            >
              {resendDisabled ? `Gửi lại sau ${countdown}s` : "Gửi lại mã"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;
