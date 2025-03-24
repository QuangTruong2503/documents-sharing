import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import userApi from "../../api/usersApi";
import { toast } from "react-toastify";
import LoaderButton from "../../Component/Loaders/LoaderButton";
import PageTitle from "../../Component/PageTitle";

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
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto">
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
        <div className="w-full bg-gray-50 rounded-lg shadow-lg shadow-slate-300 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Tạo tài khoản
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
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
                  value={registerData.email}
                  onChange={handleInputChange}
                  className=" border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="name@company.com"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
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
                  className=" border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
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
                  className=" border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  required
                />
              </div>
              {/* Password strength indicators */}
              {registerData.password && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className={passwordStrength.isLongEnough ? "text-green-500" : "text-red-500"}>
                      ✓ Tối thiểu 8 ký tự
                    </p>
                    <p className={passwordStrength.hasUpperCase ? "text-green-500" : "text-red-500"}>
                      ✓ Chữ cái in hoa
                    </p>
                    <p className={passwordStrength.hasNumber ? "text-green-500" : "text-red-500"}>
                      ✓ Số
                    </p>
                    <p className={passwordStrength.hasSpecialChar ? "text-green-500" : "text-red-500"}>
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
                  className="w-4 h-4 border border-gray-300 rounded  focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-500"
                />
                <label
                  htmlFor="showPass"
                  className="text-sm text-gray-500 dark:text-gray-300 cursor-pointer"
                >
                  Hiện mật khẩu
                </label>
              </div>
              <button
                type="submit"
                disabled={isActing}
                className={`w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 ${
                  isActing ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isActing ? <LoaderButton /> : "Tạo mới tài khoản"}
              </button>
              <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Đã có tài khoản?{" "}
                <NavLink
                  to="/login"
                  className="font-medium text-blue-600 hover:underline dark:text-blue-500"
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