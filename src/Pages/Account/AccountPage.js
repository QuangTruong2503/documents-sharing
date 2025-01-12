import React from "react";
import { Route, Routes } from "react-router-dom";
import ManageDashboard from "../../Component/Dashboard/DashboardContent.js";
import Profile from "./Profile.tsx";
import Password from "./Password.js";

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
    <div className="flex flex-col lg:flex-row">

      {/* Sidebar cho màn hình lớn */}
      <div className="hidden lg:block lg:w-1/5 bg-white rounded shadow-lg sticky top-0 h-fit p-4 mt-5">
        <ManageDashboard data={collapseData} />
      </div>

      {/* Nội dung chính */}
      <div className="flex-1 p-4 mt-5 ms-6 bg-white rounded shadow-lg min-h-screen">
        <div>
            <Routes>
                <Route path="profile" element={<Profile />} />
                <Route path="password" Component={Password}/>
            </Routes>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
