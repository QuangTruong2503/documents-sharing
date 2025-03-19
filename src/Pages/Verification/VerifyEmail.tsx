import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import verificationsApi from "../../api/verificationsApi";
import Loader from "../../Component/Loaders/Loader";

const VerifyEmail = () => {
  const { token } = useParams(); // Get token from URL params
  const [message, setMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  useEffect(() => {
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
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex justify-center bg-white">
      <div className="p-8 max-w-md w-full h-fit text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Xác thực Email
        </h1>
        {isSuccess !== null && isSuccess && (
          <img
            src="https://img.freepik.com/free-vector/college-admission-concept-illustration_114360-10529.jpg?t=st=1742393936~exp=1742397536~hmac=85600e90740ba5af5b39d6ec87f2d1edbc777fdcb26a8cdb1227c9c412666ddb&w=826"
            alt="success"
            className="w-full h-full mx-auto"
          />
        )}
        {isSuccess !== null && !isSuccess && (
          <img
            src="https://img.freepik.com/free-vector/computer-user-blocking-envelope-character_1284-63447.jpg?t=st=1742394119~exp=1742397719~hmac=2cc289b61ba233a2a978bea86ac3743fdb4b9de347da2cef3b7bbb6c2ddb7c99&w=826"
            alt="error"
            className="w-full h-full mx-auto"
          />
        )}
        {message ? (
          <p
            className={`text-lg ${
              isSuccess ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        ) : (
          <div className="flex flex-col items-center">
            <Loader />
            <p className="text-lg text-gray-600">Đang xác thực...</p>
          </div>
        )}
        {isSuccess && (
          <a
            href="/account/profile"
            className="mt-4 inline-block text-blue-500 hover:underline"
          >
            Quay lại trang đăng nhập
          </a>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
