import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faFile, faSignOut, faUser } from '@fortawesome/free-solid-svg-icons';
import { faBookmark } from '@fortawesome/free-regular-svg-icons';
import userApi from '../../api/usersApi';
import Cookies from 'js-cookie';
import { Dropdown} from "flowbite-react"
import { NavLink } from "react-router-dom";
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import FullPageLoader from '../Loaders/FullPageLoader';
// AccountButton Component
const AccountButton = () => {
    const [user, setUser] = useState(null);
    const [isLogout, setIsLogout] = useState(false);
    const updateUserFromCookies = () => {
      const userStr = Cookies.get("user");
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
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
        <div className="hidden sm:block">
          <Dropdown
            label={
              <div className="flex items-center justify-center w-10 h-10 p-0.5 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors">
                <img
                  src={user.avatarUrl}
                  alt="User avatar"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => (e.target.src = "/default-avatar.png")}
                />
              </div>
            }
            arrowIcon={false}
            inline
            placement="bottom-end"
            className="w-64 rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <Dropdown.Header className="border-b border-gray-200">
              <span className="block font-medium text-gray-900">{user.fullName}</span>
              <span className="block text-sm text-gray-500 truncate">{user.email}</span>
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
            <Dropdown.Item as={NavLink} to="/account/profile">
              <span className="me-2">
                <FontAwesomeIcon icon={faUser} />
              </span>
              Thông tin cá nhân
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout} className="text-red-600 hover:!bg-red-50">
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
          <NavLink
            to="/my-collections"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faBookmark} />
            </span>
            Bộ sưu tập
          </NavLink>
          <NavLink
            to="/upload-document"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faArrowUp} />
            </span>
            Tải lên
          </NavLink>
          <NavLink
            to="/my-documents"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faFile} />
            </span>
            Tài liệu của tôi
          </NavLink>
          <NavLink
            to="/account/profile"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <span className="me-2">
              <FontAwesomeIcon icon={faUser} />
            </span>
            Thông tin cá nhân
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-left"
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