import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Cookies from "js-cookie";
import DocumentFeedTabs from "./DocumentFeedTabs.tsx";
import DocumentInsightsPanel from "./DocumentInsightsPanel.tsx";
import DocumentVersionsPanel from "./DocumentVersionsPanel.tsx";
import api from "api/featureUpgradesApi.ts";

jest.mock("js-cookie", () => ({ get: jest.fn() }));
jest.mock("api/featureUpgradesApi.ts", () => ({ __esModule: true, default: {
  getTrending: jest.fn(), getRecommended: jest.fn(), getFollowing: jest.fn(),
  getHistory: jest.fn(), getDocumentInsights: jest.fn(), getVersions: jest.fn(),
} }));
jest.mock("components/Documents/DocumentCard.tsx", () => () => null);

let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  Cookies.get.mockReturnValue(undefined);
  api.getTrending.mockResolvedValue({ documents: [] });
  api.getRecommended.mockResolvedValue({ documents: [] });
  api.getVersions.mockResolvedValue({ versions: [] });
  api.getDocumentInsights.mockResolvedValue({ totals: {}, daily: [], sources: [], shareLinks: [], recentActivity: [] });
  host = document.createElement("div");
  root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); });

test("anonymous home loads trending without requesting a protected feed", async () => {
  await act(async () => root.render(<DocumentFeedTabs />));
  expect(api.getTrending).toHaveBeenCalledTimes(1);
  expect(api.getRecommended).not.toHaveBeenCalled();
  expect(api.getFollowing).not.toHaveBeenCalled();
  expect(api.getHistory).not.toHaveBeenCalled();
});

test("anonymous document viewers do not request versions or insights", async () => {
  await act(async () => root.render(<><DocumentInsightsPanel documentId={42} /><DocumentVersionsPanel documentId={42} /></>));
  expect(api.getDocumentInsights).not.toHaveBeenCalled();
  expect(api.getVersions).not.toHaveBeenCalled();
  expect(host.textContent).toBe("");
  Cookies.get.mockReturnValue("signed-in-token");
  await act(async () => root.render(<><DocumentInsightsPanel documentId={42} /><DocumentVersionsPanel documentId={42} /></>));
  expect(api.getDocumentInsights).toHaveBeenCalledTimes(1);
  expect(api.getVersions).toHaveBeenCalledTimes(1);
});

test("signed-in home keeps recommendations", async () => {
  Cookies.get.mockReturnValue("signed-in-token");
  await act(async () => root.render(<DocumentFeedTabs />));
  expect(api.getRecommended).toHaveBeenCalledTimes(1);
  expect(api.getTrending).not.toHaveBeenCalled();
});
