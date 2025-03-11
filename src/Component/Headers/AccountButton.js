import React, { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faGear, faSignOut, faUser } from '@fortawesome/free-solid-svg-icons';
import { faBookmark } from '@fortawesome/free-regular-svg-icons';

const AccountButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropContentRef = useRef(null);
  // Lấy thông tin user từ cookies và parse JSON
  const userStr = Cookies.get('user');
  const [user, setUser] = useState(null);


  const handleLogout = () => {
    Cookies.remove('user');
    Cookies.remove('token');
    window.location.href = "/";
  };
  const handleClickOutside = (event) => {
    // Kiểm tra nếu click xảy ra bên ngoài `div`
    if (dropContentRef.current && !dropContentRef.current.contains(event.target)) {
      setIsOpen(false)
    }
  };
  useEffect(() => {
    // Thêm sự kiện khi component được mount
    document.addEventListener("mousedown", handleClickOutside);

    // Xóa sự kiện khi component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() =>{
    if(userStr !== undefined)
    {
      setUser(JSON.parse(userStr))
    }
  },[userStr])
  return (
    <div>
      {user !== null &&
        <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
        >
          <img 
            src={user.avatarUrl} 
            alt="User avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </button>
  
        {isOpen && (
          <div ref={dropContentRef} className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header với thông tin user */}
            <div className="p-4 border-b border-gray-200">
              <p className="font-medium text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
  
            {/* Menu items */}
            <div className="p-2" onClick={() => setIsOpen(false)}>
              {/* Saved Document */}
              <NavLink to={'/saved'} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                <span className='me-2'><FontAwesomeIcon icon={faBookmark}/></span>
                <span>Tài liệu đã lưu</span>
              </NavLink>
              {/* Upload */}
              <NavLink to={'/upload-document'} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                <span className='me-2'><FontAwesomeIcon icon={faArrowUp}/></span>
                <span>Tải lên</span>
              </NavLink>
              {/* Profile */}
              <NavLink  to={'/account/profile'} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                <span className='me-2'><FontAwesomeIcon icon={faUser}/></span>
                <span>Thông tin cá nhân</span>
              </NavLink>
              
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              <span className='me-2'><FontAwesomeIcon icon={faGear}/></span>
              <span>Cài đặt</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <span className='me-2'><FontAwesomeIcon icon={faSignOut}/></span>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </div>
      }
    </div>
  );
};

export default AccountButton;