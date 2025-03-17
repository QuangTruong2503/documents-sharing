import Cookies from "js-cookie";

export const CheckSigned = () => {
  const token = Cookies.get("token");
    const userToken = Cookies.get("user")
    // Kiểm tra token
    if (token && userToken) {
      // Chuyển hướng nếu đã đăng nhập
      window.location.href = '/';
    } else {
      // Cuộn lên đầu trang nếu chưa đăng nhập
      window.scrollTo(0, 0);
    }
};

export const checkNotSigned = () =>{
  const token = Cookies.get("token");
    const userToken = Cookies.get("user")
    // Kiểm tra token
    if (!token && !userToken) {
      // Chuyển hướng nếu chưa đăng nhập
      window.location.href = '/login';
      return;
    }
};