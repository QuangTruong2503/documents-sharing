import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { Download, Eye, FileText, KeyRound, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";
import PageTitle from "components/PageTitle";
import featureUpgradesApi from "api/featureUpgradesApi.ts";

const itemTitle = (item: any) => item?.title || item?.name || item?.itemName || "Tài liệu được chia sẻ";
const itemFileUrl = (item: any) => item?.fileUrl || item?.file_url || item?.previewUrl || item?.downloadUrl || "";
const itemDownloadUrl = (item: any) => item?.downloadUrl || item?.download_url || itemFileUrl(item);

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [payload, setPayload] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await featureUpgradesApi.getPublicShare(token);
      setPayload(response);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Liên kết chia sẻ không khả dụng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !password.trim()) return;
    setVerifying(true);
    try {
      const response = await featureUpgradesApi.verifySharePassword(token, password.trim());
      setPayload(response);
      setPassword("");
      toast.success("Đã mở khóa liên kết.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Mật khẩu không đúng.");
    } finally {
      setVerifying(false);
    }
  };

  const item = payload?.item;
  const title = itemTitle(item);
  const fileUrl = itemFileUrl(item);
  const downloadUrl = itemDownloadUrl(item);
  const requiresPassword = payload?.requiresPassword && !item;
  const canDownload = payload?.allowDownload !== false;
  const viewerUrl = useMemo(() => {
    if (!fileUrl) return "";
    const lower = fileUrl.toLowerCase().split("?")[0];
    if (lower.endsWith(".pdf")) return fileUrl;
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
  }, [fileUrl]);

  return (
    <>
      <PageTitle title={title} description="Xem tài liệu được chia sẻ trên DocShare." />
      <div className="mx-auto max-w-6xl">
        {loading ? (
          <div className="surface-card flex min-h-[360px] items-center justify-center">
            <RefreshCw className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="surface-card p-8 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-danger" />
            <h1 className="mt-4 text-2xl font-bold text-ink">Không mở được liên kết</h1>
            <p className="mt-2 text-sm text-ink-secondary">{error}</p>
            <NavLink to="/" className="btn-primary mt-6">Về trang chủ</NavLink>
          </div>
        ) : requiresPassword ? (
          <form onSubmit={verifyPassword} className="surface-card mx-auto max-w-md p-6">
            <KeyRound className="h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl font-bold text-ink">Liên kết có mật khẩu</h1>
            <p className="mt-2 text-sm text-ink-secondary">Nhập mật khẩu để xem nội dung được chia sẻ.</p>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field mt-5"
              placeholder="Mật khẩu"
              autoFocus
            />
            <button type="submit" disabled={verifying || !password.trim()} className="btn-primary mt-4 w-full">
              {verifying ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Mở khóa
            </button>
          </form>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <FileText className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-ink">{title}</h1>
              <p className="mt-2 text-sm text-ink-secondary">{item?.description || "Tài liệu được chia sẻ qua DocShare."}</p>
              <div className="mt-5 grid gap-2 text-sm text-ink-secondary">
                <span>Quyền: {payload?.permission || "viewer"}</span>
                <span>{canDownload ? "Cho phép tải xuống" : "Chỉ xem trực tuyến"}</span>
              </div>
              <div className="mt-5 grid gap-2">
                {fileUrl && (
                  <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                    <Eye className="mr-2 h-4 w-4" />
                    Mở file gốc
                  </a>
                )}
                {canDownload && downloadUrl && (
                  <a href={downloadUrl} className="btn-primary">
                    <Download className="mr-2 h-4 w-4" />
                    Tải xuống
                  </a>
                )}
              </div>
            </aside>
            <section className="surface-card overflow-hidden p-4">
              {viewerUrl ? (
                <iframe src={viewerUrl} title={title} className="h-[75vh] min-h-[560px] w-full rounded-lg border border-line" />
              ) : (
                <div className="flex min-h-[560px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-canvas p-6 text-center">
                  <FileText className="h-12 w-12 text-primary" />
                  <p className="mt-3 font-semibold text-ink">Không có preview cho nội dung này.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
