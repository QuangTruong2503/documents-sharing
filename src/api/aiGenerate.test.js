import aiGenerate from "./aiGenerate";
import legacy from "./geminiGenerate";
import axiosInstance from "./axiosInstance";
jest.mock("./axiosInstance", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
test("AI client uses the canonical routes, body contract and cancellation signals", () => {
  const signal = new AbortController().signal;
  aiGenerate.getSummarizeDocument(7, signal);
  expect(axiosInstance.get).toHaveBeenCalledWith("public/ai/document-summary", {
    params: { documentId: 7 },
    signal,
  });
  aiGenerate.postChat("Question", signal);
  expect(axiosInstance.post).toHaveBeenCalledWith(
    "public/ai/chat",
    { message: "Question" },
    { signal },
  );
  legacy.postGeminiChat({ message: "Old client" });
  expect(axiosInstance.post).toHaveBeenLastCalledWith(
    "public/ai/chat",
    { message: "Old client" },
    { signal: undefined },
  );
});
