import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import verificationsApi from "../../api/verificationsApi";

interface User {
  user_id: string;
  is_verified: boolean;
  email: string;
}
function VerifyEmailButton({ user }: { user: User }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [countdown, setCountdown] = useState(0); // giây

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

      // Xử lý gửi yêu cầu xác thực email
    const handleVerifyEmail = async () => {
      if (!user.email) {
        toast.error("Không có email để xác thực.");
        return;
      }

      try {
        setIsSendingVerification(true);
        const response = await verificationsApi.generateVerifyEmailToken(
          user.email
        );
        setVerificationMessage(response.data.message);
        setCountdown(120); // 2 phút = 120 giây
        toast.success("Đã gửi mã xác thực thành công!");
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Lỗi khi gửi mã xác thực."
        );
        console.error("Error verifying email:", error.message);
      } finally {
        setIsSendingVerification(false);
      }
    };

  return (
    <div>
      {/* Thông tin xác thực */}
      <div className="flex gap-2 items-end">
        {user.is_verified ?(
          <button
            className={"mt-1 text-sm font-semibold bg-gray-400 cursor-not-allowed text-white px-3 py-1 rounded-lg"}
            disabled={true}
          >
            Đã xác thực Email
          </button>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isSendingVerification || countdown > 0}
            className={`mt-1 text-sm font-semibold text-blue-600 hover:underline ${
              isSendingVerification || countdown > 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isSendingVerification ? "Đang gửi..." : "Xác thực email"}
          </button>
        )}
      </div>

      {/* Modal xác nhận */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              Xác nhận gửi email xác thực
            </h3>

            <p className="mb-4">
              Bạn có muốn gửi mã xác thực đến email:
              <br />
              <strong>{user.email}</strong>
            </p>

            {verificationMessage && (
              <div className="mb-4 text-sm text-green-600">
                {verificationMessage}
                {countdown > 0 && (
                  <span className="font-semibold text-black">
                    {" "}
                    (Gửi lại sau {Math.floor(countdown / 60)}:
                    {(countdown % 60).toString().padStart(2, "0")})
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Đóng
              </button>

              <button
                onClick={handleVerifyEmail}
                disabled={isSendingVerification || countdown > 0}
                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                  isSendingVerification || countdown > 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isSendingVerification ? "Đang gửi..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifyEmailButton;
