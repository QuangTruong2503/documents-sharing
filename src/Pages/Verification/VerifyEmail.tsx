import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import verificationsApi from "../../api/verificationsApi";
import Loader from "../../Component/Loaders/Loader";
import PageTitle from "../../Component/PageTitle";

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setMessage("Token xác thực không hợp lệ.");
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await verificationsApi.verifyEmailToken(token);
        setMessage(response.data.message);
        setIsSuccess(true);
      } catch (error: any) {
        setMessage(
          error.response?.data?.message || "Đã xảy ra lỗi khi xác thực email."
        );
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <>
      <PageTitle title="Xác thực email" description="Xác thực Email của bạn" />

      <div className="min-h-screen flex justify-center bg-white">
        <div className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            Xác thực Email
          </h1>

          {loading ? (
            <div className="flex flex-col items-center">
              <Loader />
              <p className="text-lg text-gray-600 mt-2">Đang xác thực...</p>
            </div>
          ) : (
            <>
              {isSuccess && (
                <img
                  src="https://res.cloudinary.com/brandocloud/image/upload/v1742535076/DocShare/images/verify-email-success_l9nsyg.jpg"
                  alt="success"
                  className="w-full mx-auto"
                />
              )}

              {isSuccess === false && (
                <img
                  src="https://res.cloudinary.com/brandocloud/image/upload/v1742535075/DocShare/images/verify-failed_isb1cq.jpg"
                  alt="error"
                  className="w-full mx-auto"
                />
              )}

              <p
                className={`text-lg mt-4 ${
                  isSuccess ? "text-green-600" : "text-red-600"
                }`}
              >
                {message}
              </p>

              {isSuccess && (
                <Link
                  to="/"
                  className="mt-4 inline-block text-blue-500 hover:underline"
                >
                  Quay lại trang đăng nhập
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default VerifyEmail;
