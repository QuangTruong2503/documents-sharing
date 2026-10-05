import React, { act } from "react";
import { createRoot } from "react-dom/client";
import DocumentDetail from "./DocumentDetail";
import documentsApi from "api/documentsApi";
import featureUpgradesApi from "api/featureUpgradesApi.ts";
import { copyTextToClipboard } from "utils/workspaceItemLinks.ts";
import { checkNotSigned } from "utils/CheckSigned";
import { toast } from "react-toastify";

jest.mock("react-router-dom", () => ({ useParams: () => ({ documentID: "42" }), NavLink: ({ children }) => <a>{children}</a> }), { virtual: true });
jest.mock("api/documentsApi", () => ({ __esModule: true, default: { getDocumentByID: jest.fn() } }));
jest.mock("api/collectionsApi", () => ({ __esModule: true, default: {} }));
jest.mock("api/reportsApi", () => ({ __esModule: true, default: {} }));
jest.mock("api/workspaceLibraryApi.ts", () => ({ __esModule: true, default: {} }));
jest.mock("api/featureUpgradesApi.ts", () => ({ __esModule: true, default: { recordView: jest.fn().mockResolvedValue({}) } }));
jest.mock("js-cookie", () => ({ __esModule: true, default: { get: jest.fn(), set: jest.fn() } }));
jest.mock("utils/documentHistory", () => ({ readDocumentHistory: () => [] }));
jest.mock("utils/CheckSigned", () => ({ checkNotSigned: jest.fn() }));
jest.mock("utils/workspaceItemLinks.ts", () => ({ copyTextToClipboard: jest.fn().mockResolvedValue() }));
jest.mock("react-toastify", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("components/PageTitle", () => () => null);
jest.mock("components/Chat/DocumentSummaryByAI.tsx", () => () => null);
jest.mock("components/Documents/DocumentCommentsPanel.tsx", () => () => null);
jest.mock("components/Documents/DocumentInsightsPanel.tsx", () => () => null);
jest.mock("components/Documents/DocumentVersionsPanel.tsx", () => () => null);
jest.mock("components/Workspace/dialogs/ShareDialog.tsx", () => ({ item }) => <div role="dialog">Chia sẻ {item.name}</div>);

let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks(); window.scroll = jest.fn(); navigator.share = undefined;
  featureUpgradesApi.recordView.mockResolvedValue({});
  copyTextToClipboard.mockResolvedValue();
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const open = async (canShare, isPublic = true) => {
  documentsApi.getDocumentByID.mockResolvedValue({ data: { document_id: 42, title: "Document", file_url: "fixture.pdf", is_public: isPublic, can_share: canShare, categories: [] } });
  await act(async () => root.render(<DocumentDetail />));
  const button = Array.from(host.querySelectorAll("button")).find(element => element.textContent.trim() === "Chia sẻ");
  expect(button).toBeTruthy(); await act(async () => button.click());
};

test.each([true, false])("non-owner shares the document page without requiring login (public=%s)", async isPublic => {
  await open(false, isPublic);
  expect(copyTextToClipboard).toHaveBeenCalledWith(`${window.location.origin}/document/42`);
  expect(checkNotSigned).not.toHaveBeenCalled();
  expect(host.querySelector('[role="dialog"]')).toBeNull();
  expect(toast.success).toHaveBeenCalledWith(isPublic ? "Đã sao chép liên kết trang tài liệu." : "Đã sao chép liên kết. Chỉ người có quyền truy cập thư mục mới mở được.");
});

test("owner opens the shared dialog instead of copying the page", async () => {
  await open(true);
  expect(host.querySelector('[role="dialog"]').textContent).toContain("Chia sẻ Document");
  expect(copyTextToClipboard).not.toHaveBeenCalled();
});

test("cancelling native sharing produces no error toast", async () => {
  navigator.share = jest.fn().mockRejectedValue({ name: "AbortError" });
  await open(false);
  expect(navigator.share).toHaveBeenCalledWith({ title: "Document", url: `${window.location.origin}/document/42` });
  expect(toast.error).not.toHaveBeenCalled();
});
