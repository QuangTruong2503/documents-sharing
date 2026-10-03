import Modal from "./Modal.tsx";
import React, { useState } from "react";

import { toast } from "react-toastify";

import workspaceLibraryApi, { WorkspaceItem } from "api/workspaceLibraryApi.ts";

import { apiMessage } from "utils/apiMessage.ts";

const MergeDialog = ({ items, parentFolderId, onClose, onDone }: { items: WorkspaceItem[]; parentFolderId: number | null; onClose: () => void; onDone: () => void }) => {
  const [name, setName] = useState("Tài liệu mới");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await workspaceLibraryApi.mergeDocumentsIntoFolder({
        name: name.trim(),
        parentFolderId,
        items: items.filter((item) => item.type === "document").map((item) => ({ id: item.id, type: "document" })),
      });
      toast.success("Đã gom vào thư mục mới.");
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể gom tài liệu."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} busy={saving}>
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Gom vào thư mục</h2>
        <p className="mt-1 text-sm text-ink-secondary">{items.length} tài liệu sẽ được chuyển vào thư mục mới.</p>
        <input value={name} onChange={(event) => setName(event.target.value)} className="input-field mt-5" autoFocus />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving || !name.trim()} className="btn-primary">{saving ? "Đang tạo..." : "Gom"}</button>
        </div>
      </form>
    </Modal>
  );
};

export default MergeDialog;
