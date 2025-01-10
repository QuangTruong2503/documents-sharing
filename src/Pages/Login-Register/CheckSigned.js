import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const CheckSigned = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");

    // Kiểm tra token
    if (token) {
      // Chuyển hướng nếu đã đăng nhập
      navigate("/");
    } else {
      // Cuộn lên đầu trang nếu chưa đăng nhập
      window.scrollTo(0, 0);
    }
  }, [navigate]);

  return null;
};

export default CheckSigned;
