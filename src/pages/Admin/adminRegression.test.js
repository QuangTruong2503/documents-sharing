global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const { MemoryRouter, useLocation } = require("react-router-dom");
const api = require("../../api/adminApi.ts").default;
const { toast } = require("react-toastify");
const Cookies = require("js-cookie");
const UsersView = require("./views/UsersView.tsx").default;
const ReportsView = require("./views/ReportsView.tsx").default;
const SeoView = require("./views/SeoView.tsx").default;
const { robotsContent, httpsUrl } = require("./views/SeoView.tsx");
const { AdminConfirmProvider } = require("./components/AdminShared.tsx");
const { formatDate, joinDaily, groupSeries } = require("./adminFormat.ts");
const { excludedParents } = require("./views/TaxonomyView.tsx");
jest.mock(
  "react-router-dom",
  () => require("../../../node_modules/react-router/dist/development/index.js"),
  { virtual: true },
);
jest.mock("../../api/adminApi.ts", () => ({
  __esModule: true,
  default: Object.fromEntries(
    [
      "getUsers",
      "updateUser",
      "deleteUser",
      "getReports",
      "getReport",
      "getReportOptions",
      "resolveReport",
      "deleteReport",
      "getSeoSettings",
      "getRobotsTxt",
      "getSitemapRoutes",
      "updateSeoSettings",
      "updateRobotsTxt",
      "updateSitemapRoutes",
      "generateSitemap",
      "getCategories",
      "getTags",
    ].map((name) => [name, jest.fn()]),
  ),
}));
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));
const pagination = {
  currentPage: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
};
const user = {
  user_id: "current",
  username: "Admin",
  email: "admin@example.com",
  role: "admin",
  document_count: 2,
  collection_count: 1,
  storage_used_bytes: 100,
  storage_limit_bytes: 1000,
  created_at: "invalid",
};
const report = {
  report_id: 1,
  document_id: 1,
  document: {
    document_id: 1,
    title: "Document A",
    is_public: true,
    owner: user,
  },
  reporter: user,
  reason: "Violation",
  status: "Chờ giải quyết",
  created_at: "invalid",
};
let host, root;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { resolve, reject, promise };
};
const button = (text) =>
  Array.from(document.querySelectorAll("button")).find(
    (x) => x.textContent.trim() === text,
  );
const click = async (element) => {
  expect(element).toBeTruthy();
  await act(async () =>
    element.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    ),
  );
};
const input = async (element, value) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const tick = async () => {
  await act(async () => {
    jest.advanceTimersByTime(310);
  });
};
const Location = () => {
  const location = useLocation();
  return <output id="location">{location.search}</output>;
};
const mountView = async (view, entry = "/admin/users") => {
  // React createRoot requires act; this is not Testing Library's render helper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <AdminConfirmProvider>
          {view}
          <Location />
        </AdminConfirmProvider>
      </MemoryRouter>,
    ),
  );
};
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  HTMLElement.prototype.getClientRects = () => [{ width: 10, height: 10 }];
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  Cookies.set("user", JSON.stringify({ userId: "current" }));
  api.getUsers.mockResolvedValue({ data: [user], pagination });
  api.getReports.mockResolvedValue({ data: [report], pagination });
  api.getReport.mockResolvedValue(report);
  api.getReportOptions.mockResolvedValue({ statuses: ["Chờ giải quyết"] });
  api.getSeoSettings.mockResolvedValue({
    siteName: "DocShare",
    siteUrl: "https://example.com",
    defaultTitle: "Title",
    defaultDescription: "Description",
    defaultImage: "https://example.com/a.jpg",
    locale: "vi_VN",
  });
  api.getRobotsTxt.mockResolvedValue({ content: "User-agent: *" });
  api.getSitemapRoutes.mockResolvedValue([{ path: "/" }]);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  Cookies.remove("user");
  jest.useRealTimers();
  document.body.style.overflow = "";
});

test("invalid dates are safe; daily series join by date and retain download-only days", () => {
  expect(formatDate("abc")).toBe("-");
  expect(
    joinDaily(
      [{ date: "2026-01-02", count: 2 }],
      [{ date: "2026-01-01", count: 4 }],
    ),
  ).toEqual([
    { date: "2026-01-01", views: 0, downloads: 4 },
    { date: "2026-01-02", views: 2, downloads: 0 },
  ]);
  expect(
    groupSeries(
      [
        { date: "2026-01-02", views: 2, downloads: 0 },
        { date: "2026-01-03", views: 0, downloads: 4 },
      ],
      365,
    ),
  ).toEqual([{ date: "2026-01-01", views: 2, downloads: 4 }]);
  expect(robotsContent({ content: "robots" })).toBe("robots");
  expect(() => robotsContent({ wrong: "object" })).toThrow();
  expect(httpsUrl("http://example.com")).toBe(false);
  expect(
    excludedParents(
      [
        { category_id: "a" },
        { category_id: "b", parent_id: "a" },
        { category_id: "c", parent_id: "b" },
      ],
      "a",
    ),
  ).toEqual(new Set(["a", "b", "c"]));
});

test("self demotion and deletion are disabled; granting admin needs explicit confirmation", async () => {
  api.getUsers.mockResolvedValue({
    data: [user, { ...user, user_id: "other", role: "user" }],
    pagination,
  });
  await mountView(<UsersView />);
  await tick();
  const menus = () => document.querySelectorAll('[aria-haspopup="menu"]');
  await click(menus()[0]);
  expect(button("Gỡ quyền quản trị").disabled).toBe(true);
  expect(button("Xóa người dùng").disabled).toBe(true);
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    ),
  );
  await click(menus()[1]);
  await click(button("Cấp quyền quản trị"));
  expect(api.updateUser).not.toHaveBeenCalled();
  expect(document.querySelector('[role="dialog"]').textContent).toContain(
    "toàn quyền",
  );
  await click(button("Hủy"));
  expect(api.updateUser).not.toHaveBeenCalled();
  await click(menus()[1]);
  await click(button("Cấp quyền quản trị"));
  api.updateUser.mockResolvedValue({});
  await click(button("Xác nhận"));
  expect(api.updateUser).toHaveBeenCalledWith("other", { role: "admin" });
});

test("URL filters debounce and stale list responses cannot replace newer results", async () => {
  const old = deferred();
  api.getUsers.mockReturnValueOnce(old.promise);
  await mountView(<UsersView />, "/admin/users?role=user&page=3");
  await tick();
  const search = document.querySelector(
    '[aria-label="Tìm email, tên người dùng"]',
  );
  await input(search, "a");
  await input(search, "ab");
  await input(search, "abc");
  expect(api.getUsers).toHaveBeenCalledTimes(1);
  await tick();
  expect(api.getUsers).toHaveBeenCalledTimes(2);
  expect(api.getUsers.mock.calls[1][0]).toMatchObject({
    search: "abc",
    role: "user",
    PageNumber: 1,
    PageSize: 20,
  });
  expect(document.querySelector("#location").textContent).toContain(
    "search=abc",
  );
  await act(async () =>
    old.resolve({ data: [{ ...user, username: "Stale" }], pagination }),
  );
  expect(host.textContent).not.toContain("Stale");
});

test("menus close on scroll and restore focus with Escape", async () => {
  await mountView(<UsersView />);
  await tick();
  const trigger = document.querySelector('[aria-haspopup="menu"]');
  await click(trigger);
  expect(document.querySelector('[role="menu"]')).toBeTruthy();
  await act(async () => window.dispatchEvent(new Event("scroll")));
  expect(document.querySelector('[role="menu"]')).toBeNull();
  await click(trigger);
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    ),
  );
  expect(document.activeElement).toBe(trigger);
});

test("report drawer keeps the last requested detail and confirmation can nest safely", async () => {
  const first = deferred(),
    second = deferred();
  api.getReports.mockResolvedValue({
    data: [
      report,
      {
        ...report,
        report_id: 2,
        document: { ...report.document, title: "Document B" },
      },
    ],
    pagination,
  });
  api.getReport
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  await mountView(<ReportsView />, "/admin/reports");
  await tick();
  const buttons = Array.from(document.querySelectorAll("button")).filter(
    (x) => x.textContent === "Xem chi tiết",
  );
  await click(buttons[0]);
  await click(buttons[1]);
  await act(async () =>
    second.resolve({
      ...report,
      report_id: 2,
      document: { ...report.document, title: "Document B" },
    }),
  );
  await act(async () => first.resolve(report));
  expect(document.querySelector('[role="dialog"]').textContent).toContain(
    "Document B",
  );
  expect(document.querySelector('[role="dialog"]').textContent).not.toContain(
    "Document A",
  );
  await click(button("Ẩn tài liệu và đánh dấu Đã xử lý"));
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2);
  expect(
    document
      .querySelectorAll('[role="dialog"]')[1]
      .contains(document.activeElement),
  ).toBe(true);
  await click(button("Hủy"));
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  expect(api.resolveReport).not.toHaveBeenCalled();
});

test("SEO failures disable only affected saves and never turn an object into textarea content", async () => {
  api.getSeoSettings.mockRejectedValue({
    response: { status: 500, data: { message: "Server failure" } },
  });
  api.getRobotsTxt.mockResolvedValue({ wrong: "object" });
  await mountView(<SeoView />, "/admin/seo");
  expect(button("Lưu cấu hình").disabled).toBe(true);
  expect(button("Lưu robots.txt").disabled).toBe(true);
  expect(button("Tạo sitemap").disabled).toBe(false);
  expect(host.textContent).toContain("Server failure");
  expect(
    document.querySelector('[aria-label="Nội dung robots.txt"]').value,
  ).toBe("");
});

test("failed sitemap generation reports the already-saved routes accurately", async () => {
  api.updateSitemapRoutes.mockResolvedValue({});
  api.generateSitemap.mockRejectedValue({
    response: { data: { message: "Generation failed" } },
  });
  await mountView(<SeoView />, "/admin/seo");
  await click(button("Tạo sitemap"));
  expect(api.updateSitemapRoutes).toHaveBeenCalledWith(["/"]);
  expect(toast.error).toHaveBeenCalledWith(
    expect.stringContaining("Đã lưu danh sách route"),
  );
});
