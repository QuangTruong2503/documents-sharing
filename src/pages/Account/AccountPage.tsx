import React from "react";
import { Route, Routes } from "react-router-dom";
import ManageDashboard from "components/Dashboard/DashboardContent.tsx";
import Profile from "./Profile.tsx";
import PageTitle from "components/PageTitle.js";
import Security from "./Security.tsx";
import Cookies from "js-cookie";
import { normalizeUser } from "utils/userMapper.js";

// Define menu item interface
interface MenuItem {
  name: string;
  url: string;
  icon: string;
}

function AccountPage() {
  const getCurrentUserId = () => {
    const userStr = Cookies.get("user");
    if (!userStr) return "";

    try {
      return normalizeUser(JSON.parse(userStr)).userId;
    } catch {
      return "";
    }
  };

  const currentUserId = getCurrentUserId();
  const collapseData: MenuItem[] = [
    {
      name: "Thông tin",
      url: "/account/profile",
      icon: "fa-regular fa-user",
    },
    {
      name: "Bảo mật",
      url: "/account/security",
      icon: "fa-solid fa-shield-halved",
    },
    ...(currentUserId
      ? [
          {
            name: "Hồ sơ công khai",
            url: `/public-profile/${currentUserId}`,
            icon: "fa-solid fa-address-card",
          },
        ]
      : []),
  ];

  return (
    <>
      <PageTitle
        title="Tài khoản"
        description="Quản lý thông tin tài khoản của bạn."
      />
      <div className="container mx-auto min-h-screen px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-1/4">
            <div className="surface-card p-6 lg:sticky lg:top-24">
              <ManageDashboard data={collapseData} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="surface-card p-6">
              <Routes>
                <Route path="profile" element={<Profile />} />
                <Route path="security" element={<Security />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default AccountPage;
