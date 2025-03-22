import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import verificationsApi from "../../api/verificationsApi"; // Đường dẫn tới file API của bạn
import PageTitle from "../../Component/PageTitle";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State để kiểm soát hiển thị mật khẩu
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);

  const { token } = useParams(); // Lấy token từ URL params
  const navigate = useNavigate();

  // Kiểm tra token khi component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setIsLoading(true);
        // Gọi API để verify token
        await verificationsApi.verifyResetPasswordToken(token);
        setIsTokenValid(true);
      } catch (err) {
        setError("Token không hợp lệ hoặc đã hết hạn");
        setIsTokenValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  // Xử lý submit form reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Kiểm tra mật khẩu xác nhận
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    // Kiểm tra độ dài mật khẩu
    if (newPassword.length < 8) {
      setError("Mật khẩu phải dài ít nhất 8 ký tự");
      return;
    }

    // Kiểm tra mật khẩu có ít nhất 1 chữ hoa, 1 ký tự đặc biệt và 1 số
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 ký tự đặc biệt và 1 số");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Gọi lại API verify với mật khẩu mới
      await verificationsApi.changePassword({
        token,
        newPassword,
      });

      setSuccess(true);
      // Chuyển hướng về trang login sau 2 giây
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError("Có lỗi xảy ra: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu token đang được kiểm tra
  if (isLoading && !isTokenValid) {
    return (
      <>
        <PageTitle title="Đang xác thực token" description="Vui lòng đợi trong giây lát..." />
        <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <p className="text-gray-900 dark:text-white">Đang kiểm tra token...</p>
      </section>
      </>
    );
  }

  // Nếu token không hợp lệ
  if (!isTokenValid) {
    return (
      <>
        <PageTitle title="Token không hợp lệ" description="Token không hợp lệ hoặc đã hết hạn." />
        <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {error || "Token không hợp lệ hoặc đã hết hạn"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Vui lòng thử lại hoặc liên hệ với chúng tôi nếu bạn cần hỗ trợ <a href="mailto:trutruong2503@gmail.com" className="underline font-semibold text-black">Liên Hệ</a>
          </p>          
          <a
            href="/forgot-password"
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-500"
          >
            Quay lại trang quên mật khẩu
          </a>
        </div>
      </section>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Đổi mật khẩu" description="Nhập mật khẩu mới để đổi mật khẩu của bạn." />
      <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen">
        <a
          href="/"
          className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
        >
          <img
            className="w-8 h-8 mr-2"
            src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg"
            alt="logo"
          />
          DocShare
        </a>
        <div className="w-full p-6 bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md dark:bg-gray-800 dark:border-gray-700 sm:p-8">
          <h1 className="mb-1 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
            Đặt lại mật khẩu
          </h1>
          <p className="font-light text-gray-500 dark:text-gray-400">
            Nhập mật khẩu mới của bạn
          </p>

          <form className="mt-4 space-y-4 lg:mt-5 md:space-y-5" onSubmit={handleResetPassword}>
            <div>
              <label
                htmlFor="new-password"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Mật khẩu mới
              </label>
              <input
                type={isPasswordVisible ? "text" : "password"}
                name="new-password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Xác nhận mật khẩu
              </label>
              <input
                type={isPasswordVisible ? "text" : "password"}
                name="confirm-password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-password"
                checked={isPasswordVisible}
                onChange={() => setIsPasswordVisible(!isPasswordVisible)}
                className="mr-2"
              />
              <label htmlFor="show-password" className="text-sm text-gray-900 dark:text-white">
                Hiển thị mật khẩu
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && (
              <p className="text-green-500 text-sm">
                Đặt lại mật khẩu thành công! Đang chuyển hướng...
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </form>
        </div>
      </div>
    </section>
    </>
  );
}

export default ResetPassword;