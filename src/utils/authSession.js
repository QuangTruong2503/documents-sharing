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

export const saveAuthSession = ({ token, user, expires = 3 }) => {
  const cookieOptions = {
    expires,
    sameSite: "strict",
    secure: window.location.protocol === "https:",
  };

  Cookies.set("token", token, cookieOptions);
  Cookies.set("user", JSON.stringify(user), cookieOptions);
};
