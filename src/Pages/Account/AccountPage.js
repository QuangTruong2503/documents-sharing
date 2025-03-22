import React from "react";
import { Route, Routes } from "react-router-dom";
import ManageDashboard from "../../Component/Dashboard/DashboardContent.js";
import Profile from "./Profile.tsx";
import Password from "./Password.js";
import PageTitle from "../../Component/PageTitle.js";

function AccountPage() {
  const collapseData = [
    {
      name: "Thông tin tài khoản",
      url: "/account/profile",
    },
    {
      name: "Đổi mật khẩu",
      url: "/account/password",
    },
  ];

  return (
    <>
      <PageTitle
        title="Tài khoản"
        description="Quản lý thông tin tài khoản của bạn."
      />
      <div className="flex flex-col lg:flex-row gap-6 min-h-screen">
        {/* Sidebar cho màn hình lớn */}
        <div className="hidden lg:block lg:w-1/4 bg-white rounded-lg shadow-md sticky top-5 h-fit p-6">
          <ManageDashboard data={collapseData} />
        </div>

        {/* Sidebar cho màn hình nhỏ */}
        <div className="block lg:hidden bg-white rounded-lg shadow-md p-4 mb-4">
          <ManageDashboard data={collapseData} />
        </div>

        {/* Nội dung chính */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          <Routes>
            <Route path="profile" element={<Profile />} />
            <Route path="password" Component={Password} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default AccountPage;
