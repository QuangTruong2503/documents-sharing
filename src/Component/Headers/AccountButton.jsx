import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faFile, faFlag, faSignOut, faUser } from '@fortawesome/free-solid-svg-icons';
import { faBookmark } from '@fortawesome/free-regular-svg-icons';
import userApi from '../../api/usersApi';
import Cookies from 'js-cookie';
import { Dropdown} from "flowbite-react"
import { NavLink } from "react-router-dom";
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import FullPageLoader from '../Loaders/FullPageLoader';
import { normalizeUser } from '../../Helpers/userMapper';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import { stopNotificationRealtime } from '../../api/notificationRealtime';
// AccountButton Component
const AccountButton = ({ onClose }) => {
    const [user, setUser] = useState(null);
    const [isLogout, setIsLogout] = useState(false);
    const updateUserFromCookies = () => {
      const userStr = Cookies.get("user");
      if (userStr) {
        try {
          const parsedUser = normalizeUser(JSON.parse(userStr));
          setUser(parsedUser);
        } catch (error) {
          console.error("Error parsing user from cookies:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
  
    useEffect(() => {
      updateUserFromCookies();
      const intervalId = setInterval(updateUserFromCookies, 1000);
      return () => clearInterval(intervalId);
    }, []);
  
    const handleLogout = async () => {
      setIsLogout(true);
      try {
        await userApi.postLogout(Cookies.get("token"));
      } 
      catch (error) {
        console.error("Logout error:", error);
      }
      finally{
        setIsLogout(false);
        stopNotificationRealtime();
        Cookies.remove("user");
        Cookies.remove("token");
        window.location.href = "/";
        toast.success("Đăng xuất thành công!");
      }
    };
  
    if (!user) return null;
  
    return (
      <div className="relative">
        {/* Dropdown: Chỉ hiển thị từ sm trở lên */}
        <div className="hidden sm:flex items-center gap-2">
          <NotificationDropdown />
          <Dropdown
            label={
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line p-0.5 transition-colors hover:border-primary">
                <img
                  src={user.avatarUrl || "/default-avatar.png"}
                  alt="User avatar"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => (e.target.src = "/default-avatar.png")}
                />
              </div>
            }
            arrowIcon={false}
            inline
            placement="bottom-end"
            className="z-50 w-64 rounded-lg border border-line shadow-lg"
          >
            <Dropdown.Header className="border-b border-line">
              <span className="block font-medium text-ink">{user.fullName || user.username}</span>
              <span className="block truncate text-sm text-ink-secondary">{user.email}</span>
            </Dropdown.Header>
            <Dropdown.Item as={NavLink} to="/my-collections">
              <span className="me-2">
                <FontAwesomeIcon icon={faBookmark} />
              </span>
              Bộ sưu tập
            </Dropdown.Item>
            <Dropdown.Item as={NavLink} to="/upload-document">
              <span className="me-2">
                <FontAwesomeIcon icon={faArrowUp} />
              </span>
              Tải lên
            </Dropdown.Item>
            <Dropdown.Item as={NavLink} to="/my-documents">
              <span className="me-2">
                <FontAwesomeIcon icon={faFile} />
              </span>
              Tài liệu của tôi
            </Dropdown.Item>
            <Dropdown.Item as={NavLink} to="/my-reports">
              <span className="me-2">
                <FontAwesomeIcon icon={faFlag} />
              </span>
              Báo cáo của tôi
            </Dropdown.Item>
            <Dropdown.Item as={NavLink} to="/account/profile">
              <span className="me-2">
                <FontAwesomeIcon icon={faUser} />
              </span>
              Thông tin cá nhân
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout} className="text-danger hover:!bg-red-50">
              <span className="me-2">
                <FontAwesomeIcon icon={faSignOut} />
              </span>
              Đăng xuất
            </Dropdown.Item>
          </Dropdown>
        </div>
  
        {/* Các nút liệt kê: Chỉ hiển thị dưới sm */}
        <div className="sm:hidden flex flex-col space-y-2">
          <hr />
          <NotificationDropdown compact onNavigate={onClose} />
          <NavLink
            to="/my-collections"
            onClick={onClose}
            className="flex items-center rounded-md px-4 py-2 text-ink-secondary hover:bg-canvas hover:text-primary"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faBookmark} />
            </span>
            Bộ sưu tập
          </NavLink>
          <NavLink
            to="/upload-document"
            onClick={onClose}
            className="flex items-center rounded-md px-4 py-2 text-ink-secondary hover:bg-canvas hover:text-primary"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faArrowUp} />
            </span>
            Tải lên
          </NavLink>
          <NavLink
            to="/my-documents"
            onClick={onClose}
            className="flex items-center rounded-md px-4 py-2 text-ink-secondary hover:bg-canvas hover:text-primary"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faFile} />
            </span>
            Tài liệu của tôi
          </NavLink>
          <NavLink
            to="/account/profile"
            onClick={onClose}
            className="flex items-center rounded-md px-4 py-2 text-ink-secondary hover:bg-canvas hover:text-primary"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faUser} />
            </span>
            Thông tin cá nhân
          </NavLink>
          <NavLink
            to="/my-reports"
            onClick={onClose}
            className="flex items-center rounded-md px-4 py-2 text-ink-secondary hover:bg-canvas hover:text-primary"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faFlag} />
            </span>
            Báo cáo của tôi
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center rounded-md px-4 py-2 text-left text-danger hover:bg-red-50"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faSignOut} />
            </span>
            Đăng xuất
          </button>
        </div>
        {isLogout && (
          <FullPageLoader text={"Tiến hành đăng xuất..."}/>
        )}
      </div>
    );
  };

export default AccountButton
