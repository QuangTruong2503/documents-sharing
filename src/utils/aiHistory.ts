export interface AIMessage {
  role: "user" | "ai";
  content: string;
}
export function readAIHistory(key: string): AIMessage[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value
          .filter(
            (row): row is AIMessage =>
              row &&
              (row.role === "user" || row.role === "ai") &&
              typeof row.content === "string",
          )
          .slice(-30)
      : [];
  } catch {
    return [];
  }
}
export function writeAIHistory(key: string, history: AIMessage[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(history.slice(-30)));
  } catch {
    /* Chat remains usable if storage is unavailable. */
  }
}
