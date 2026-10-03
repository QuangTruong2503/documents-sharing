import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import userApi from "api/usersApi";
import { normalizeUser } from "utils/userMapper";

export default function RequireAuth({ children, admin = false }) {
  const location = useLocation();
  const token = Cookies.get("token");
  const signedIn = Boolean(token && Cookies.get("user"));
  const [verification, setVerification] = useState(null);
  useEffect(() => {
    if (!admin || !signedIn) return;
    let ignore = false;
    userApi.getUserById()
      .then((response) => {
        if (!ignore) setVerification({ token, allowed: normalizeUser(response.data?.user || response.data).role === "admin" });
      })
      .catch(() => { if (!ignore) setVerification({ token, allowed: false }); });
    return () => { ignore = true; };
  }, [admin, signedIn, token]);
  if (!signedIn) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`} replace />;
  if (admin && verification?.token !== token) return <p role="status">Đang kiểm tra quyền truy cập...</p>;
  if (admin && !verification?.allowed) return <Navigate to="/" replace />;
  return children;
}
