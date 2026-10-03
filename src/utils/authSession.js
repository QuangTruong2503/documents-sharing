import Cookies from "js-cookie";
import { UAParser } from "ua-parser-js";

export const getDeviceInfo = () => {
  try {
    const parser = new UAParser();
    const result = parser.getResult();
    const deviceName = result.device.model || result.device.type || "PC";
    const osInfo = `${result.os.name || "Unknown"} ${result.os.version || ""}`.trim();
    const browserInfo = `${result.browser.name || "Unknown Browser"} ${result.browser.version || ""}`.trim();

    return `${deviceName} | ${osInfo} | ${browserInfo}`;
  } catch {
    return "Unknown Device";
  }
};

export const saveAuthSession = ({ token, user, expires = undefined, expiresIn = undefined }) => {
  const cookieExpires = expires ?? (expiresIn ? expiresIn / 86400 : 3);
  Cookies.set("token", token, cookieOptions(cookieExpires));
  Cookies.set("user", JSON.stringify(user), cookieOptions(cookieExpires));
};

const cookieOptions = (expires) => ({ expires, sameSite: "strict", secure: window.location.protocol === "https:" });

export const updateStoredUser = (user) => {
  const token = Cookies.get("token");
  if (!token) return;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.exp || payload.exp * 1000 <= Date.now()) return;
    Cookies.set("user", JSON.stringify(user), cookieOptions(new Date(payload.exp * 1000)));
  } catch {
    // Do not extend an unreadable or expired session.
  }
};
