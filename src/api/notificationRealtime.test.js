import Cookies from "js-cookie";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { startNotificationRealtime, stopNotificationRealtime } from "./notificationRealtime";

jest.mock("js-cookie", () => ({ get: jest.fn() }));
jest.mock("config/config", () => ({ apiUrl: "https://example.test/api" }));
jest.mock("@microsoft/signalr", () => ({ HubConnectionBuilder: jest.fn() }));

function connection(start = Promise.resolve()) {
  const instance = { start: jest.fn(() => start), stop: jest.fn(() => Promise.resolve()), on: jest.fn(), onreconnected: jest.fn(), onclose: jest.fn() };
  const builder = { withUrl: jest.fn().mockReturnThis(), withAutomaticReconnect: jest.fn().mockReturnThis(), build: jest.fn(() => instance) };
  HubConnectionBuilder.mockImplementationOnce(() => builder);
  return instance;
}

beforeEach(() => { stopNotificationRealtime(); jest.clearAllMocks(); Cookies.get.mockReturnValue("token-A"); });
afterEach(() => stopNotificationRealtime());

test("a closed connection can be started again", async () => {
  const first = connection();
  expect(await startNotificationRealtime()).toBe(first);
  first.onclose.mock.calls[0][0]();
  const second = connection();
  expect(await startNotificationRealtime()).toBe(second);
});

test("failure and close of an old token connection do not clear its replacement", async () => {
  let rejectOld;
  const old = connection(new Promise((resolve, reject) => { rejectOld = reject; }));
  const oldStart = startNotificationRealtime();
  Cookies.get.mockReturnValue("token-B");
  const next = connection();
  expect(await startNotificationRealtime()).toBe(next);
  old.onclose.mock.calls[0][0]();
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  rejectOld(new Error("Old start failed"));
  await oldStart;
  expect(await startNotificationRealtime()).toBe(next);
  log.mockRestore();
});
