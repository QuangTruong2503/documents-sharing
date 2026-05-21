import { WorkspaceItem } from "api/workspaceLibraryApi.ts";

const getOrigin = () => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
};

export const getWorkspaceItemPath = (item: Pick<WorkspaceItem, "id" | "type">) =>
  item.type === "folder" ? `/library/folders/${item.id}` : `/document/${item.id}`;

export const getWorkspaceItemUrl = (item: Pick<WorkspaceItem, "id" | "type">) =>
  `${getOrigin()}${getWorkspaceItemPath(item)}`;

export const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export const copyWorkspaceItemLink = (item: Pick<WorkspaceItem, "id" | "type">) =>
  copyTextToClipboard(getWorkspaceItemUrl(item));
