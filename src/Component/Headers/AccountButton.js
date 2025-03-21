import React, { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faFile, faSignOut, faUser } from '@fortawesome/free-solid-svg-icons';
import { faBookmark } from '@fortawesome/free-regular-svg-icons';
import userApi from '../../api/usersApi';

const AccountButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropContentRef = useRef(null);

  // Hàm lấy và cập nhật thông tin user từ Cookies
  const updateUserFromCookies = () => {
    const userStr = Cookies.get('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from cookies:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  // Theo dõi thay đổi Cookies
  useEffect(() => {
    // Cập nhật user lần đầu khi mount
    updateUserFromCookies();

    // Thiết lập interval để kiểm tra Cookies định kỳ
    const intervalId = setInterval(() => {
      updateUserFromCookies();
    }, 1000); // Kiểm tra mỗi 1 giây, có thể điều chỉnh thời gian

    // Cleanup interval khi component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Xử lý click ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropContentRef.current && !dropContentRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xử lý logout
  const handleLogout = async () => {
    try {
      await userApi.postLogout(Cookies.get('token'));
      Cookies.remove('user');
      Cookies.remove('token');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div>
      {user && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
          >
            <img
              src={user.avatarUrl}
              alt="User avatar"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => (e.target.src = '/default-avatar.png')} // Fallback nếu ảnh lỗi
            />
          </button>

          {isOpen && (
            <div
              ref={dropContentRef}
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              {/* Header với thông tin user */}
              <div className="p-4 border-b border-gray-200">
                <p className="font-medium text-gray-900">{user.fullName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>

              {/* Menu items */}
              <div className="p-2" onClick={() => setIsOpen(false)}>
                <NavLink
                  to="/my-collections"
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <span className="me-2">
                    <FontAwesomeIcon icon={faBookmark} />
                  </span>
                  <span>Bộ sưu tập</span>
                </NavLink>
                <NavLink
                  to="/upload-document"
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <span className="me-2">
                    <FontAwesomeIcon icon={faArrowUp} />
                  </span>
                  <span>Tải lên</span>
                </NavLink>
                <NavLink
                  to="/my-documents"
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <span className="me-2">
                    <FontAwesomeIcon icon={faFile} />
                  </span>
                  <span>Tài liệu của tôi</span>
                </NavLink>
                <NavLink
                  to="/account/profile"
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <span className="me-2">
                    <FontAwesomeIcon icon={faUser} />
                  </span>
                  <span>Thông tin cá nhân</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  <span className="me-2">
                    <FontAwesomeIcon icon={faSignOut} />
                  </span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountButton;