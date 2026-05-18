import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import userApi from "api/usersApi";
import { toast } from "react-toastify";
import LoaderButton from "components/Loaders/LoaderButton";
import PageTitle from "components/PageTitle";

interface Register {
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterResponse {
  message: string;
  success: boolean;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [registerData, setRegisterData] = useState<Register>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const scrollToRef = useRef<HTMLDivElement>(null);

  // Scroll effect
  useEffect(() => {
    scrollToRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value.trim() }));
  };

  // Toggle password visibility
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    return {
      hasUpperCase,
      hasNumber,
      hasSpecialChar,
      isLongEnough,
      isValid: hasUpperCase && hasNumber && hasSpecialChar && isLongEnough,
    };
  };

  // Form validation
  const validateForm = () => {
    const { email, password, confirmPassword } = registerData;
    const passwordStrength = checkPasswordStrength(password);

    if (!email || !password || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email không hợp lệ");
      return false;
    }

    if (!passwordStrength.isValid) {
      toast.error(
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái in hoa, số và ký tự đặc biệt"
      );
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsActing(true);
      const response = await userApi.postRegister(registerData);
      const data: RegisterResponse = response.data;

      if (data.success) {
        toast.success(data.message);
        setTimeout(() => navigate("/login"), 1000);
      } else {
        toast.warning(data.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại"
      );
      console.error("Registration error:", error);
    } finally {
      setIsActing(false);
    }
  };

  const passwordStrength = checkPasswordStrength(registerData.password);

  return (
    <>
      <PageTitle  title="Đăng ký" description="Đăng ký tài khoản mới để sử dụng hệ thống" />
      <section ref={scrollToRef} className="">
      <div className="mx-auto flex flex-col items-center justify-center px-6 py-8">
        <a
          href="/"
          className="mb-6 flex items-center font-display text-2xl font-bold tracking-[-0.03em] text-ink"
        >
          <img
            className="w-8 h-8 mr-2"
            src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg"
            alt="logo"
          />
          DocShare
        </a>
        <div className="surface-card w-full sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="font-display text-2xl font-bold leading-tight tracking-[-0.03em] text-ink">
              Tạo tài khoản
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={registerData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="name@company.com"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Mật khẩu
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={registerData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Xác nhận mật khẩu
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>
              {/* Password strength indicators */}
              {registerData.password && (
                  <div className="text-sm text-ink-secondary">
                    <p className={passwordStrength.isLongEnough ? "text-success" : "text-danger"}>
                      ✓ Tối thiểu 8 ký tự
                    </p>
                    <p className={passwordStrength.hasUpperCase ? "text-success" : "text-danger"}>
                      ✓ Chữ cái in hoa
                    </p>
                    <p className={passwordStrength.hasNumber ? "text-success" : "text-danger"}>
                      ✓ Số
                    </p>
                    <p className={passwordStrength.hasSpecialChar ? "text-success" : "text-danger"}>
                      ✓ Ký tự đặc biệt (!@#$%^&*)
                    </p>
                  </div>
                )}
              <div className="flex items-center gap-2">
                <input
                  id="showPass"
                  type="checkbox"
                  checked={showPassword}
                  onChange={toggleShowPassword}
                  className="h-5 w-5 rounded-full border border-line text-primary focus:ring-primary"
                />
                <label
                  htmlFor="showPass"
                  className="cursor-pointer text-sm text-ink-secondary"
                >
                  Hiện mật khẩu
                </label>
              </div>
              <button
                type="submit"
                disabled={isActing}
                className={`btn-primary w-full px-5 py-2.5 ${
                  isActing ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isActing ? <LoaderButton /> : "Tạo mới tài khoản"}
              </button>
              <p className="text-sm font-light text-ink-secondary">
                Đã có tài khoản?{" "}
                <NavLink
                  to="/login"
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  Đăng nhập
                </NavLink>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

export default RegisterPage;
