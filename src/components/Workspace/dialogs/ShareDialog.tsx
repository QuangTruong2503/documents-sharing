import { ShareLinkSettings } from "api/workspaceLibraryApi.ts";
import { useLibraryContext } from "pages/Library/LibraryLayout.tsx";
import Modal from "./Modal.tsx";
import React, { useEffect, useState } from "react";

import { X } from "lucide-react";
import { toast } from "react-toastify";

import workspaceLibraryApi, { WorkspaceItem } from "api/workspaceLibraryApi.ts";

import { toDateTimeLocalValue } from "utils/workspaceLibraryHelpers.ts";
import { copyTextToClipboard } from "utils/workspaceItemLinks.ts";
import { apiMessage } from "utils/apiMessage.ts";

import { getItemName } from "utils/workspaceItem.ts";

const ShareDialog = ({ item, onClose }: { item: WorkspaceItem; onClose: () => void }) => {
  const { refreshSummary } = useLibraryContext();
  const [settings, setSettings] = useState<ShareLinkSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [form, setForm] = useState({
    access: "anyone_with_link",
    permission: "viewer",
    allowDownload: true,
    password: "",
    expiresAt: "",
    maxViews: "",
    maxDownloads: "",
  });

  useEffect(() => {
    let ignore = false;
    workspaceLibraryApi
      .getShareLinkSettings({ itemId: item.id, itemType: item.type })
      .then((response) => {
        if (!ignore && response.shareLink) {
          setSettings(response.shareLink);
          setForm({
            access: response.shareLink.access || "anyone_with_link",
            permission: "viewer",
            allowDownload: response.shareLink.allowDownload !== false,
            password: "",
            expiresAt: toDateTimeLocalValue(response.shareLink.expiresAt),
            maxViews: response.shareLink.maxViews ? String(response.shareLink.maxViews) : "",
            maxDownloads: response.shareLink.maxDownloads ? String(response.shareLink.maxDownloads) : "",
          });
        }
      })
      .catch(() => undefined);
    return () => { ignore = true; };
  }, [item]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await workspaceLibraryApi.createShareLink({
        itemId: item.id,
        itemType: item.type,
        access: form.access,
        permission: form.permission,
        allowDownload: form.allowDownload,
        password: form.password || null,
        expiresAt: form.expiresAt || null,
        maxViews: form.maxViews ? Number(form.maxViews) : null,
        maxDownloads: form.maxDownloads ? Number(form.maxDownloads) : null,
      });
      setSettings(response.shareLink);
      refreshSummary();
      toast.success("Đã tạo liên kết chia sẻ.");
      return response.shareLink;
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tạo liên kết chia sẻ."));
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    const link = settings?.shareUrl ? settings : await save();
    if (!link?.shareUrl) return;
    try {
      await copyTextToClipboard(link.shareUrl);
    } catch {
      toast.error("Không thể sao chép liên kết.");
      return;
    }
    toast.success("Đã sao chép liên kết.");
  };

  const disableLink = async () => {
    if (!settings?.id) return;
    setDisabling(true);
    try {
      await workspaceLibraryApi.disableShareLink(settings.id);
      setSettings(null);
      refreshSummary();
      toast.success("Đã tắt liên kết chia sẻ.");
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tắt liên kết chia sẻ."));
    } finally {
      setDisabling(false);
    }
  };

  return (
    <Modal onClose={onClose} busy={saving || disabling}>
      <div className="w-full max-w-xl rounded-lg border border-line bg-surface p-6 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">Chia sẻ "{getItemName(item)}"</h2>
            <p className="mt-1 text-sm text-ink-secondary">Tạo liên kết chia sẻ cho {item.type === "folder" ? "thư mục" : "tài liệu"}.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-ink-secondary hover:bg-canvas">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">Quyền truy cập chung</span>
            <select value={form.access} onChange={(event) => setForm({ ...form, access: event.target.value })} className="input-field">
              <option value="restricted">Hạn chế · chỉ xem qua thư viện</option>
              <option value="anyone_with_link">Bất kỳ ai có liên kết</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">Quyền</span>
            <select value={form.permission} onChange={(event) => setForm({ ...form, permission: event.target.value })} className="input-field">
              <option value="viewer">Người xem</option>

            </select>
          </label>
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-md border border-line p-3 text-sm text-ink-secondary">
          <input type="checkbox" checked={form.allowDownload} onChange={(event) => setForm({ ...form, allowDownload: event.target.checked })} />
          <span>Cho phép tải xuống</span>
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">Mật khẩu</span>
            <input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="input-field" placeholder="Không bắt buộc" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">Ngày hết hạn</span>
            <input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className="input-field" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">Giới hạn lượt xem</span>
            <input type="number" min="1" value={form.maxViews} onChange={(event) => setForm({ ...form, maxViews: event.target.value })} className="input-field" placeholder="Không giới hạn" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-ink">Giới hạn lượt tải</span>
            <input type="number" min="1" value={form.maxDownloads} onChange={(event) => setForm({ ...form, maxDownloads: event.target.value })} className="input-field" placeholder="Không giới hạn" />
          </label>
        </div>
        <div className="mt-5 rounded-md border border-line bg-canvas p-3 text-sm text-ink-secondary">
          {settings?.shareUrl || "Chưa có link. Bấm tạo link để lấy liên kết."}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {settings?.id && (
            <button type="button" onClick={disableLink} disabled={disabling} className="btn-secondary border-danger text-danger hover:border-danger hover:text-danger">
              {disabling ? "Đang tắt..." : "Tắt link"}
            </button>
          )}
          <button type="button" onClick={save} disabled={saving} className="btn-secondary">{saving ? "Đang lưu..." : "Tạo/Cập nhật liên kết"}</button>
          <button type="button" onClick={copyLink} className="btn-primary">Sao chép liên kết</button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareDialog;
