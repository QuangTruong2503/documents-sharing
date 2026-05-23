import React, { useEffect, useState } from "react";
import { Bell, RefreshCw, Save } from "lucide-react";
import { toast } from "react-toastify";
import featureUpgradesApi from "api/featureUpgradesApi.ts";

const settingRows = [
  ["inAppEnabled", "Thông báo trong ứng dụng", "Tạo thông báo mới trong DocShare khi có hoạt động liên quan."],
  ["emailOnComment", "Email khi có bình luận", "Nhận email khi tài liệu của bạn có bình luận hoặc phản hồi."],
  ["emailOnFollow", "Email khi có người theo dõi", "Nhận email khi người khác theo dõi hồ sơ của bạn."],
  ["emailOnFolderInvite", "Email khi được mời vào thư mục", "Nhận email khi có lời mời truy cập folder."],
  ["emailOnReportUpdate", "Email khi báo cáo cập nhật", "Nhận email khi trạng thái báo cáo tài liệu thay đổi."],
] as const;

const defaultSettings = {
  inAppEnabled: true,
  emailOnComment: true,
  emailOnFollow: true,
  emailOnFolderInvite: true,
  emailOnReportUpdate: true,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-primary" : "bg-line"}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    featureUpgradesApi
      .getNotificationSettings()
      .then((data) => setSettings({ ...defaultSettings, ...(data?.settings || data || {}) }))
      .catch(() => toast.error("Không tải được cài đặt thông báo."))
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (key: keyof typeof defaultSettings, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = await featureUpgradesApi.updateNotificationSettings(settings);
      setSettings({ ...defaultSettings, ...(data?.settings || data || settings) });
      toast.success("Đã lưu cài đặt thông báo.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không lưu được cài đặt thông báo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <Bell className="h-6 w-6 text-primary" />
            Cài đặt thông báo
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">Điều chỉnh thông báo trong app và các cờ email backend đã hỗ trợ.</p>
        </div>
        <button type="button" onClick={save} disabled={saving} className="btn-primary shrink-0">
          {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Lưu
        </button>
      </div>

      <div className="divide-y divide-line rounded-lg border border-line">
        {settingRows.map(([key, title, description]) => (
          <div key={key} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink-secondary">{description}</p>
            </div>
            <Toggle checked={settings[key]} onChange={(value) => updateSetting(key, value)} />
          </div>
        ))}
      </div>
    </div>
  );
}
