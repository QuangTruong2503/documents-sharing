import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import Loader from "../../Component/Loaders/Loader";
import PageTitle from "../../Component/PageTitle";
import verificationsApi from "../../api/verificationsApi";

const ConfirmChangeEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const confirmChangeEmail = async () => {
      if (!token) {
        setMessage("Token đổi email không hợp lệ.");
        setIsSuccess(false);
        setLoading(false);
        return;
      }

      try {
        const response = await verificationsApi.confirmChangeEmail(token);
        setMessage(response.data?.message || "Đổi email thành công.");
        setEmail(response.data?.email || "");
        setIsSuccess(true);
      } catch (error: any) {
        setMessage(
          error.response?.data?.message || "Đã xảy ra lỗi khi xác nhận đổi email."
        );
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    confirmChangeEmail();
  }, [token]);

  return (
    <>
      <PageTitle title="Xác nhận đổi email" description="Hoàn tất đổi email tài khoản" />
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
        <div className="surface-card w-full max-w-md p-8 text-center shadow-card">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader />
              <p className="text-sm text-ink-secondary">Đang xác nhận đổi email...</p>
            </div>
          ) : (
            <>
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                  isSuccess ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}
              >
                <FontAwesomeIcon
                  icon={isSuccess ? faCircleCheck : faCircleExclamation}
                  className="text-3xl"
                />
              </div>
              <h1 className="mt-5 text-2xl font-bold text-ink">
                {isSuccess ? "Đổi email thành công" : "Không thể đổi email"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-ink-secondary">{message}</p>
              {email && (
                <p className="mt-3 rounded-md bg-canvas px-3 py-2 text-sm font-semibold text-ink">
                  {email}
                </p>
              )}
              <Link to="/account/profile" className="btn-primary mt-6">
                Về trang tài khoản
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ConfirmChangeEmail;
