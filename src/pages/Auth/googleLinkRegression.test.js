import React, { act } from "react";
import { createRoot } from "react-dom/client";
import GoogleLoginComponent from "./GoogleLoginComponent";
import userApi from "api/usersApi";
import { saveAuthSession } from "utils/authSession";
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }), { virtual: true });

jest.mock("api/usersApi", () => ({
  __esModule: true,
  default: { loginGoogle: jest.fn() },
}));
jest.mock("config/config", () => ({
  __esModule: true,
  default: { googleClientId: "fixture" },
}));
jest.mock("utils/authSession", () => ({
  getDeviceInfo: () => "device",
  saveAuthSession: jest.fn(),
}));
jest.mock("components/Loaders/FullPageLoader", () => () => null);
jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
  },
}));
jest.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }) => children,
  GoogleLogin: ({ onSuccess }) => (
    <button onClick={() => onSuccess({ credential: "google-token" })}>
      Google fixture
    </button>
  ),
}));

test("Google login requests no password and keeps the 2FA step before saving a session", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  const twoFA = jest.fn();
  userApi.loginGoogle
    .mockResolvedValueOnce({
      data: {
        success: true,
        require2FA: true,
        tempToken: "challenge",
        twoFactorMethod: "email",
        maskedContact: "a***@example.com",
      },
    });
  try {
    // React createRoot requires act; this is not Testing Library's render helper.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () =>
      root.render(
        <GoogleLoginComponent onTwoFARequired={twoFA} />,
      ),
    );
    await act(async () => host.querySelector("button").click());
    expect(userApi.loginGoogle).toHaveBeenLastCalledWith(
      "google-token",
      "device",
    );
    expect(twoFA).toHaveBeenCalledWith(
      expect.objectContaining({ tempToken: "challenge" }),
    );
    expect(saveAuthSession).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
