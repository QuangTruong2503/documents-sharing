import Cookies from "js-cookie";
export const readDocumentHistory = () => {
  try {
    const history = JSON.parse(Cookies.get("documentHistory") || "[]");
    return Array.isArray(history) ? history.filter((id) => typeof id === "string") : [];
  } catch { return []; }
};
