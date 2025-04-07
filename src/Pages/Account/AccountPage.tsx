import React from "react";
import { Route, Routes } from "react-router-dom";
import ManageDashboard from "../../Component/Dashboard/DashboardContent.tsx";
import Profile from "./Profile.tsx";
import Password from "./Password.js";
import PageTitle from "../../Component/PageTitle.js";

// Define menu item interface
interface MenuItem {
  name: string;
  url: string;
}

function AccountPage() {
  const collapseData: MenuItem[] = [
    {
      name: "Thông tin tài khoản",
      url: "/account/profile",
    }
  ];

  return (
    <>
      <PageTitle
        title="Tài khoản"
        description="Quản lý thông tin tài khoản của bạn."
      />
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-6">
              <ManageDashboard data={collapseData} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <Routes>
                <Route path="profile" element={<Profile />} />
                <Route path="password" element={<Password />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default AccountPage;