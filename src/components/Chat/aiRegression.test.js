import React, { act } from "react";
import { createRoot } from "react-dom/client";
import aiGenerate from "api/aiGenerate";
import ChatBoxAI from "./ChatBoxAI";
import DocumentSummaryByAI from "./DocumentSummaryByAI";
import { readAIHistory } from "utils/aiHistory";
jest.mock("api/aiGenerate", () => ({
  __esModule: true,
  default: { getSummarizeDocument: jest.fn(), postChat: jest.fn() },
}));
jest.mock("config/config", () => ({
  __esModule: true,
  default: { SESSION_STORAGE_KEY_FOR_AI_CHAT: "ai-test" },
}));
jest.mock(
  "marked-react",
  () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
  }),
  { virtual: true },
);
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
let host;
let root;
const show = async (element) => {
  // React createRoot requires act; this is not Testing Library's render helper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => root.render(element));
};
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  HTMLElement.prototype.scrollIntoView = jest.fn();
  jest.clearAllMocks();
  sessionStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
test("switching summary documents aborts and ignores the old response and labels partial summaries", async () => {
  const first = deferred();
  const second = deferred();
  aiGenerate.getSummarizeDocument
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  await show(<DocumentSummaryByAI documentId={1} onClose={() => {}} />);
  const oldSignal = aiGenerate.getSummarizeDocument.mock.calls[0][1];
  await show(<DocumentSummaryByAI documentId={2} onClose={() => {}} />);
  expect(oldSignal.aborted).toBe(true);
  await act(async () =>
    second.resolve({
      data: {
        summary: "Current summary",
        truncated: true,
        processed_pages: 2,
        total_pages: 6,
      },
    }),
  );
  await act(async () => first.resolve({ data: { summary: "Stale summary" } }));
  expect(document.body.textContent).toContain("Current summary");
  expect(document.body.textContent).not.toContain("Stale summary");
  expect(document.body.textContent).toContain("2/6 trang");
  expect(readAIHistory("ai-test")[0].content).toContain("một phần");
});
test("summary shows the backend error and can retry even with corrupted storage", async () => {
  sessionStorage.setItem("ai-test", "broken JSON");
  aiGenerate.getSummarizeDocument
    .mockRejectedValueOnce({
      response: { status: 429, data: { message: "Đã đạt giới hạn AI" } },
    })
    .mockResolvedValueOnce({ data: { summary: "Recovered" } });
  await show(<DocumentSummaryByAI documentId={1} onClose={() => {}} />);
  expect(document.querySelector('[role="alert"]').textContent).toContain(
    "Đã đạt giới hạn AI",
  );
  await act(async () =>
    [...document.querySelectorAll("button")]
      .find((button) => button.textContent === "Thử lại")
      .click(),
  );
  expect(document.body.textContent).toContain("Recovered");
  expect(readAIHistory("ai-test")).toHaveLength(1);
});
test("chat preserves existing history and only sends one bounded request while busy", async () => {
  sessionStorage.setItem(
    "ai-test",
    JSON.stringify(
      Array.from({ length: 30 }, (_, i) => ({
        role: i % 2 ? "user" : "ai",
        content: `History ${i} ` + "x".repeat(2000),
      })),
    ),
  );
  const pending = deferred();
  aiGenerate.postChat.mockReturnValue(pending.promise);
  await show(<ChatBoxAI />);
  expect(readAIHistory("ai-test")).toHaveLength(30);
  await act(async () =>
    [...host.querySelectorAll("button")]
      .find((button) => button.textContent.includes("Trò chuyện AI"))
      .click(),
  );
  const input = host.querySelector('[aria-label="Câu hỏi cho trợ lý AI"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(input, "Question");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const send = host.querySelector('[aria-label="Gửi câu hỏi"]');
  await act(async () => {
    send.click();
    send.click();
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
  });
  expect(aiGenerate.postChat).toHaveBeenCalledTimes(1);
  expect(aiGenerate.postChat.mock.calls[0][0].length).toBeLessThanOrEqual(
    20000,
  );
  expect(send.disabled).toBe(true);
  await act(async () => pending.resolve({ data: { message: "Answer" } }));
  expect(host.textContent).toContain("Answer");
  expect(
    readAIHistory("ai-test").some((row) => row.content === "Question"),
  ).toBe(true);
});
test("unmounting chat aborts the in-flight call and corrupted history does not crash", async () => {
  sessionStorage.setItem("ai-test", "bad JSON");
  const pending = deferred();
  aiGenerate.postChat.mockReturnValue(pending.promise);
  await show(<ChatBoxAI />);
  await act(async () => host.querySelector("button").click());
  const input = host.querySelector("input");
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(input, "Hello");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () =>
    host.querySelector('[aria-label="Gửi câu hỏi"]').click(),
  );
  const signal = aiGenerate.postChat.mock.calls[0][1];
  await show(null);
  expect(signal.aborted).toBe(true);
  await act(async () => pending.resolve({ data: { message: "Late" } }));
  expect(host.textContent).not.toContain("Late");
});
