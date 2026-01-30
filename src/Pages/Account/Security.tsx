import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import TwoFAVerifyButton from "../../Component/Users/TwoFAVerifyButton.tsx";
import VerifyEmailButton from "../../Component/Users/VerifyEmailButton.tsx";
import Loaders from "../../Component/Loaders/Loader";
import userApi from "../../api/usersApi";

// Interfaces
interface User {
  user_id: string;
  is_verified: boolean;
  email: string;
  two_factor_enabled: boolean;
}

function Security() {
  const [user, setUser] = React.useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userApi.getUserById();
        const data = response.data;

        setUser({
          user_id: data.user_id,
          is_verified: data.is_verified,
          email: data.email,
          two_factor_enabled: data.two_factor_enabled,
        });
      } catch (error: any) {
        toast.error("Không thể tải dữ liệu người dùng.");
        console.error(error.message);
      }
    };

    fetchUserData();
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loaders />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fa-solid fa-shield-halved text-blue-600"></i>
          Bảo mật tài khoản
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý các cài đặt bảo mật để bảo vệ tài khoản của bạn
        </p>
      </div>

      {/* 2FA */}
      <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-start">
        <div className="flex gap-4">
          <i className="fa-solid fa-lock text-xl text-blue-600 mt-1"></i>
          <div>
            <h3 className="font-semibold text-gray-800">
              Xác thực hai yếu tố (2FA)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Yêu cầu mã xác thực khi đăng nhập
            </p>

            <span
              className={`inline-flex items-center gap-1 mt-2 rounded-full px-3 py-1 text-xs font-semibold
                ${
                  user.two_factor_enabled
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
            >
              <i
                className={`fa-solid ${
                  user.two_factor_enabled
                    ? "fa-circle-check"
                    : "fa-circle-exclamation"
                }`}
              ></i>
              {user.two_factor_enabled ? "Đã bật" : "Chưa bật"}
            </span>
          </div>
        </div>

        <TwoFAVerifyButton
          isTwoFactorEnabled={user.two_factor_enabled}
        />
      </div>

      {/* Email verification */}
      <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-start">
        <div className="flex gap-4">
          <i className="fa-solid fa-envelope-circle-check text-xl text-blue-600 mt-1"></i>
          <div>
            <h3 className="font-semibold text-gray-800">
              Xác thực email
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Email dùng để bảo mật và khôi phục tài khoản
            </p>

            <span
              className={`inline-flex items-center gap-1 mt-2 rounded-full px-3 py-1 text-xs font-semibold
                ${
                  user.is_verified
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
            >
              <i
                className={`fa-solid ${
                  user.is_verified
                    ? "fa-circle-check"
                    : "fa-circle-exclamation"
                }`}
              ></i>
              {user.is_verified ? "Đã xác thực" : "Chưa xác thực"}
            </span>
          </div>
        </div>

        <VerifyEmailButton user={user} />
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-start">
        <div className="flex gap-4">
          <i className="fa-solid fa-key text-xl text-blue-600 mt-1"></i>
          <div>
            <h3 className="font-semibold text-gray-800">
              Mật khẩu
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Nên thay đổi mật khẩu định kỳ để tăng bảo mật
            </p>
          </div>
        </div>

        <NavLink
          to={`/forgot-password?email=${encodeURIComponent(user.email)}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          <i className="fa-solid fa-rotate-right"></i>
          Đổi mật khẩu
        </NavLink>
      </div>
    </div>
  );
}

export default Security;
