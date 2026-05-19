import React, { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faCheckCircle,
  faEnvelope,
  faImage,
  faRotateRight,
  faShieldHalved,
  faUpload,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { RefreshCw } from "lucide-react";
import LoaderButton from "components/Loaders/LoaderButton";
import PageTitle from "components/PageTitle.js";
import userApi from "api/usersApi";
import verificationsApi from "api/verificationsApi";
import { formatDateToVN } from "utils/formatDateToVN.js";
import { normalizeUser } from "utils/userMapper.js";

interface User {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  role: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
}

interface UserUpdateData {
  fullName: string;
}

interface UserUpdate {
  email?: string;
  fullName?: string;
  full_name?: string;
  avatar?: string;
  avatar_url?: string;
}

interface UpdateResponse {
  message: string;
  success: boolean;
  user?: UserUpdate;
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = ({ label, isActive, onClick }: TabButtonProps) => (
  <button
    type="button"
    className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-primary-soft text-primary"
        : "text-ink-secondary hover:bg-canvas hover:text-primary"
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

interface OverviewTabProps {
  user: User;
  selectedImage: File | null;
  imagePreview: string | null;
  isSavingImage: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpload: () => void;
  onClearImage: () => void;
  onOpenEmailModal: () => void;
}

const OverviewTab = React.memo(
  ({
    user,
    selectedImage,
    imagePreview,
    isSavingImage,
    onImageSelect,
    onImageUpload,
    onClearImage,
    onOpenEmailModal,
  }: OverviewTabProps) => {
    const avatarSrc = imagePreview || user.avatarUrl || "/default-avatar.png";

    return (
      <div className="space-y-6">
        <section className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="surface-card bg-canvas p-5 text-center">
            <div className="relative mx-auto h-36 w-36">
              <img
                src={avatarSrc}
                alt="avatar"
                className="h-36 w-36 rounded-full border border-line bg-surface object-cover"
              />
              <label
                htmlFor="uploadImage"
                className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-card transition hover:bg-primary-hover"
                title="Chọn ảnh đại diện"
              >
                <FontAwesomeIcon icon={faCamera} />
              </label>
            </div>

            <input
              id="uploadImage"
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              onChange={onImageSelect}
            />

            <h2 className="mt-4 text-lg font-bold text-ink">
              {user.fullName || user.username}
            </h2>
            <p className="text-sm text-ink-secondary">{user.email}</p>

            {selectedImage ? (
              <div className="mt-5 rounded-lg border border-line bg-surface p-3 text-left">
                <p className="line-clamp-1 text-sm font-semibold text-ink">
                  {selectedImage.name}
                </p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Ảnh đã chọn, bấm tải lên để lưu.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={onImageUpload}
                    disabled={isSavingImage}
                    className="btn-primary flex-1 gap-2"
                  >
                    {isSavingImage ? (
                      "Đang tải..."
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} />
                        Tải lên
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClearImage}
                    disabled={isSavingImage}
                    className="btn-secondary px-3"
                    title="Bỏ chọn ảnh"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 text-sm text-ink-secondary">
                <FontAwesomeIcon icon={faImage} className="mr-2 text-primary" />
                PNG, JPG, WEBP nhỏ hơn 3MB.
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-card p-4">
              <span className="text-sm text-ink-secondary">Họ và tên</span>
              <strong className="mt-1 block text-ink">
                {user.fullName || "Chưa cập nhật"}
              </strong>
            </div>
            <div className="surface-card p-4">
              <span className="text-sm text-ink-secondary">Email</span>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <strong className="break-all text-ink">{user.email}</strong>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold ${
                    user.isVerified
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenEmailModal}
                className="btn-secondary mt-3 gap-2"
              >
                <FontAwesomeIcon icon={faEnvelope} />
                Đổi email
              </button>
            </div>
            <div className="surface-card p-4">
              <span className="text-sm text-ink-secondary">Tên đăng nhập</span>
              <strong className="mt-1 block text-ink">{user.username}</strong>
              <p className="mt-1 text-xs text-ink-secondary">
                Dùng để định danh tài khoản, không chỉnh sửa tại đây.
              </p>
            </div>
            <div className="surface-card p-4">
              <span className="text-sm text-ink-secondary">Vai trò</span>
              <strong className="mt-1 flex items-center gap-2 text-ink">
                <FontAwesomeIcon icon={faShieldHalved} className="text-primary" />
                {user.role === "user" ? "Người dùng" : "Quản trị viên"}
              </strong>
            </div>
            <div className="surface-card p-4 sm:col-span-2">
              <span className="text-sm text-ink-secondary">Ngày tham gia</span>
              <strong className="mt-1 block text-ink">
                {user.createdAt ? formatDateToVN(user.createdAt) : "Chưa cập nhật"}
              </strong>
            </div>
          </div>
        </section>
      </div>
    );
  }
);

interface UpdateTabProps {
  user: UserUpdateData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  onReload: () => void;
}

const UpdateTab = React.memo(
  ({ user, onChange, onSubmit, isSaving, onReload }: UpdateTabProps) => (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <FontAwesomeIcon icon={faUser} className="text-primary" />
          Họ và tên
        </label>
        <input
          type="text"
          name="fullName"
          value={user.fullName || ""}
          onChange={onChange}
          className="input-field mt-2"
          placeholder="Nhập họ và tên của bạn"
        />
        <p className="mt-2 text-xs text-ink-secondary">
          Tên này sẽ hiển thị trên tài liệu và hồ sơ công khai của bạn.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary gap-2" onClick={onReload}>
          <FontAwesomeIcon icon={faRotateRight} />
          Đặt lại
        </button>
        {isSaving ? (
          <LoaderButton />
        ) : (
          <button type="submit" className="btn-primary gap-2">
            <FontAwesomeIcon icon={faCheckCircle} />
            Lưu thay đổi
          </button>
        )}
      </div>
    </form>
  )
);

interface EmailChangeModalProps {
  currentEmail: string;
  onClose: () => void;
}

const EmailChangeModal = ({
  currentEmail,
  onClose,
}: EmailChangeModalProps) => {
  const [step, setStep] = useState<"request-current" | "verify-current" | "new-email" | "done">("request-current");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentEmailVerifiedToken, setCurrentEmailVerifiedToken] = useState("");
  const [maskedCurrentEmail, setMaskedCurrentEmail] = useState(currentEmail);
  const [maskedPendingEmail, setMaskedPendingEmail] = useState("");
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  const handleRequestCurrentVerification = async () => {
    try {
      setIsSubmitting(true);
      const response = await verificationsApi.requestCurrentEmailVerification();
      setMaskedCurrentEmail(response.data?.currentEmail || currentEmail);
      setExpiresIn(response.data?.expiresIn || null);
      toast.success(response.data?.message || "Mã xác thực đã được gửi.");
      setStep("verify-current");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể gửi mã xác thực.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCurrentEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.warning("Vui lòng nhập mã xác thực.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await verificationsApi.verifyCurrentEmailForChange(code.trim());
      setCurrentEmailVerifiedToken(response.data?.currentEmailVerifiedToken || "");
      setExpiresIn(response.data?.expiresIn || null);
      toast.success(response.data?.message || "Email hiện tại đã được xác thực.");
      setStep("new-email");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Mã xác thực không hợp lệ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestNewEmailConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newEmail = email.trim();

    if (!newEmail) {
      toast.warning("Vui lòng nhập email mới.");
      return;
    }
    if (newEmail === currentEmail) {
      toast.warning("Email mới phải khác email hiện tại.");
      return;
    }
    if (!currentEmailVerifiedToken) {
      toast.error("Phiên xác thực email hiện tại đã hết hạn. Vui lòng thực hiện lại.");
      setStep("request-current");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await verificationsApi.requestNewEmailConfirmation({
        currentEmailVerifiedToken,
        newEmail,
      });
      setMaskedPendingEmail(response.data?.pendingEmail || newEmail);
      setExpiresIn(response.data?.expiresIn || null);
      toast.success(response.data?.message || "Đã gửi email xác nhận đến email mới.");
      setStep("done");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể gửi xác nhận đến email mới.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="surface-card w-full max-w-md bg-surface p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Đổi email</h2>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              Xác thực email hiện tại trước, sau đó gửi link xác nhận đến email mới.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-neutral transition hover:bg-canvas hover:text-ink"
            title="Đóng"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-line bg-canvas p-3 text-sm text-ink-secondary">
          Email hiện tại: <strong className="break-all text-ink">{currentEmail}</strong>
        </div>

        {expiresIn && step !== "request-current" && (
          <p className="mt-3 text-xs font-medium text-ink-secondary">
            Mã hoặc phiên xác thực có hiệu lực trong {Math.floor(expiresIn / 60)} phút.
          </p>
        )}

        {step === "request-current" && (
          <div className="mt-5">
            <div className="rounded-lg border border-primary/20 bg-primary-soft p-4 text-sm text-ink-secondary">
              Bước 1: gửi mã xác thực đến email hiện tại để đảm bảo chính chủ đang yêu cầu đổi email.
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-secondary">
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRequestCurrentVerification}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi mã xác thực"}
              </button>
            </div>
          </div>
        )}

        {step === "verify-current" && (
          <form onSubmit={handleVerifyCurrentEmail} className="mt-5">
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Mã xác thực từ {maskedCurrentEmail}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-field mt-2 text-center text-lg font-semibold tracking-[0.3em]"
                placeholder="123456"
                maxLength={6}
                required
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleRequestCurrentVerification}
                disabled={isSubmitting}
                className="btn-secondary"
              >
                Gửi lại mã
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? "Đang xác thực..." : "Xác thực"}
              </button>
            </div>
          </form>
        )}

        {step === "new-email" && (
          <form onSubmit={handleRequestNewEmailConfirmation} className="mt-5">
            <label className="block">
              <span className="text-sm font-semibold text-ink">Email mới</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-2"
                placeholder="name@example.com"
                required
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-secondary">
                Hủy
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? "Đang gửi..." : "Gửi email xác nhận"}
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="mt-5">
            <div className="rounded-lg border border-success/20 bg-success/10 p-4">
              <p className="flex items-center gap-2 font-semibold text-success">
                <FontAwesomeIcon icon={faCheckCircle} />
                Đã gửi email xác nhận
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">
                Vui lòng mở hộp thư <strong className="text-ink">{maskedPendingEmail}</strong> và bấm link xác nhận để hoàn tất đổi email.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={onClose} className="btn-primary">
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function Profile() {
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userUpdate, setUserUpdate] = useState<UserUpdateData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isReload, setIsReload] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userApi.getUserById();
        const normalizedUser = normalizeUser(response.data);
        setUser(normalizedUser);
        setUserUpdate({ fullName: normalizedUser.fullName || "" });
      } catch (error: any) {
        toast.error("Không thể tải dữ liệu người dùng.");
        console.error("Error fetching user data:", error.message);
      }
    };

    fetchUserData();
  }, [isReload]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const clearSelectedImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setSelectedImage(null);
  }, [imagePreview]);

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 3 * 1024 * 1024) {
        toast.warning("Vui lòng chọn ảnh nhỏ hơn 3MB.");
        e.target.value = "";
        return;
      }

      if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
        toast.warning("Chỉ hỗ trợ PNG, JPG, JPEG hoặc WEBP.");
        e.target.value = "";
        return;
      }

      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      e.target.value = "";
    },
    [imagePreview]
  );

  const handleImageUpload = useCallback(async () => {
    if (!selectedImage) return;
    if (!user?.userId) {
      toast.error("Không thể xác định người dùng.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      setIsSavingImage(true);
      const response = await userApi.updateImage(formData);
      const data: UpdateResponse = response.data;

      if (data.success) {
        toast.success(data.message);
        const updatedUser = normalizeUser({
          ...user,
          ...(data.user || {}),
          avatarUrl: data.user?.avatar || data.user?.avatarUrl || data.user?.avatar_url,
        });
        Cookies.set("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        clearSelectedImage();
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error("Lỗi khi tải ảnh lên.");
      console.error("Error uploading image:", error.message);
    } finally {
      setIsSavingImage(false);
    }
  }, [clearSelectedImage, selectedImage, user]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!userUpdate) return;

      try {
        setIsSaving(true);
        const response = await userApi.updateUser({
          fullName: userUpdate.fullName,
        });
        const responseData: UpdateResponse = response.data;
        if (responseData.success) {
          toast.success(responseData.message);
          const updatedUser = normalizeUser({
            ...user,
            ...(responseData.user || {}),
            fullName: responseData.user?.fullName || responseData.user?.full_name || userUpdate.fullName,
          });
          Cookies.set("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          setIsReload((prev) => !prev);
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
    [user, userUpdate]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUserUpdate((prev) => ({
      ...prev!,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const tabContent = useMemo(() => {
    if (!user || !userUpdate) return null;

    if (activeTab === "overview") {
      return (
        <OverviewTab
          user={user}
          selectedImage={selectedImage}
          imagePreview={imagePreview}
          isSavingImage={isSavingImage}
          onImageSelect={handleImageSelect}
          onImageUpload={handleImageUpload}
          onClearImage={clearSelectedImage}
          onOpenEmailModal={() => setIsEmailModalOpen(true)}
        />
      );
    }

    return (
      <UpdateTab
        user={userUpdate}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReload={() => setIsReload((prev) => !prev)}
        isSaving={isSaving}
      />
    );
  }, [
    activeTab,
    clearSelectedImage,
    handleChange,
    handleImageSelect,
    handleImageUpload,
    handleSubmit,
    imagePreview,
    isSaving,
    isSavingImage,
    selectedImage,
    user,
    userUpdate,
  ]);

  if (user === null) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageTitle
        title="Thông tin cá nhân"
        description="Quản lý thông tin cá nhân của bạn"
      />
      <div>
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-primary">Hồ sơ tài khoản</p>
          <h1 className="text-2xl font-bold text-ink">Thông tin cá nhân</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Quản lý ảnh đại diện, tên hiển thị và email xác nhận của tài khoản.
          </p>
        </div>

        <div className="mb-6 inline-flex rounded-lg border border-line bg-surface p-1">
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

        {tabContent}
      </div>

      {isEmailModalOpen && (
        <EmailChangeModal
          currentEmail={user.email}
          onClose={() => setIsEmailModalOpen(false)}
        />
      )}
    </>
  );
}

export default Profile;
