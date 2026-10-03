
import Modal from "components/Workspace/dialogs/Modal.tsx";

import React, { useEffect, useRef, useState } from "react";

import { MoreHorizontal, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";

import WorkspaceConfirmDialog from "components/Workspace/WorkspaceConfirmDialog.tsx";

import { WorkspaceFolder } from "api/workspaceLibraryApi.ts";
import foldersApi, { folderRoles } from "api/foldersApi.js";

import { formatDateToVN } from "utils/formatDateToVN";

import { Badge, roleLabel } from "utils/folderDisplay.tsx";
import { apiMessage } from "utils/apiMessage.ts";

const getMemberName = (member: FolderMember) => member.user?.full_name || member.user?.username || member.user?.Username || member.user_id;

interface FolderMember {
  user_id: string;
  role: string;
  joined_at: string;
  user?: { username?: string; Username?: string; full_name?: string | null; email?: string | null } | null;
}

interface FolderInvite {
  invite_id: number;
  invitee_user_id?: string | null;
  invitee_email?: string | null;
  role: string;
  status: string;
  created_at: string;
}

const MemberActionDropdown = ({
  member,
  onEdit,
  onRemove,
}: {
  member: FolderMember;
  onEdit: () => void;
  onRemove: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const runAction = (action: () => void) => {
    menuRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')?.focus();
    setOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="relative justify-self-start md:justify-self-end">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-secondary hover:bg-canvas hover:text-primary"
        title="Thao tác thành viên"
        aria-label={`Mở thao tác cho ${getMemberName(member)}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-card" role="menu">
          <button
            type="button"
            onClick={() => runAction(onEdit)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-secondary hover:bg-canvas hover:text-primary"
            role="menuitem"
          >
            <Pencil className="h-4 w-4" />
            Chỉnh sửa quyền
          </button>
          <button
            type="button"
            onClick={() => runAction(onRemove)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
            role="menuitem"
          >
            <Trash2 className="h-4 w-4" />
            Xóa khỏi thư mục
          </button>
        </div>
      )}
    </div>
  );
};

export const MembersPanel = ({ folderId }: { folderId: number }) => {
  const [members, setMembers] = useState<FolderMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState({ user_id: "", role: "viewer" });
  const [editingMember, setEditingMember] = useState<{ member: FolderMember; role: string } | null>(null);
  const [removingMember, setRemovingMember] = useState<FolderMember | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [removing, setRemoving] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await foldersApi.getFolderMembers(folderId);
      setMembers(response.data);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không tải được thành viên."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adding.user_id.trim()) return;
    try {
      await foldersApi.addFolderMember(folderId, { user_id: adding.user_id.trim(), role: adding.role });
      toast.success("Đã thêm thành viên.");
      setAdding({ user_id: "", role: "viewer" });
      loadMembers();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể thêm thành viên."));
    }
  };

  const updateMemberRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingMember) return;
    setSavingRole(true);
    try {
      await foldersApi.updateFolderMemberRole(folderId, editingMember.member.user_id, editingMember.role);
      toast.success("Đã cập nhật quyền thành viên.");
      setEditingMember(null);
      loadMembers();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể cập nhật quyền thành viên."));
    } finally {
      setSavingRole(false);
    }
  };

  const removeMember = async () => {
    if (!removingMember) return;
    setRemoving(true);
    try {
      await foldersApi.removeFolderMember(folderId, removingMember.user_id);
      toast.success("Đã xóa thành viên khỏi thư mục.");
      setRemovingMember(null);
      loadMembers();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể xóa thành viên."));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={addMember} className="mb-4 grid gap-3 rounded-lg border border-line bg-canvas p-4 lg:grid-cols-[1fr_180px_auto] lg:items-end">
        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">User ID</span>
          <input value={adding.user_id} onChange={(event) => setAdding({ ...adding, user_id: event.target.value })} className="input-field" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">Quyền</span>
          <select value={adding.role} onChange={(event) => setAdding({ ...adding, role: event.target.value })} className="input-field">
            {folderRoles.map((role) => <option key={role} value={role}>{roleLabel[role] || role}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-primary">
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm
        </button>
      </form>
      {loading ? (
        <div className="py-10 text-center text-sm text-ink-secondary">Đang tải thành viên...</div>
      ) : members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-ink-secondary">Chưa có thành viên.</div>
      ) : (
        <div className="overflow-visible rounded-lg border border-line bg-surface">
          {members.map((member) => (
            <div key={member.user_id} className="relative grid gap-3 border-b border-line p-4 last:border-b-0 md:grid-cols-[1fr_180px_48px] md:items-center">
              <div>
                <p className="font-semibold text-ink">{getMemberName(member)}</p>
                <p className="text-xs text-ink-secondary">{member.user?.email || member.user_id}</p>
              </div>
              <Badge>{roleLabel[member.role] || member.role}</Badge>
              <MemberActionDropdown
                member={member}
                onEdit={() => setEditingMember({ member, role: member.role })}
                onRemove={() => setRemovingMember(member)}
              />
            </div>
          ))}
        </div>
      )}
      {editingMember && (
        <Modal onClose={() => setEditingMember(null)} busy={savingRole}>
          <form onSubmit={updateMemberRole} className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-member-role-title" className="text-lg font-bold text-ink">Chỉnh sửa quyền</h2>
                <p className="mt-1 text-sm text-ink-secondary">{getMemberName(editingMember.member)}</p>
              </div>
              <button type="button" onClick={() => setEditingMember(null)} disabled={savingRole} className="rounded-md p-2 text-ink-secondary hover:bg-canvas hover:text-ink disabled:pointer-events-none disabled:opacity-50" title="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mt-5 block">
              <span className="mb-1 block text-sm font-semibold text-ink">Quyền truy cập</span>
              <select value={editingMember.role} onChange={(event) => setEditingMember({ ...editingMember, role: event.target.value })} className="input-field" autoFocus>
                {folderRoles.map((role) => <option key={role} value={role}>{roleLabel[role] || role}</option>)}
              </select>
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingMember(null)} disabled={savingRole} className="btn-secondary">Hủy</button>
              <button type="submit" disabled={savingRole || editingMember.role === editingMember.member.role} className="btn-primary">
                {savingRole ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {removingMember && (
        <WorkspaceConfirmDialog
          title="Xóa thành viên?"
          message={`${getMemberName(removingMember)} sẽ không còn quyền truy cập thư mục này.`}
          confirmLabel="Xóa khỏi thư mục"
          loading={removing}
          onCancel={() => setRemovingMember(null)}
          onConfirm={removeMember}
        />
      )}
    </div>
  );
};

export const InvitesPanel = ({ folderId }: { folderId: number }) => {
  const [invites, setInvites] = useState<FolderInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ invitee_email: "", role: "viewer" });

  const loadInvites = async () => {
    setLoading(true);
    try {
      const response = await foldersApi.getFolderInvites(folderId, { status: "pending", pageNumber: 1, pageSize: 30 });
      setInvites(response.data);
    } catch (error: any) {
      toast.error(apiMessage(error, "Không tải được lời mời."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const createInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.invitee_email.trim()) return;
    try {
      await foldersApi.createFolderInvite(folderId, form);
      toast.success("Đã gửi lời mời.");
      setForm({ invitee_email: "", role: "viewer" });
      loadInvites();
    } catch (error: any) {
      toast.error(apiMessage(error, "Không thể tạo lời mời."));
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={createInvite} className="mb-4 grid gap-3 rounded-lg border border-line bg-canvas p-4 lg:grid-cols-[1fr_180px_auto] lg:items-end">
        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">Email</span>
          <input value={form.invitee_email} onChange={(event) => setForm({ ...form, invitee_email: event.target.value })} className="input-field" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">Quyền</span>
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="input-field">
            {folderRoles.map((role) => <option key={role} value={role}>{roleLabel[role] || role}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-primary">Gửi lời mời</button>
      </form>
      {loading ? (
        <div className="py-10 text-center text-sm text-ink-secondary">Đang tải lời mời...</div>
      ) : invites.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-ink-secondary">Không có lời mời đang chờ.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {invites.map((invite) => (
            <div key={invite.invite_id} className="grid gap-3 border-b border-line p-4 last:border-b-0 md:grid-cols-[1fr_120px_120px] md:items-center">
              <div>
                <p className="font-semibold text-ink">{invite.invitee_email || invite.invitee_user_id}</p>
                <p className="text-xs text-ink-secondary">Tạo ngày {formatDateToVN(invite.created_at)}</p>
              </div>
              <Badge>{roleLabel[invite.role] || invite.role}</Badge>
              <Badge>{{ pending: "Đang chờ", accepted: "Đã chấp nhận", declined: "Đã từ chối", rejected: "Đã từ chối", expired: "Hết hạn", revoked: "Đã thu hồi" }[invite.status] || "Chưa xác định"}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SettingsPanel = ({ folder }: { folder: WorkspaceFolder }) => (
  <div className="space-y-4 p-4">
    <div className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-lg font-bold text-ink">Thông tin chung</h2>
      <p className="mt-2 text-sm text-ink-secondary">{folder.description || "Thư mục này chưa có mô tả."}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{roleLabel[folder.permission || "viewer"]}</Badge>
        {folder.isShared && <Badge>Đang chia sẻ</Badge>}
      </div>
    </div>
  </div>
);
