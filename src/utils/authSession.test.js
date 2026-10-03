import Cookies from "js-cookie";
import { saveAuthSession, updateStoredUser } from "./authSession";
import { readDocumentHistory } from "./documentHistory";
import { checkPasswordStrength } from "./passwordPolicy";

jest.mock("js-cookie", () => ({ get: jest.fn(), set: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

test("updating a profile preserves token expiry and cookie protection", () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  Cookies.get.mockReturnValue(`header.${btoa(JSON.stringify({ exp }))}.signature`);
  updateStoredUser({ fullName: "Updated" });
  expect(Cookies.set).toHaveBeenCalledWith("user", JSON.stringify({ fullName: "Updated" }), {
    expires: new Date(exp * 1000), sameSite: "strict", secure: false,
  });
});

test("expired or malformed tokens do not persist a profile", () => {
  for (const token of ["broken", `header.${btoa(JSON.stringify({ exp: 1 }))}.signature`]) {
    Cookies.get.mockReturnValue(token);
    updateStoredUser({ fullName: "Updated" });
  }
  expect(Cookies.set).not.toHaveBeenCalled();
});

test("login applies the same lifetime to token and user", () => {
  saveAuthSession({ token: "token", user: {}, expiresIn: 3600 });
  expect(Cookies.set.mock.calls[0][2]).toEqual(Cookies.set.mock.calls[1][2]);
});

test.each(["not json", "{}", "null"])("corrupt history %s is safe", (value) => {
  Cookies.get.mockReturnValue(value);
  expect(readDocumentHistory()).toEqual([]);
});

test.each(["Abc#1234", "Abc.1234", "Abc_1234", "Abc-1234", "Abc 1234"])("password %s works consistently", (value) => {
  expect(checkPasswordStrength(value).isValid).toBe(true);
});

test.each(["abc#1234", "Abcd#efg", "Abc12345", "Ab#123"])("weak password %s fails", (value) => {
  expect(checkPasswordStrength(value).isValid).toBe(false);
});
