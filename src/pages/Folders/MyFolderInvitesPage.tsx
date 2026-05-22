import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Check, Mail, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";
import PageTitle from "components/PageTitle.js";
import foldersApi from "api/foldersApi.js";
import { formatDateToVN } from "utils/formatDateToVN";
import { apiMessage, roleLabel } from "./FolderListPage.tsx";

interface FolderInvite {
  invite_id: number;
  folder_id: number;
  invitee_email?: string | null;
  role: string;
  status: string;
  expires_at?: string | null;
  created_at: string;
  folder?: { name?: string } | null;
  inviter?: { username?: string; Username?: string; full_name?: string | null } | null;
}

const MyFolderInvitesPage: React.FC = () => {
  const navigate = useNavigate();
  const [invites, setInvites] = useState<FolderInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const response = await foldersApi.getMyFolderInvites({ status: "pending", pageNumber: 1, pageSize: 20 });
      setInvites(response.data);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không tải được lời mời."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const acceptInvite = async (invite: FolderInvite) => {
    setBusyId(invite.invite_id);
    try {
      await foldersApi.acceptFolderInvite(invite.invite_id);
      toast.success("Đã tham gia thư mục.");
      setInvites((current) => current.filter((item) => item.invite_id !== invite.invite_id));
      navigate(`/library/folders/${invite.folder_id}`);
    } catch (error: any) {
      if (error?.response?.status === 410 || error?.response?.data?.code === "INVITE_EXPIRED") {
        setInvites((current) =>
          current.map((item) => (item.invite_id === invite.invite_id ? { ...item, status: "expired" } : item))
        );
        toast.error("Lời mời đã hết hạn.");
      } else {
        toast.error(apiMessage(error, "Không thể nhận lời mời."));
      }
    } finally {
      setBusyId(null);
    }
  };

  const declineInvite = async (invite: FolderInvite) => {
    setBusyId(invite.invite_id);
    try {
      await foldersApi.declineFolderInvite(invite.invite_id);
      toast.success("Đã từ chối lời mời.");
      setInvites((current) => current.filter((item) => item.invite_id !== invite.invite_id));
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể từ chối lời mời."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageTitle title="Lời mời thư mục" description="Nhận hoặc từ chối lời mời tham gia thư mục." />
      <div className="mx-auto max-w-4xl">
        <NavLink to="/library" className="mb-5 inline-flex text-sm font-semibold text-ink-secondary hover:text-primary">
          Quay lại thư viện
        </NavLink>
        <section className="mb-6 border-b border-line pb-6">
          <p className="mb-2 text-sm font-semibold text-primary">Folder invites</p>
          <h1 className="text-3xl font-bold text-ink">Lời mời của tôi</h1>
          <p className="mt-2 text-sm text-ink-secondary">Các lời mời đang chờ sẽ được hiển thị ở đây.</p>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <RefreshCw className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-ink-secondary">Đang tải lời mời...</p>
          </div>
        ) : invites.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <Mail className="mx-auto h-10 w-10 text-neutral" />
            <h2 className="mt-4 text-lg font-bold text-ink">Không có lời mời đang chờ</h2>
            <p className="mt-2 text-sm text-ink-secondary">Khi có ai mời bạn vào thư mục, lời mời sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => {
              const isExpired = invite.status === "expired";
              const inviter = invite.inviter?.full_name || invite.inviter?.username || invite.inviter?.Username || "Người dùng DocShare";
              return (
                <article key={invite.invite_id} className="surface-card p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-ink">{invite.folder?.name || `Thư mục #${invite.folder_id}`}</h2>
                      <p className="mt-1 text-sm text-ink-secondary">
                        {inviter} mời bạn với quyền {roleLabel[invite.role] || invite.role}
                      </p>
                      <p className="mt-2 text-xs text-ink-secondary">
                        Hết hạn: {invite.expires_at ? formatDateToVN(invite.expires_at) : "Không đặt thời hạn"}
                      </p>
                      {isExpired && <p className="mt-2 text-xs font-semibold text-danger">Lời mời đã hết hạn.</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => acceptInvite(invite)}
                        disabled={busyId === invite.invite_id || isExpired}
                        className="btn-primary px-3"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Nhận lời
                      </button>
                      <button
                        type="button"
                        onClick={() => declineInvite(invite)}
                        disabled={busyId === invite.invite_id || isExpired}
                        className="btn-secondary px-3"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MyFolderInvitesPage;
