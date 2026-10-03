import Cookies from "js-cookie";
import axiosInstance from "./axiosInstance";
import { stopNotificationRealtime } from "./notificationRealtime";

jest.mock("js-cookie", () => ({ get: jest.fn(), remove: jest.fn() }));
jest.mock("./notificationRealtime", () => ({ stopNotificationRealtime: jest.fn() }));
jest.mock("axios", () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: {
        handlers: [],
        use(fulfilled, rejected) { this.handlers.push({ fulfilled, rejected }); },
      },
    },
  }),
}));

const originalLocation = window.location;
beforeAll(() => {
  delete window.location;
  window.location = { origin: "http://localhost", pathname: "/library", search: "?area=my", hash: "", assign: jest.fn() };
});
afterAll(() => { window.location = originalLocation; });
beforeEach(() => { jest.clearAllMocks(); Cookies.get.mockReturnValue("current-token"); });

test.each(["/Users/public/request-login", "/public/document/1", "Tags/public/search-tags", "/s/shared-link"])("401 from %s does not clear a session", async (url) => {
  const error = { response: { status: 401 }, config: { url, headers: { Authorization: "Bearer current-token" } } };
  await expect(axiosInstance.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);
  expect(Cookies.remove).not.toHaveBeenCalled();
  expect(window.location.assign).not.toHaveBeenCalled();
});

test("401 from an old session does not log out the new session", async () => {
  const error = { response: { status: 401 }, config: { url: "/Users/my-profile", headers: { Authorization: "Bearer old-token" } } };
  await expect(axiosInstance.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);
  expect(Cookies.remove).not.toHaveBeenCalled();
});

test("401 from a private endpoint clears authentication and preserves the return path", async () => {
  const error = { response: { status: 401 }, config: { url: "/Users/my-profile", headers: { Authorization: "Bearer current-token" } } };
  await expect(axiosInstance.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);
  expect(Cookies.remove.mock.calls).toEqual([["token"], ["user"]]);
  expect(stopNotificationRealtime).toHaveBeenCalled();
  expect(window.location.assign).toHaveBeenCalledWith("/login?redirect=%2Flibrary%3Farea%3Dmy");
});
