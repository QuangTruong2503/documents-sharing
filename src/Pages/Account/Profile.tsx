import { faImage } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import LoaderButton from "../../Component/Loaders/LoaderButton";
import Cookies from "js-cookie";
import userApi from "../../api/usersApi";
import { toast } from "react-toastify";
import Loaders from "../../Component/Loaders/Loader.js";
import { formatDateToVN } from "../../Helpers/formatDateToVN.js";
import PageTitle from "../../Component/PageTitle.js";

// Interfaces
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
interface UserUpdateData {
  username: string;
  email: string;
  full_name: string;
}
interface UserUpdate {
  email: string;
  fullName: string;
  avatarUrl: string;
}

interface UpdateResponse {
  message: string;
  success: boolean;
  user: UserUpdate;
}

// Tab Component
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = ({ label, isActive, onClick }: TabButtonProps) => (
  <button
    className={`px-4 py-2 transition-colors duration-300 ease-in-out ${
      isActive
        ? "border-b-2 border-blue-500 text-blue-500"
        : "hover:text-blue-500"
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

// Overview Component
interface OverviewTabProps {
  user: User;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSavingImage: boolean;
}

const OverviewTab = React.memo(
  ({ user, onImageChange, isSavingImage }: OverviewTabProps) => {
    return (
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
            <span className="text-gray-600">Ngày tham gia</span>
            <strong>{formatDateToVN(user.created_at)}</strong>
          </div>
        </div>
        <hr className="my-4 border-gray-300" />
        <div className="flex items-center space-x-4">
          <img
            src={user.avatar_url || "/default-avatar.png"}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover p-2 border-2 border-solid"
          />
          <div className="flex flex-col justify-start items-start space-y-2">
            {isSavingImage ? (
              <LoaderButton />
            ) : (
              <label
                className="cursor-pointer w-fit text-blue-600 border-2 border-solid border-blue-500 p-2 rounded hover:bg-blue-100"
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
              onChange={onImageChange}
            />
            <p className="text-sm text-gray-600">
              Vui lòng chọn ảnh nhỏ hơn 3MB. Ảnh phải phù hợp, không phản cảm.
            </p>
          </div>
        </div>
      </div>
    );
  }
);
// UpdateTab Component
interface UpdateTabProps {
  user: UserUpdateData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  onReload: () => void;
}

const UpdateTab = React.memo(
  ({ user, onChange, onSubmit, isSaving, onReload }: UpdateTabProps) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="form-group flex flex-col gap-1">
        <label className="text-gray-600">Tên đăng nhập</label>
        <input
          type="text"
          name="username"
          value={user.username || ""}
          className="border rounded px-3 py-2 text-sm w-1/3"
          onChange={onChange}
        />
      </div>
      <div className="form-group flex flex-col gap-1">
        <label className="text-gray-600">Họ và Tên</label>
        <input
          type="text"
          name="full_name"
          value={user.full_name || ""}
          onChange={onChange}
          className="border rounded px-3 py-2 text-sm w-1/3"
        />
      </div>
      <div className="form-group flex flex-col gap-1">
        <label className="text-gray-600">Email</label>
        <input
          type="email"
          name="email"
          value={user.email}
          onChange={onChange}
          className="border rounded px-3 py-2 text-sm w-1/3"
        />
      </div>
      <div className="flex space-x-2">
        <button
          type="reset"
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          onClick={onReload}
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
  )
);

function Profile() {
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userUpdate, setUserUpdate] = useState<UserUpdateData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isReload, setIsReload] = useState(false);
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userApi.getUserById();
        setUser(response.data);
        setUserUpdate(response.data);
      } catch (error: any) {
        toast.error("Không thể tải dữ liệu người dùng.");
        console.error("Error fetching user data:", error.message);
      }
    };
    fetchUserData();
  }, [isReload]);

  // Handle image upload
  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 3 * 1024 * 1024) {
          toast.warning("Vui lòng chọn ảnh nhỏ hơn 3MB.");
          e.target.value = "";
          return;
        }

        const formData = new FormData();
        formData.append("image", file);

        if (!user?.user_id) {
          toast.error("Không thể xác định người dùng.");
          return;
        }

        try {
          setIsSavingImage(true);
          const response = await userApi.updateImage(formData);
          const data: UpdateResponse = response.data;

          if (data.success) {
            toast.success(data.message);
            Cookies.set("user", JSON.stringify(data.user));
            setUser((prev) =>
              prev ? { ...prev, avatar_url: data.user.avatarUrl } : prev
            );
          } else {
            toast.error(data.message);
          }
        } catch (error: any) {
          toast.error("Lỗi khi tải ảnh lên.");
          console.error("Error uploading image:", error.message);
        } finally {
          setIsSavingImage(false);
          e.target.value = "";
        }
      }
    },
    [user]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!userUpdate) return;

      try {
        setIsSaving(true);
        const response = await userApi.updateUser(userUpdate);
        const responseData: UpdateResponse = response.data;
        if (responseData.success) {
          toast.success(responseData.message);
          Cookies.set("user", JSON.stringify(responseData.user));
          setIsReload(!isReload);
        } else {
          toast.error(responseData.message);
        }
      } catch (error: any) {
        toast.error("Lỗi khi cập nhật thông tin.");
        console.error("Error updating user:", error.message);
      } finally {
        setIsSaving(false);
      }
    },
    [userUpdate, isReload]
  );

  // Handle input change with debounce
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (userUpdate) {
        setUserUpdate((prev) => ({
          ...prev!,
          [e.target.name]: e.target.value,
        }));
      }
    },
    [userUpdate]
  );
  // Memoized tab content
  const tabContent = useMemo(() => {
    if (activeTab === "overview") {
      return (
        <OverviewTab
          user={user!}
          onImageChange={handleImageChange}
          isSavingImage={isSavingImage}
        />
      );
    }
    if (activeTab === "update") {
      return (
        <UpdateTab
          user={userUpdate!}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onReload={() => setIsReload(!isReload)}
          isSaving={isSaving}
        />
      );
    }
    return null;
  }, [
    activeTab,
    user,
    userUpdate,
    handleImageChange,
    handleChange,
    handleSubmit,
    isSavingImage,
    isSaving,
    isReload,
  ]);

  if (user === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loaders />
      </div>
    );
  }

  return (
    <>
      <PageTitle
        title="Thông tin cá nhân"
        description="Quản lý thông tin cá nhân của bạn"
      />
      <div className="container p-4">
        <div className="flex mb-4 text-lg font-semibold">
          <TabButton
            label="Tổng quan"
            isActive={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            label="Cập nhật thông tin"
            isActive={activeTab === "update"}
            onClick={() => setActiveTab("update")}
          />
        </div>
        <hr className="my-4 border-gray-300" />
        {tabContent}
      </div>
    </>
  );
}

export default Profile;
