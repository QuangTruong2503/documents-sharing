import { useState } from "react";
import { toast } from "react-toastify";
import workspaceLibraryApi, { WorkspaceItem } from "api/workspaceLibraryApi.ts";
import { copyWorkspaceItemLink } from "utils/workspaceItemLinks.ts";
import { toPayloadItems } from "utils/workspaceItem.ts";
import { apiMessage } from "utils/apiMessage.ts";
import { downloadWorkspaceDocuments, workspaceBatchMessage } from "utils/workspaceLibraryHelpers.ts";

export interface ConfirmAction {
  title: string; message: string; confirmLabel: string; variant?: "danger" | "primary"; onConfirm: () => Promise<void>;
}

export default function useWorkspaceActions(reload: () => void) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const runConfirmAction = async () => {
    if (!confirmAction || confirmLoading) return;
    setConfirmLoading(true);
    try { await confirmAction.onConfirm(); setConfirmAction(null); }
    finally { setConfirmLoading(false); }
  };
  const copyItemLink = async (item: WorkspaceItem) => {
    try { await copyWorkspaceItemLink(item); toast.success("Đã sao chép liên kết."); }
    catch { toast.error("Không thể sao chép liên kết."); }
  };
  const downloadItems = async (items: WorkspaceItem[]) => {
    const documents = items.filter(item => item.type === "document" && item.permissions?.canDownload !== false);
    if (!documents.length) return;
    try { await downloadWorkspaceDocuments(documents); toast.success(documents.length > 1 ? "Đã tải file ZIP." : "Đã tải tài liệu."); }
    catch (error) { toast.error(apiMessage(error, "Không thể tải tài liệu đã chọn.")); }
  };
  const perform = async (kind: "trash" | "restore" | "delete", items: WorkspaceItem[]) => {
    if (!items.length) return;
    try {
      const payload = toPayloadItems(items);
      const response = kind === "trash" ? await workspaceLibraryApi.trashItems(payload) : kind === "restore" ? await workspaceLibraryApi.restoreItems(payload) : await workspaceLibraryApi.deleteItemsForever(payload);
      const message = { trash: "Đã chuyển vào thùng rác.", restore: "Đã khôi phục.", delete: "Đã xóa vĩnh viễn." }[kind];
      if (response.failed?.length) toast.info(workspaceBatchMessage(response, { trash: "trashed", restore: "restored", delete: "deleted" }[kind], message, "Một số mục chưa thể xử lý."));
      else toast.success(message);
      reload();
    } catch (error) { toast.error(apiMessage(error, "Không thể xử lý các mục đã chọn.")); }
  };
  const trashItems = (items: WorkspaceItem[]) => {
    if (!items.length) return;
    setConfirmAction({ title: "Chuyển vào thùng rác?", message: `${items.length} mục sẽ được chuyển vào thùng rác. Bạn có thể khôi phục lại trong mục Thùng rác.`, confirmLabel: "Chuyển vào thùng rác", onConfirm: () => perform("trash", items) });
  };
  const deleteForeverItems = (items: WorkspaceItem[]) => {
    if (!items.length) return;
    setConfirmAction({ title: "Xóa vĩnh viễn?", message: `${items.length} mục sẽ bị xóa vĩnh viễn và không thể khôi phục.`, confirmLabel: "Xóa vĩnh viễn", onConfirm: () => perform("delete", items) });
  };
  return { confirmAction, setConfirmAction, confirmLoading, runConfirmAction, copyItemLink, downloadItems, trashItems, restoreItems: (items: WorkspaceItem[]) => perform("restore", items), deleteForeverItems };
}
