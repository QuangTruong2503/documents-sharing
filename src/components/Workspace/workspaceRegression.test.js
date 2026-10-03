global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const { MemoryRouter, Routes, Route } = require("react-router-dom");
const api = require("api/workspaceLibraryApi.ts").default;
const { toast } = require("react-toastify");
const LibraryLayout = require("pages/Library/LibraryLayout.tsx").default;
const MyLibraryPage = require("pages/Library/MyLibraryPage.tsx").default;
const FolderDetailPage = require("pages/Folders/FolderDetailPage.tsx").default;
const foldersApi = require("api/foldersApi.js").default;
const PreviewDrawer = require("./PreviewDrawer.tsx").default;
const ShareDialog = require("./dialogs/ShareDialog.tsx").default;
const MoveCopyDialog = require("./dialogs/MoveCopyDialog.tsx").default;
const useWorkspaceSelection = require("hooks/useWorkspaceSelection.ts").default;
const { copyTextToClipboard } = require("utils/workspaceItemLinks.ts");
// CRA's Jest resolver predates package exports; use React Router's CJS entry.
jest.mock("react-router-dom", () => require("../../../node_modules/react-router/dist/development/index.js"), { virtual: true });
jest.mock("api/workspaceLibraryApi.ts", () => ({ __esModule: true, default: {
  getSummary: jest.fn(), getMyLibrary: jest.fn(), getFavorites: jest.fn(), getTrash: jest.fn(),
  getDocumentPreview: jest.fn(), getShareLinkSettings: jest.fn(), createShareLink: jest.fn(),
  setFavorite: jest.fn(), getFolderTree: jest.fn(), moveItems: jest.fn(), copyItems: jest.fn(), getFolderItems: jest.fn(),
} }));
jest.mock("react-toastify", () => ({ toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }));
jest.mock("components/PageTitle.js", () => () => null);
jest.mock("api/documentsApi", () => ({}));
jest.mock("api/foldersApi.js", () => ({ __esModule: true, default: { getFolderMembers: jest.fn(), getFolderInvites: jest.fn() }, folderRoles: ["viewer", "editor"] }));
jest.mock("utils/workspaceItemLinks.ts", () => ({ copyTextToClipboard: jest.fn(), copyWorkspaceItemLink: jest.fn() }));

let root, host;
const permissions = { canView: true, canShare: true, canDownload: true, canRename: true, canMove: true, canDelete: true, canCopy: true };
const item = { id: 1, type: "document", name: "Tài liệu A", extension: "pdf", permissions, isFavorite: true };
const response = { items: [item], pagination: { currentPage: 1, pageSize: 50, totalCount: 51, totalPages: 2 } };
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const render = async node => { await act(async () => root.render(node)); };
const click = async element => { expect(element).toBeTruthy(); await act(async () => element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))); };
const byText = (tag, text) => Array.from(document.querySelectorAll(tag)).find(el => el.textContent.trim() === text);
const library = entry => <MemoryRouter initialEntries={[entry]}><Routes><Route path="/library" element={<LibraryLayout />}><Route index element={<MyLibraryPage />} /></Route></Routes></MemoryRouter>;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks(); localStorage.clear();
  HTMLElement.prototype.scrollIntoView = jest.fn();
  HTMLElement.prototype.getClientRects = () => [{ width: 10, height: 10 }];
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  api.getSummary.mockResolvedValue({ counts: { my: 51, favorites: 1, trash: 2, sharedLinks: 3 }, storage: { usedBytes: 100, limitBytes: 1000 } });
  api.getMyLibrary.mockResolvedValue(response); api.getFavorites.mockResolvedValue(response);
  api.getTrash.mockResolvedValue({ items: [item], pagination: response.pagination });
  api.getDocumentPreview.mockResolvedValue({ document: item });
  api.getShareLinkSettings.mockResolvedValue({ shareLink: null });
  copyTextToClipboard.mockResolvedValue();
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); document.body.style.overflow = ""; });

test("area navigation resets search/selection, preserves list view and makes one trash request", async () => {
  await render(library("/library?search=abc&view=list"));
  expect(host.textContent).toContain("51 mục");
  await click(host.querySelector('[aria-label="Chọn mục"]'));
  expect(host.textContent).toContain("1 mục đã chọn");
  await click(byText("a", "Thùng rác2"));
  expect(api.getTrash).toHaveBeenCalledTimes(1);
  expect(api.getTrash.mock.calls[0][0].sort).toBe("deleted_desc");
  expect(host.querySelector('input[placeholder*="Tìm"]').value).toBe("");
  expect(host.textContent).not.toContain("1 mục đã chọn");
  expect(host.querySelector('[aria-label="Xem dạng danh sách"]').getAttribute("aria-pressed")).toBe("true");
  expect(host.querySelector('[aria-label="Bỏ yêu thích"]')).toBeNull();
  expect(api.getSummary).toHaveBeenCalledTimes(1);
});

test("invalid area falls back to my and file type updates immediately", async () => {
  await render(library("/library?area=abc"));
  expect(host.querySelector("h1").textContent).toBe("Tài liệu của tôi");
  const select = Array.from(host.querySelectorAll("select")).find(el => Array.from(el.options).some(option => option.value === "image"));
  await act(async () => { select.value = "image"; select.dispatchEvent(new Event("change", { bubbles: true })); });
  expect(api.getMyLibrary).toHaveBeenLastCalledWith(expect.objectContaining({ fileType: "image", pageNumber: 1 }));
});

test("unfavorite removes immediately and restores item/count when the API fails", async () => {
  const pending = deferred(); api.setFavorite.mockReturnValue(pending.promise);
  await render(library("/library?area=favorites"));
  await click(host.querySelector('[aria-label="Bỏ yêu thích"]'));
  expect(host.querySelector('[aria-label="Bỏ yêu thích"]')).toBeNull();
  expect(host.textContent).toContain("50 mục");
  await act(async () => pending.reject(new Error("offline")));
  expect(host.querySelector('[aria-label="Bỏ yêu thích"]')).not.toBeNull();
  expect(host.textContent).toContain("51 mục");
  expect(toast.error).toHaveBeenCalled();
});

test("late preview response cannot replace the latest document", async () => {
  const first = deferred(), second = deferred(); api.getDocumentPreview.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const preview = value => <MemoryRouter><PreviewDrawer item={value} onClose={() => {}} onShare={() => {}} /></MemoryRouter>;
  await render(preview(item));
  await render(preview({ ...item, id: 2, name: "Tài liệu B" }));
  await act(async () => second.resolve({ document: { ...item, id: 2, name: "Nội dung B" } }));
  await act(async () => first.resolve({ document: { ...item, name: "Nội dung A" } }));
  expect(document.querySelector('[role="dialog"]').textContent).toContain("Nội dung B");
  expect(document.querySelector('[role="dialog"]').textContent).not.toContain("Nội dung A");
});

test("copy link creates a missing link and catches clipboard errors", async () => {
  api.createShareLink.mockResolvedValue({ shareLink: { id: "token", shareUrl: "https://example.com/s/token" } });
  await render(<MemoryRouter initialEntries={["/library"]}><Routes><Route path="/library" element={<LibraryLayout />}><Route index element={<ShareDialog item={item} onClose={() => {}} />} /></Route></Routes></MemoryRouter>);
  await click(byText("button", "Sao chép liên kết"));
  expect(copyTextToClipboard).toHaveBeenCalledWith("https://example.com/s/token");
  copyTextToClipboard.mockRejectedValue(new Error("denied"));
  await click(byText("button", "Sao chép liên kết"));
  expect(toast.error).toHaveBeenCalledWith("Không thể sao chép liên kết.");
});

test("move destination requires selection and blocks source, descendants and current parent", async () => {
  api.getFolderTree.mockResolvedValue({ nodes: [{ id: 10, name: "Cha", rootArea: "my", canReceiveItems: true, children: [{ id: 11, name: "Nguồn", rootArea: "my", canReceiveItems: true, children: [{ id: 12, name: "Con", rootArea: "my", canReceiveItems: true, children: [] }] }] }] });
  await render(<MoveCopyDialog mode="move" items={[{ id: 11, type: "folder", name: "Nguồn", parentFolderId: 10 }]} onClose={() => {}} onDone={() => {}} />);
  expect(byText("button", "Xác nhận").disabled).toBe(true);
  expect(byText("span", "Cha").closest("label").querySelector("input").disabled).toBe(true);
  expect(byText("span", "Nguồn").closest("label").querySelector("input").disabled).toBe(true);
  await click(document.querySelector('[aria-label="Nguồn"]'));
  expect(byText("span", "Con").closest("label").querySelector("input").disabled).toBe(true);
});

test("shift selection selects a range and clears the anchor with selection", async () => {
  const items = [item, { ...item, id: 2 }, { ...item, id: 3 }];
  function Selection() {
    const { selectedKeys, toggleSelection, setSelectedKeys } = useWorkspaceSelection(items);
    return <><output>{selectedKeys.join(",")}</output>{items.map(row => <button key={row.id} onClick={event => toggleSelection(row, event.shiftKey)}>{row.id}</button>)}<button onClick={() => setSelectedKeys([])}>Clear</button></>;
  }
  await render(<Selection />);
  await click(byText("button", "1"));
  await act(async () => byText("button", "3").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, shiftKey: true })));
  expect(host.querySelector("output").textContent).toBe("document-1,document-2,document-3");
  await click(byText("button", "Clear"));
  await act(async () => byText("button", "3").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, shiftKey: true })));
  expect(host.querySelector("output").textContent).toBe("document-3");
});

test("modal blocks workspace shortcuts, traps focus, closes with Escape and restores focus", async () => {
  await render(library("/library"));
  await click(host.querySelector('[aria-label="Chọn mục"]'));
  const shareButton = host.querySelector('[aria-label="Chia sẻ"]'); shareButton.focus();
  await click(shareButton);
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog).not.toBeNull();
  expect(dialog.contains(document.activeElement)).toBe(true);
  await act(async () => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true, cancelable: true })));
  expect(document.querySelectorAll('[role="dialog"]').length).toBe(1);
  const buttons = dialog.querySelectorAll("button");
  buttons[buttons.length - 1].focus();
  await act(async () => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })));
  expect(document.activeElement).toBe(buttons[0]);
  await act(async () => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })));
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(shareButton);
  expect(document.body.style.overflow).toBe("");
});

test.each(["members", "invites"])("folder /%s URL opens the matching tab and retains library navigation", async tab => {
  api.getFolderItems.mockResolvedValue({ folder: { id: 10, name: "Thư mục chung", rootArea: "shared", permission: "owner", permissions: { ...permissions, canManageMembers: true }, breadcrumb: [{ id: 10, name: "Thư mục chung" }] }, ...response });
  foldersApi.getFolderMembers.mockResolvedValue({ data: [] });
  foldersApi.getFolderInvites.mockResolvedValue({ data: [] });
  await render(<MemoryRouter initialEntries={[`/library/folders/10/${tab}`]}><Routes><Route path="/library" element={<LibraryLayout />}><Route path="folders/:folderId/*" element={<FolderDetailPage />} /></Route></Routes></MemoryRouter>);
  expect(host.querySelector('[aria-label="Đường dẫn thư viện"]').textContent).toContain("Được chia sẻ với tôi");
  expect(byText("a", "Thùng rác2")).toBeTruthy();
  expect(tab === "members" ? foldersApi.getFolderMembers : foldersApi.getFolderInvites).toHaveBeenCalledWith(10, ...(tab === "members" ? [] : [expect.any(Object)]));
});

test("a dialog opened from a dropdown returns focus to its persistent trigger", async () => {
  await render(library("/library"));
  const trigger = byText("button", "Thêm mới");
  trigger.focus(); await click(trigger);
  await click(document.querySelector('[role="menuitem"]:last-child'));
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog).not.toBeNull();
  await act(async () => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })));
  expect(document.activeElement).toBe(trigger);
});
