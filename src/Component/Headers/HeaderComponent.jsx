import React, { useState, useEffect } from "react";
import {Dropdown} from "flowbite-react"
import { NavLink } from "react-router-dom";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faFile, faSignOut, faUser } from '@fortawesome/free-solid-svg-icons';
import { faBookmark } from '@fortawesome/free-regular-svg-icons';
import verificationsApi from "../../api/verificationsApi.js";
import userApi from '../../api/usersApi';
import config from "../../config/config";

// AccountButton Component
const AccountButton = () => {
  const [user, setUser] = useState(null);
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
    try {
      await userApi.postLogout(Cookies.get("token"));
      Cookies.remove("user");
      Cookies.remove("token");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) return null;

  return (
    <Dropdown
      label={
        <div className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors">
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
  );
};

// AccountComponent
const AccountComponent = ({ onClose }) => {
  const closeToggleMenu = () => {
    if (onClose) onClose();
  };
  const user = Cookies.get("user");

  return (
    <div>
      {user === undefined ? (
        <>
          <div className="flex gap-2">
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

// VerificationComponent
const VerificationComponent = () => {
  const [isVerified, setIsVerified] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const token = Cookies.get("token");
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const response = await verificationsApi.checkUserVerified();
        setIsVerified(response.data.is_verified);
      } catch (error) {
        console.error("Error checking verification status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) {
      checkVerification();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  if (isLoading || isVerified) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-b border-yellow-300 text-black px-4 py-3" role="alert">
      <p className="text-sm text-center">
        Tài khoản của bạn chưa tiến hành xác thực Email.{" "}
        <a href="/account/profile" className="underline font-semibold">
          Xác thực Email
        </a>
      </p>
    </div>
  );
};

// Main HeaderComponent
function HeaderComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <img src={config.websiteLogo} className="h-8" alt="DocShare Logo" />
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
              DocShare
            </span>
          </a>
          <div className="flex md:order-2 space-x-3 rtl:space-x-reverse">
            <div className="hidden md:block">
              <AccountComponent />
            </div>
            <button
              data-collapse-toggle="navbar-cta"
              type="button"
              className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              aria-controls="navbar-cta"
              aria-expanded={isOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 17 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 1h15M1 7h15M1 13h15"
                />
              </svg>
            </button>
          </div>
          <div
            className={`${isOpen ? "block" : "hidden"} w-full md:block md:w-auto`}
            id="navbar-cta"
          >
            <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <a
                  href="#about"
                  className="block py-2 px-3 md:p-0 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 md:dark:hover:text-blue-500"
                >
                  About
                </a>
              </li>
              <li className="md:hidden text-center">
                <AccountComponent onClose={() => setIsOpen(false)} />
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <VerificationComponent />
    </>
  );
}

export default HeaderComponent;