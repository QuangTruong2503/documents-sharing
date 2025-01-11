import { faImage } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import LoaderButton from "../../Component/Loaders/LoaderButton";

interface User {
  username: string;
  full_name: string | null;
  email: string;
  avatar_url: string;
  created_at: string;
  role: string;
  is_verified: boolean;
}

function Profile() {
  const [isSavingImage, setIsSavingImage] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>({
    username: "truong25",
    full_name: null,
    email: "truong25@gmail.com",
    avatar_url:
      "https://res.cloudinary.com/brandocloud/image/upload/v1736401991/DocShare/users/default-avt.png",
    created_at: "2025-01-10T06:16:07",
    role: "user",
    is_verified: false,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Your image handling logic
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submit button clicked");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (user) {
      setUser({
        ...user,
        [e.target.name]: e.target.value,
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h4 className="my-3 text-xl font-semibold">Tổng quan</h4>
      {user && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-gray-600">Tên đăng nhập</span>
              <strong>{user.username}</strong>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Email</span>
              <strong>{user.email}</strong>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Họ và tên</span>
              <strong>{user.full_name || "Chưa cập nhật"}</strong>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Vai trò</span>
              <strong>{user.role === "user" ? "Người dùng" : "Quản trị viên"}</strong>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Xác thực tài khoản</span>
              <strong>{user.is_verified ? "Đã xác thực" : "Chưa xác thực"}</strong>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Ngày tham gia</span>
              <strong>{new Date(user.created_at).toLocaleString()}</strong>
            </div>
          </div>
          <hr className="my-4 border-gray-300" />
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar_url}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover p-2 border-2 border-solid"
            />
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                {isSavingImage ? (
                  <label className="flex gap-2 items-center w-full">
                    <LoaderButton />
                  </label>
                ) : (
                  <label
                    className="cursor-pointer text-blue-600 border-2 border-solid border-blue-500 p-2 rounded hover:bg-blue-100"
                    htmlFor="uploadImage"
                  >
                    Chọn ảnh
                    <FontAwesomeIcon icon={faImage} className="ml-2" />
                  </label>
                )}
                <input
                  id="uploadImage"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>Vui lòng chọn ảnh nhỏ hơn 3MB</p>
                <p>Chọn hình ảnh phù hợp, không phản cảm</p>
              </div>
            </div>
          </div>
          {/* Update Section */}
          <hr className="my-4 border-gray-300" />
          <form
            className="flex flex-col space-y-4 w-full lg:w-1/2"
            onSubmit={handleSubmit}
          >
            <div className="form-group flex flex-col space-y-1">
              <label className="text-sm text-gray-600">Họ và Tên</label>
              <input
                type="text"
                name="full_name"
                value={user.full_name || ""}
                onChange={handleChange}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="form-group flex flex-col space-y-1">
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="reset"
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Đặt lại
              </button>
              {isSaving ? (
                <button
                  disabled
                  className="px-4 py-2 bg-blue-500 text-white rounded cursor-not-allowed"
                >
                  <LoaderButton />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Lưu thay đổi
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Profile;
