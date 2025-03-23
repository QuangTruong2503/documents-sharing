import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import userApi from "../../api/usersApi";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import {CheckSigned} from "../../Helpers/CheckSigned";
import LoaderButton from "../../Component/Loaders/LoaderButton.js";
import PageTitle from "../../Component/PageTitle.js";
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Toggle show/hide password
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
        // Xử lý chuyển hướng hoặc các hành động khác sau khi đăng nhập thành công
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
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
    <>
    <PageTitle title="Đăng nhập" description={"Đăng nhập vao hệ thống chia sẻ tài liệu"}/>
      <section className="bg-gray-50 dark:bg-gray-900 p-4 mx-auto" id="scrollID">
      <div className="flex flex-col items-center justify-center px-2 py-4 mx-auto">
        <a
          href="/"
          className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
        >
          <img
            className="w-8 h-8 mr-2"
            src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg"
            alt="logo"
          />
          DocShare
        </a>
        <div className="w-full bg-white rounded-lg shadow dark:border sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Đăng nhập tài khoản
            </h1>
            <form className="space-y-4" onSubmit={fetchLogin}>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Tài khoản hoặc Email
                </label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@gmail.com"
                  required
                  value={loginData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Mật khẩu
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
                  value={loginData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-2 top-10 text-gray-500 dark:text-gray-400"
                >
                  {showPassword ? (
                    <FontAwesomeIcon icon={faEyeSlash} />
                  ) : (
                    <FontAwesomeIcon icon={faEye} />
                  )}
                </button>
              </div>
              <div className="flex items-end justify-end">
                <NavLink
                  to={`/forgot-password`}
                  className="hover:underline text-sm font-medium text-primary-600 dark:text-primary-500"
                >
                  Quên mật khẩu?
                </NavLink>
              </div>
              {/* Đăng nhập */}
              {isActing ? (
                <button
                type="button"
                  className="w-full  bg-white border-2 border-solid border-blue-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  <LoaderButton />
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  ĐĂNG NHẬP
                </button>
              )}

              <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Bạn chưa có tài khoản?{" "}
                <NavLink
                  to="/register"
                  className="font-medium text-blue-600 hover:underline dark:text-primary-500"
                >
                  Đăng ký
                </NavLink>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
export default LoginPage;
