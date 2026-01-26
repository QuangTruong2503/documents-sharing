import React, { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import userApi from "../../api/usersApi";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { CheckSigned } from "../../Helpers/CheckSigned";
import LoaderButton from "../../Component/Loaders/LoaderButton.js";
import PageTitle from "../../Component/PageTitle.js";
import GoogleLoginComponent from "./GoogleLoginComponent.tsx";
import OtpModal from "../../Component/Modal/OtpModal.tsx";
import { UAParser } from "ua-parser-js";

// Interfaces
interface Login {
  email: string;
  password: string;
  userDevice: string;
}

interface LoginResponse {
  message: string;
  success: boolean;
  twofaRequired: boolean;
  token: string;
  user: User;
}

interface TwoFARequiredResponse {
  message: string;
  tempToken: string;
  twoFactorMethod: string;
  maskedContact: string;
}

interface TwoFAVerifyRequest {
  tempToken: string;
  code: string;
}

interface User {
  Email: string;
  FullName: string;
  AvatarUrl: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

function LoginPage() {
  const navigate = useNavigate();

  // States
  const [loginData, setLoginData] = useState<Login>({
    email: "",
    password: "",
    userDevice: "",
  });

  const [twofaRequired, setTwofaRequired] = useState<TwoFARequiredResponse>({
    message: "",
    tempToken: "",
    twoFactorMethod: "",
    maskedContact: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [isTwoFARequired, setIsTwoFARequired] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Lấy thông tin thiết bị
  const getDeviceInfo = useCallback((): string => {
    try {
      const parser = new UAParser();
      const result = parser.getResult();
      const deviceName = result.device.model || "PC";
      const osInfo = `${result.os.name || "Unknown"} ${result.os.version || ""}`.trim();
      const deviceInfo = `${deviceName} - ${osInfo}`;
      
      console.log("Device Info:", deviceInfo);
      return deviceInfo;
    } catch (error) {
      console.error("Error getting device info:", error);
      return "Unknown Device";
    }
  }, []);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setLoginData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Clear email error when user types
    if (name === "email" && emailError) {
      setEmailError("");
    }
  };

  // Toggle password visibility
  const toggleShowPassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  // Handle login form submission
  const fetchLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  const trimmedEmail = loginData.email.trim();
  if (!validateEmail(trimmedEmail)) {
    setEmailError("Vui lòng nhập địa chỉ email hợp lệ");
    return;
  }

  setIsActing(true);

  try {
    const payload: Login = {
      email: trimmedEmail,
      password: loginData.password,
      userDevice: loginData.userDevice,
    };

    const response = await userApi.postLogin(payload);
    const data = response.data;

    // Sửa ở đây: dùng đúng key từ backend
    if (data.require2FA === true) {
      setTwofaRequired({
        message: data.message || "Vui lòng xác thực 2FA",
        tempToken: data.tempToken || "",
        twoFactorMethod: data.twoFactorMethod || "email",
        maskedContact: data.maskedContact || "",
      });
      setIsTwoFARequired(true);
    } else if (data.success === true && data.isLogin === true) {
      toast.success(data.message || "Đăng nhập thành công");
      Cookies.set("token", data.token, { expires: 3, secure: true, sameSite: "strict" });
      Cookies.set("user", JSON.stringify(data.user), { expires: 3, secure: true, sameSite: "strict" });
      navigate("/");
    } else {
      toast.warning(data.message || "Đăng nhập không thành công");
    }
  } catch (error) {
      const apiError = error as ApiErrorResponse;
      console.error("Error logging in:", apiError.response?.data || apiError.message);
      
      const errorMessage = 
        apiError.response?.data?.message || 
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin";
      
      toast.error(errorMessage);
    } finally {
      setIsActing(false);
    }
  };

  // Handle OTP submission
  const handleOtpSubmit = async (otpCode: string) => {
    if (!otpCode || otpCode.length < 6) {
      toast.error("Vui lòng nhập mã OTP hợp lệ");
      return;
    }

    setIsActing(true);

    try {
      const payload: TwoFAVerifyRequest = {
        tempToken: twofaRequired.tempToken,
        code: otpCode,
      };

      const response = await userApi.verifyTwoFA(payload);
      const data: LoginResponse = response.data;

      if (data.success) {
        Cookies.set("token", data.token, { expires: 3, secure: true, sameSite: 'strict' });
        Cookies.set("user", JSON.stringify(data.user), { expires: 3, secure: true, sameSite: 'strict' });
        setIsTwoFARequired(false);
        navigate("/");
      } else {
        toast.error(data.message || "Xác thực không thành công");
      }
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      console.error("Error verifying OTP:", apiError.response?.data || apiError.message);
      
      const errorMessage = 
        apiError.response?.data?.message || 
        "Xác thực OTP thất bại. Vui lòng thử lại";
      
      toast.error(errorMessage);
    } finally {
      setIsActing(false);
    }
  };

  // Handle OTP modal close
  const handleOtpClose = () => {
    setIsTwoFARequired(false);
    setTwofaRequired({
      message: "",
      tempToken: "",
      twoFactorMethod: "",
      maskedContact: "",
    });
  };

  // Initialize on component mount
  useEffect(() => {
    CheckSigned();
    
    // Set device info once on mount
    const deviceInfo = getDeviceInfo();
    setLoginData((prev) => ({
      ...prev,
      userDevice: deviceInfo,
    }));
  }, [getDeviceInfo]);
  useEffect(() => {
    console.log(isTwoFARequired)
  }, [isTwoFARequired]);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <PageTitle
        title="Đăng nhập"
        description="Đăng nhập vào hệ thống chia sẻ tài liệu"
      />

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <a href="/" className="flex justify-center items-center gap-2">
            <img
              className="h-10 w-10"
              src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg"
              alt="DocShare Logo"
            />
            <h1 className="text-3xl font-bold text-gray-900">DocShare</h1>
          </a>
          <p className="mt-2 text-sm text-gray-600">
            Chào mừng bạn trở lại! Vui lòng đăng nhập
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white py-8 px-6 shadow-2xl rounded-xl border border-gray-100">
          <form className="space-y-6" onSubmit={fetchLogin} noValidate>
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                className={`mt-1 block w-full px-4 py-3 rounded-lg border ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                placeholder="name@gmail.com"
                required
                value={loginData.email}
                onChange={handleChange}
                aria-invalid={emailError ? "true" : "false"}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && (
                <p id="email-error" className="mt-1 text-sm text-red-500">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  className="block w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={loginData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  tabIndex={0}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <NavLink
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:underline"
              >
                Quên mật khẩu?
              </NavLink>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isActing}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200"
              aria-busy={isActing}
            >
              {isActing ? <LoaderButton /> : "ĐĂNG NHẬP"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 my-2">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            {/* Google Login */}
            <div className="grid grid-cols-1 gap-2 my-3">
              <GoogleLoginComponent />
            </div>
          </div>

          {/* Register Link */}
          <p className="mt-2 text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <NavLink
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:underline"
            >
              Đăng ký ngay
            </NavLink>
          </p>
        </div>
      </div>

      {/* OTP Modal - Rendered outside main container */}
      <OtpModal
        open={isTwoFARequired}
        onClose={handleOtpClose}
        onSubmit={handleOtpSubmit}
        tempToken={twofaRequired.tempToken}
        isLoading={isActing}
        twoFactorMethod={twofaRequired.twoFactorMethod}
        maskedContact={twofaRequired.maskedContact}
      />
    </div>
  );
}

export default LoginPage;