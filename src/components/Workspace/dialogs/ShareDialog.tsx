import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import workspaceLibraryApi, { ShareLinkPayload, ShareLinkSettings, WorkspaceItemType } from "api/workspaceLibraryApi.ts";
import { toDateTimeLocalValue } from "utils/workspaceLibraryHelpers.ts";
import { copyTextToClipboard } from "utils/workspaceItemLinks.ts";
import { apiMessage } from "utils/apiMessage.ts";
import Modal from "./Modal.tsx";

type Draft = { password: string; passwordMode: "keep" | "set"; expiresAtLocal: string; maxViews: string; maxDownloads: string };
const draftOf = (link: ShareLinkSettings | null): Draft => ({
  password: "", passwordMode: "keep", expiresAtLocal: toDateTimeLocalValue(link?.expiresAt),
  maxViews: link?.maxViews == null ? "" : String(link.maxViews),
  maxDownloads: link?.maxDownloads == null ? "" : String(link.maxDownloads),
});
const hasLimits = (link: ShareLinkSettings | null) => Boolean(link?.requiresPassword || link?.expiresAt || link?.maxViews || link?.maxDownloads);

export default function ShareDialog({ item, onClose, onChanged }: {
  item: { id: number; type: WorkspaceItemType; name: string }; onClose: () => void; onChanged?: () => void;
}) {
  const [saved, setSaved] = useState<ShareLinkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [draft, setDraft] = useState<Draft>(draftOf(null));
  const [advanced, setAdvanced] = useState(false);
  const [expiryMode, setExpiryMode] = useState("none");
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const isOn = saved?.access === "anyone_with_link";
  const noun = item.type === "folder" ? "thư mục" : "tài liệu";
  const dirty = (draft.passwordMode === "set" && draft.password.length > 0)
    || draft.expiresAtLocal !== toDateTimeLocalValue(saved?.expiresAt)
    || draft.maxViews !== (saved?.maxViews == null ? "" : String(saved.maxViews))
    || draft.maxDownloads !== (saved?.maxDownloads == null ? "" : String(saved.maxDownloads));

  useEffect(() => {
    let ignore = false;
    setLoading(true); setLoadError(false);
    workspaceLibraryApi.getShareLinkSettings({ itemId: item.id, itemType: item.type })
      .then(({ shareLink }) => {
        if (ignore) return;
        setSaved(shareLink); setDraft(draftOf(shareLink)); setErrors({});
        setAdvanced(hasLimits(shareLink)); setExpiryMode(shareLink?.expiresAt ? "custom" : "none");
      })
      .catch(error => {
        if (ignore) return;
        setLoadError(true); toast.error(apiMessage(error, "Không thể tải cài đặt chia sẻ."));
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [item.id, item.type, reload]);

  const persist = async (patch: Partial<ShareLinkPayload>, message = "Đã lưu tùy chọn.") => {
    if (busyRef.current || loading || loadError) return;
    busyRef.current = true; setBusy(true);
    try {
      const payload: ShareLinkPayload = {
        itemId: item.id, itemType: item.type, access: "anyone_with_link", permission: "viewer",
        allowDownload: saved?.allowDownload ?? true, expiresAt: saved?.expiresAt ?? null,
        maxViews: saved?.maxViews ?? null, maxDownloads: saved?.maxDownloads ?? null, ...patch,
      };
      const { shareLink } = await workspaceLibraryApi.createShareLink(payload);
      setSaved(shareLink); onChanged?.(); toast.success(message);
      return shareLink;
    } catch (error) { toast.error(apiMessage(error, "Không thể lưu cài đặt chia sẻ.")); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const toggle = async () => {
    if (!isOn) { await persist({}, "Đã bật chia sẻ qua liên kết."); return; }
    if (!saved?.id || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      await workspaceLibraryApi.disableShareLink(saved.id);
      setSaved(null); setDraft(draftOf(null)); setErrors({}); setAdvanced(false); setExpiryMode("none");
      onChanged?.(); toast.success("Đã tắt chia sẻ qua liên kết.");
    } catch (error) { toast.error(apiMessage(error, "Không thể tắt chia sẻ qua liên kết.")); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const copyLink = async () => {
    const link = isOn && saved?.shareUrl ? saved : await persist({}, "Đã bật chia sẻ qua liên kết.");
    if (!link?.shareUrl) return;
    try { await copyTextToClipboard(link.shareUrl); toast.success("Đã sao chép liên kết."); }
    catch { toast.error("Không thể sao chép liên kết."); }
  };

  const selectExpiry = async (value: string) => {
    if (value === "custom") { setExpiryMode(value); return; }
    const expiresAt = value === "none" ? null : new Date(Date.now() + Number(value) * 86400000).toISOString();
    const link = await persist({ expiresAt });
    if (link) {
      setExpiryMode(value); setDraft(current => ({ ...current, expiresAtLocal: toDateTimeLocalValue(link.expiresAt) }));
      setErrors(current => ({ ...current, expiresAtLocal: undefined }));
    }
  };

  const saveAdvanced = async () => {
    const nextErrors: typeof errors = {};
    const limit = (key: "maxViews" | "maxDownloads") => {
      const value = draft[key].trim();
      if (!value) return null;
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number < 1 || number > 2147483647) nextErrors[key] = "Nhập số nguyên từ 1 đến 2147483647.";
      return number;
    };
    const patch: Partial<ShareLinkPayload> = { maxViews: limit("maxViews"), maxDownloads: limit("maxDownloads") };
    if (expiryMode === "custom" && draft.expiresAtLocal !== toDateTimeLocalValue(saved?.expiresAt)) {
      const date = new Date(draft.expiresAtLocal);
      if (!draft.expiresAtLocal || Number.isNaN(date.getTime()) || date.getTime() <= Date.now())
        nextErrors.expiresAtLocal = "Chọn thời điểm hết hạn trong tương lai.";
      else patch.expiresAt = date.toISOString();
    }
    if (draft.passwordMode === "set" && draft.password.length) {
      if (!draft.password.trim()) nextErrors.password = "Mật khẩu không được chỉ chứa khoảng trắng.";
      else patch.password = draft.password;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const link = await persist(patch);
    if (link) setDraft(draftOf(link));
  };

  const summary = [saved?.requiresPassword && "Có mật khẩu",
    saved?.expiresAt && `Hết hạn ${new Date(saved.expiresAt).toLocaleString("vi-VN")}`,
    saved?.maxViews && `${saved.maxViews} lượt xem`, saved?.maxDownloads && `${saved.maxDownloads} lượt tải`].filter(Boolean).join(" · ") || "Không giới hạn";
  const updateDraft = (patch: Partial<Draft>) => { setDraft(current => ({ ...current, ...patch })); setErrors({}); };

  return <Modal onClose={onClose} busy={busy} label={`Chia sẻ ${item.name}`}>
    <div className="w-full max-w-xl rounded-xl border border-line bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">Chia sẻ "{item.name}"</h2>
        <button type="button" aria-label="Đóng chia sẻ" onClick={onClose} disabled={busy} className="rounded-md p-2 text-ink-secondary hover:bg-canvas"><X className="h-5 w-5" /></button>
      </div>
      {loading ? <p role="status" className="py-8 text-ink-secondary">Đang tải cài đặt chia sẻ...</p> : loadError ?
        <div className="mt-5"><p>Không thể tải cài đặt chia sẻ.</p><button className="btn-secondary mt-3" onClick={() => setReload(value => value + 1)}>Thử lại</button></div> : <>
        <div className="mt-5 flex items-start gap-3">
          <button type="button" role="switch" aria-label="Chia sẻ qua liên kết" aria-checked={isOn} disabled={busy} onClick={toggle}
            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full ${isOn ? "bg-primary" : "bg-ink-secondary"}`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${isOn ? "left-6" : "left-1"}`} />
          </button>
          <div><p className="font-semibold text-ink">Chia sẻ qua liên kết</p><p className="text-sm text-ink-secondary">{isOn ? "Bất kỳ ai có liên kết đều xem được." : `Chỉ bạn xem được ${noun} này qua liên kết chia sẻ.`}</p></div>
        </div>
        {!isOn ? <button type="button" disabled={busy} onClick={() => persist({}, "Đã bật chia sẻ qua liên kết.")} className="btn-primary mt-5">Tạo liên kết</button> : <>
          <div className="mt-5 flex flex-wrap gap-2">
            <input aria-label="Liên kết chia sẻ" readOnly value={saved?.shareUrl || ""} className="input-field min-w-0 flex-1" disabled={busy} />
            <button type="button" onClick={copyLink} disabled={busy} className="btn-primary">Sao chép liên kết</button>
          </div>
          <p className="mt-2 text-sm text-ink-secondary">{saved?.views ?? 0} lượt xem · {saved?.downloads ?? 0} lượt tải</p>
          {saved?.expiresAt && new Date(saved.expiresAt).getTime() <= Date.now() && <p role="alert" className="mt-2 text-sm text-danger">Liên kết đã hết hạn. Chọn hạn mới trong tùy chọn nâng cao.</p>}
          {saved?.maxViews != null && (saved.views ?? 0) >= saved.maxViews && <p role="alert" className="mt-2 text-sm text-danger">Liên kết đã đạt giới hạn lượt xem.</p>}
          {saved?.maxDownloads != null && (saved.downloads ?? 0) >= saved.maxDownloads && <p role="alert" className="mt-2 text-sm text-danger">Liên kết đã đạt giới hạn lượt tải.</p>}
          <label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={saved?.allowDownload ?? true} disabled={busy} onChange={event => persist({ allowDownload: event.target.checked })} />Cho phép tải xuống</label>
          <button type="button" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)} disabled={busy} className="mt-5 flex w-full flex-wrap items-center justify-between gap-2 text-left">
            <span className="font-semibold">{advanced ? "▾" : "▸"} Tùy chọn nâng cao</span><span className="text-xs text-ink-secondary">{summary}</span>
          </button>
          {advanced && <fieldset disabled={busy} className="mt-3 space-y-4 rounded-lg border border-line p-4">
            <div className="space-y-2"><p className="text-sm font-semibold">Mật khẩu</p>
              {saved?.requiresPassword && <p className="text-sm text-ink-secondary">Đã đặt mật khẩu</p>}
              <div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => updateDraft({ passwordMode: "set" })}>{saved?.requiresPassword ? "Đổi mật khẩu" : "Đặt mật khẩu"}</button>
                {saved?.requiresPassword && <button type="button" className="btn-secondary" onClick={async () => { const link = await persist({ password: "" }, "Đã xóa mật khẩu."); if (link) updateDraft({ password: "", passwordMode: "keep" }); }}>Xóa mật khẩu</button>}</div>
              {draft.passwordMode === "set" && <input aria-label="Mật khẩu mới" type="password" autoComplete="new-password" value={draft.password} onChange={event => updateDraft({ password: event.target.value })} className="input-field" />}
              {errors.password && <p role="alert" className="text-sm text-danger">{errors.password}</p>}
            </div>
            <label className="block text-sm font-semibold">Hết hạn
              <select aria-label="Hết hạn" className="input-field mt-1" value={expiryMode} onChange={event => selectExpiry(event.target.value)}>
                <option value="none">Không</option><option value="1">1 ngày</option><option value="7">7 ngày</option><option value="30">30 ngày</option><option value="custom">Tùy chọn</option>
              </select>
            </label>
            {expiryMode === "custom" && <label className="block text-sm">Ngày giờ hết hạn<input type="datetime-local" className="input-field mt-1" value={draft.expiresAtLocal} onChange={event => updateDraft({ expiresAtLocal: event.target.value })} />{errors.expiresAtLocal && <span role="alert" className="mt-1 block text-danger">{errors.expiresAtLocal}</span>}</label>}
            <div className="grid gap-3 sm:grid-cols-2">{(["maxViews", "maxDownloads"] as const).map(key => <label key={key} className="block text-sm">{key === "maxViews" ? "Giới hạn lượt xem" : "Giới hạn lượt tải"}
              <input aria-label={key === "maxViews" ? "Giới hạn lượt xem" : "Giới hạn lượt tải"} type="number" min="1" step="1" className="input-field mt-1" placeholder="Không giới hạn" value={draft[key]} onChange={event => updateDraft({ [key]: event.target.value })} />
              {errors[key] && <span role="alert" className="mt-1 block text-danger">{errors[key]}</span>}
            </label>)}</div>
            <div className="flex flex-wrap items-center justify-end gap-3"><span role="status" className="text-xs text-ink-secondary">{busy ? "Đang lưu..." : dirty ? "Chưa lưu" : "Đã lưu"}</span><button type="button" className="btn-primary" onClick={saveAdvanced}>Lưu tùy chọn nâng cao</button></div>
          </fieldset>}
        </>}
        {busy && <p role="status" className="mt-3 text-sm text-ink-secondary">Đang lưu...</p>}
      </>}
    </div>
  </Modal>;
}
