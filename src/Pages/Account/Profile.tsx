import { faImage } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import LoaderButton from "../../Component/Loaders/LoaderButton";
import Cookies from "js-cookie";
import userApi from "../../api/usersApi";
import { verifyToken } from "../../Helpers/VerifyToken.tsx";
import { toast } from "react-toastify";
import Loaders from "../../Component/Loaders/Loader.js"
interface User {
  user_id: string;
  username: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
  role: string;
  is_verified: boolean;
}
interface UpdateImage {
  message: string;
  success: string;
  user: ImageUser;
}
interface ImageUser {
  email: string;
  fullName: string;
  avatarUrl: string;
}

interface UpdateResponse{
  message: string;
  success: boolean;
}
function Profile() {
  const [isSavingImage, setIsSavingImage] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [updateMessage, setUpdateMessage] = useState<UpdateResponse | null>();

  //Cập nhật hình ảnh
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Kiểm tra định dạng tập tin
      const allowedFormats = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedFormats.includes(file.type)) {
        toast.warning("Vui lòng chọn file ảnh hợp lệ (jpg, jpeg, png).");
        e.target.value = ""; // Làm sạch giá trị input
        return;
      }

      // Kiểm tra kích thước tập tin (<3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast.warning("Vui lòng chọn ảnh nhỏ hơn 3MB.");
        e.target.value = ""; // Làm sạch giá trị input
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      // Kiểm tra userId
      if (!user?.user_id) {
        toast.error("Không thể xác định người dùng.");
        return;
      }

      try {
        setIsSavingImage(true); // Hiển thị trạng thái đang tải
        const response = await userApi.updateImage(formData, user?.user_id);
        const data: UpdateImage = response.data;

        if (data.success) {
          toast.success(data.message);
          Cookies.set("user", JSON.stringify(data.user));
          window.location.reload();
        } else {
          toast.error(data.message);
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Đã xảy ra lỗi khi tải ảnh lên."
        );
        console.error("Error uploading image:", error.message);
      } finally {
        setIsSavingImage(false); // Kết thúc trạng thái đang tải
        e.target.value = ""; // Làm sạch giá trị input
      }
    }
  };
  //Cập nhật dữ liệu
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user) {
      try {
        setIsSaving(true);
        const response = await userApi.updateUser(user);
        const responseData = response.data;
        setUpdateMessage(responseData)
      } catch (error: any) {
        console.error("Error updating user:", error.message);
      } finally {
        setIsSaving(false);
      }
    }
  };
  //Thay đổi dữ liệu
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
  //Kiểm tra đăng nhập
  useEffect(() => {
    const token = Cookies.get("token");
    if (token !== undefined) {
      const fetchUserData = async () => {
        try {
          const userData = await verifyToken(token);
          if (userData) {
            const response = await userApi.getUserById(userData.userID);
            setUser(response.data);
          } else {
            console.error("Invalid token.");
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error.message);
        }
      };

      fetchUserData();
    } else {
      console.error("No token found in cookies.");
    }
  }, []);
  useEffect(() =>{
    console.log(user)
  },[user])
  return (
    <div>
      {user === null ? (
        <div className="flex justify-center items-center h-screen">
          <Loaders />
        </div>
      ) : (
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
                  <strong>
                    {user.role === "user" ? "Người dùng" : "Quản trị viên"}
                  </strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600">Xác thực tài khoản</span>
                  <strong>
                    {user.is_verified ? "Đã xác thực" : "Chưa xác thực"}
                  </strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600">Ngày tham gia</span>
                  <strong>{new Date(user.created_at).toLocaleString()}</strong>
                </div>
              </div>
              <hr className="my-4 border-gray-300" />
              <div className="flex items-center space-x-4">
                <img
                  src={user.avatar_url || "/default-avatar.png"}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover p-2 border-2 border-solid"
                />
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    {isSavingImage ? (
                      <LoaderButton />
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
                  <p className="text-sm text-gray-600">
                    Vui lòng chọn ảnh nhỏ hơn 3MB. Ảnh phải phù hợp, không phản
                    cảm.
                  </p>
                </div>
              </div>
              <hr className="my-4 border-gray-300" />
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group flex flex-col gap-1">
                  <label className="text-gray-600">Tên đăng nhập</label>
                  <input
                    type="text"
                    name="username"
                    value={user.username || ""}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 text-sm w-1/3"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-gray-600">Họ và Tên</label>
                  <input
                    type="text"
                    name="full_name"
                    value={user.full_name || ""}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 text-sm w-1/3"
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-gray-600">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={user.email}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 text-sm w-1/3"
                  />
                </div>
                {/* Response */}
                <div className={`${updateMessage?.success ? 'text-green-600' : 'text-red-600'}`}>
                  <p>{updateMessage?.message}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="reset"
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Đặt lại
                  </button>
                  {isSaving ? (
                    <LoaderButton />
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
      )}
    </div>
  );
}

export default Profile;
