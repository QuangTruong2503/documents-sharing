import Modal from "./Modal.tsx";
import React, { useState } from "react";

import { toast } from "react-toastify";

import workspaceLibraryApi, { WorkspaceItem } from "api/workspaceLibraryApi.ts";

import { apiMessage } from "utils/apiMessage.ts";

import { getItemName } from "utils/workspaceItem.ts";

const RenameDialog = ({ item, onClose, onDone }: { item: WorkspaceItem; onClose: () => void; onDone: () => void }) => {
  const [name, setName] = useState(getItemName(item));
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await workspaceLibraryApi.renameItem(item.id, { type: item.type, name: name.trim() });
      toast.success("Đã đổi tên.");
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể đổi tên."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} busy={saving}>
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Đổi tên</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} className="input-field mt-5" autoFocus />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving || !name.trim()} className="btn-primary">{saving ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </form>
    </Modal>
  );
};

export default RenameDialog;
