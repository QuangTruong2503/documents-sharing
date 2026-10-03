import Modal from "./Modal.tsx";
import React, { useState } from "react";

import { toast } from "react-toastify";

import workspaceLibraryApi from "api/workspaceLibraryApi.ts";

import { apiMessage } from "utils/apiMessage.ts";

const CreateFolderDialog = ({ parentFolderId, onClose, onDone }: { parentFolderId: number | null; onClose: () => void; onDone: () => void }) => {
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await workspaceLibraryApi.createFolder({
        name: form.name.trim(),
        description: form.description.trim(),
        parentFolderId,
        color: null,
      });
      toast.success("Đã tạo thư mục.");
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tạo thư mục."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} busy={saving}>
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">Tạo thư mục</h2>
        <p className="mt-1 text-sm text-ink-secondary">{parentFolderId ? "Thư mục mới sẽ nằm trong thư mục hiện tại." : "Thư mục mới sẽ nằm ở thư viện gốc."}</p>
        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-semibold text-ink">Tên thư mục</span>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input-field" autoFocus />
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-semibold text-ink">Mô tả</span>
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input-field min-h-24" />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary">{saving ? "Đang tạo..." : "Tạo"}</button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateFolderDialog;
