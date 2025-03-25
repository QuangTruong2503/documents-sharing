import React from 'react'
import AccountButton from './AccountButton'
import { NavLink } from 'react-router-dom'
import Cookies from 'js-cookie'
// Hiển thị đăng nhập hoặc nút người dùng đã đăng nhập
const AccountComponent = ({ onClose }) => {
    const closeToggleMenu = () => {
      if (onClose) onClose();
    };
    const user = Cookies.get("user");
  
    return (
      <div>
        {user === undefined ? (
          <>
            <div className="hidden md:flex gap-2">
              <NavLink
                to="/register"
                className="text-blue-700 bg-white border-solid border-2 border-blue-600 hover:bg-blue-100 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
              >
                Đăng ký
              </NavLink>
              <NavLink
                to="/login"
                className="text-white border-solid border-2 border-transparent bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
              >
                Đăng nhập
              </NavLink>
            </div>
            <div className="md:hidden flex flex-col space-y-2 mt-4">
              <NavLink
                to="/register"
                onClick={closeToggleMenu}
                className="text-blue-700 bg-white border-solid border-2 border-blue-600 hover:bg-blue-100 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
              >
                Đăng ký
              </NavLink>
              <NavLink
                to="/login"
                onClick={closeToggleMenu}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
              >
                Đăng nhập
              </NavLink>
            </div>
          </>
        ) : (
          <AccountButton />
        )}
      </div>
    );
  };

export default AccountComponent