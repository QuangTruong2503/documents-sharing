import Cookies from "js-cookie";

export const CheckSigned = () => {
  const token = Cookies.get("token");
    const userToken = Cookies.get("user")
    // Kiểm tra token
    if (token && userToken) {
      // Chuyển hướng nếu đã đăng nhập
      window.location.href = '/';
    } else {
      //Xóa thông tin đăng nhập nếu không có token
      Cookies.remove("token");
      Cookies.remove("user");
      // Cuộn lên đầu trang nếu chưa đăng nhập
      window.scrollTo(0, 0);
    }
};

export const checkNotSigned = () =>{
  const token = Cookies.get("token");
    const userToken = Cookies.get("user")
    // Kiểm tra token
    if (!token && !userToken) {
      //Xóa thông tin đăng nhập nếu không có token
      Cookies.remove("token");
      Cookies.remove("user");
      // Chuyển hướng nếu chưa đăng nhập
      window.location.href = '/login';
      return;
    }
};