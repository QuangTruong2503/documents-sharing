export type LibraryArea = "my" | "shared" | "team" | "recent" | "favorites" | "shared-links" | "activity" | "trash";
export const libraryLabels: Record<LibraryArea, string> = {
  my: "Tài liệu của tôi", shared: "Được chia sẻ với tôi", team: "Thư viện nhóm", recent: "Gần đây",
  favorites: "Yêu thích", "shared-links": "Liên kết đã chia sẻ", activity: "Hoạt động", trash: "Thùng rác",
};
export const validArea = (raw: unknown): LibraryArea => typeof raw === "string" && Object.prototype.hasOwnProperty.call(libraryLabels, raw) ? raw as LibraryArea : "my";
export const validSort = (raw: string | null, trash = false) => {
  const allowed = trash ? ["deleted_desc", "deleted_asc", "name_asc", "name_desc"] : ["updated_desc", "updated_asc", "name_asc", "name_desc", "type", "size_desc"];
  return raw && allowed.includes(raw) ? raw : allowed[0];
};
export const preferredView = (raw: string | null): "grid" | "list" => {
  if (raw === "list" || raw === "grid") return raw;
  try { return localStorage.getItem("library.view") === "list" ? "list" : "grid"; } catch { return "grid"; }
};
export const saveView = (view: string) => { try { localStorage.setItem("library.view", view); } catch {} };
export const patchQuery = (current: URLSearchParams, patch: Record<string, string>, resetPage = false) => {
  const next = new URLSearchParams(current);
  Object.entries(patch).forEach(([key,value]) => value ? next.set(key,value) : next.delete(key));
  if (resetPage) next.set("pageNumber", "1");
  return next;
};
