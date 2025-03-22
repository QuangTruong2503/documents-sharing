import React, { useState } from "react";
import  verificationsApi from "../../api/verificationsApi.js"// Đường dẫn tới file API của bạn
import PageTitle from "../../Component/PageTitle.js";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Hàm xử lý gửi yêu cầu reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (countdown > 0) {
      setError("Vui lòng đợi " + countdown + " giây trước khi gửi lại");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      // Gọi API generateResetPasswordToken
      await verificationsApi.generateResetPasswordToken( email );

      // Nếu thành công, bắt đầu đếm ngược 2 phút (120 giây)
      setSuccess(true);
      setCountdown(120);
      
      // Tạo interval để giảm countdown mỗi giây
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError("Có lỗi xảy ra: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="Quên mật khẩu" description="Nhập email của bạn để nhận hướng dẫn khôi phục mật khẩu." />
      <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto">
        <a
          href="/s"
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
            Bạn quên mật khẩu?
          </h1>
          <p className="font-light text-gray-500 dark:text-gray-400">
            Đừng lo lắng! Chỉ cần nhập email của bạn và chúng tôi sẽ gửi cho bạn Email để đặt lại mật khẩu
          </p>

          <form className="mt-4 space-y-4 lg:mt-5 md:space-y-5" onSubmit={handleResetPassword}>
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@company.com"
                required
              />
            </div>

            {/* Hiển thị thông báo */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">Email đặt lại mật khẩu đã được gửi! <br /> Kiểm tra thư mục Rác nếu không thấy Email.</p>}
            {countdown > 0 && (
              <p className="text-gray-500 text-sm">
                Có thể gửi lại sau {countdown} giây
              </p>
            )}

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="terms"
                  className="font-light text-gray-500 dark:text-gray-300"
                >
                  I accept the{" "}
                  <a
                    className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                    href="/s"
                  >
                    Terms and Conditions
                  </a>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || countdown > 0}
              className={`w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 ${
                (isLoading || countdown > 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? "Đang gửi..." : "Reset password"}
            </button>
          </form>
        </div>
      </div>
    </section>
    </>
  );
}

export default ForgotPassword;