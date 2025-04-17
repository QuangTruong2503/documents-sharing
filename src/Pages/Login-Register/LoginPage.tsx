import React, { useEffect, useState } from "react";
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

interface Login {
  email: string;
  password: string;
}
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

function LoginPage() {
  const [loginData, setLoginData] = useState<Login>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const toggleShowPassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const fetchLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActing(true);
    loginData.email = loginData.email.trim();
    try {
      const response = await userApi.postLogin(loginData);
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
    }
  };

  useEffect(() => {
    CheckSigned();
  }, []);

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
              alt="logo"
            />
            <h1 className="text-3xl font-bold text-gray-900">DocShare</h1>
          </a>
          <p className="mt-2 text-sm text-gray-600">
            Chào mừng bạn trở lại! Vui lòng đăng nhập
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white py-8 px-6 shadow-2xl rounded-xl border border-gray-100">
          <form className="space-y-6" onSubmit={fetchLogin}>
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="text"
                name="email"
                id="email"
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="name@gmail.com"
                required
                value={loginData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mật khẩu
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="••••••••"
                required
                value={loginData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <NavLink
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                Quên mật khẩu?
              </NavLink>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isActing}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-all duration-200"
            >
              {isActing ? <LoaderButton /> : "ĐĂNG NHẬP"}
            </button>
          </form>

          {/* Google Login */}
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
            {/* Login other */}
            <div className="grid grid-cols-1 gap-2 my-3">
              <GoogleLoginComponent />
            </div>
          </div>

          {/* Register Link */}
          <p className="mt-2 text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <NavLink
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Đăng ký ngay
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;