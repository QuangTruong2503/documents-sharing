import React, { useState } from "react";
import Cookies from "js-cookie";
import adminApi from "../../../api/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import {
  AdminActionMenu,
  AdminModal,
  AdminPagination,
  Badge,
  ListPanel,
  SearchInput,
  useAdminAction,
  useAdminConfirm,
} from "../components/AdminShared";
import { formatDate, ownerName } from "../adminFormat";
import { formatBytes } from "../../../utils/workspaceItem";
import type { AdminUser } from "../types";

export default function UsersView() {
  const list = useAdminList(adminApi.getUsers);
  const action = useAdminAction();
  const confirm = useAdminConfirm();
  const [form, setForm] = useState<{
    user: AdminUser;
    type: "name" | "quota";
    value: string;
  } | null>(null);
  let currentId = "";
  try {
    currentId = JSON.parse(Cookies.get("user") ?? "{}").userId ?? "";
  } catch {
    /* expired cookie */
  }
  const changeRole = async (user: AdminUser) => {
    const role = user.role === "admin" ? "user" : "admin";
    if (user.user_id === currentId && role === "user") return;
    if (
      await confirm(
        role === "admin"
          ? `Cấp quyền quản trị cho ${user.email}? Người này sẽ có toàn quyền quản lý người dùng, tài liệu và cấu hình hệ thống.`
          : `Gỡ quyền quản trị của ${user.email}?`,
        "Thay đổi quyền quản trị",
      )
    )
      await action.run(
        () => adminApi.updateUser(user.user_id, { role }),
        "Đã cập nhật quyền.",
        list.reload,
      );
  };
  const remove = async (user: AdminUser) => {
    if (user.user_id === currentId) return;
    if (
      await confirm(
        `Xóa tài khoản ${user.email} cùng ${user.document_count} tài liệu và ${user.collection_count} bộ sưu tập? Tài khoản có thư mục cần chuyển quyền sở hữu và gỡ thành viên trước.`,
        "Xóa người dùng",
      )
    )
      await action.run(
        () => adminApi.deleteUser(user.user_id),
        "Đã xóa người dùng.",
        list.reload,
      );
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const quota = Number(form.value);
    if (form.type === "quota" && (!Number.isFinite(quota) || quota <= 0))
      return;
    const ok = await action.run(
      () =>
        form.type === "quota"
          ? adminApi.updateUserStorage(
              form.user.user_id,
              Math.round(quota * 1024 ** 3),
            )
          : adminApi.updateUser(form.user.user_id, {
              fullName: form.value.trim(),
            }),
      "Đã cập nhật người dùng.",
      list.reload,
    );
    if (ok) setForm(null);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          label="Tìm email, tên người dùng"
          value={list.params.get("search") ?? ""}
          onChange={(v) => list.setFilter("search", v)}
        />
        <select
          className="input-field w-auto"
          aria-label="Vai trò"
          value={list.params.get("role") ?? ""}
          onChange={(e) => list.setFilter("role", e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="user">Người dùng</option>
          <option value="admin">Quản trị viên</option>
        </select>
        <select
          className="input-field w-auto"
          aria-label="Xác minh"
          value={list.params.get("isVerified") ?? ""}
          onChange={(e) => list.setFilter("isVerified", e.target.value)}
        >
          <option value="">Tất cả trạng thái xác minh</option>
          <option value="true">Đã xác minh</option>
          <option value="false">Chưa xác minh</option>
        </select>
        <select
          className="input-field w-auto"
          aria-label="Sắp xếp người dùng"
          value={list.params.get("sortBy") ?? "created_at"}
          onChange={(e) => list.setFilter("sortBy", e.target.value)}
        >
          <option value="created_at">Mới nhất</option>
          <option value="document_count">Số tài liệu</option>
          <option value="storage_used_bytes">Dung lượng</option>
        </select>
      </div>
      <ListPanel loading={list.loading} empty={!list.data.length}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Người dùng",
                "Vai trò",
                "Tài liệu",
                "Dung lượng đã dùng / giới hạn",
                "Ngày tạo",
                "Thao tác",
              ].map((x) => (
                <th key={x} className="whitespace-nowrap p-4">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.data.map((user) => (
              <tr key={user.user_id} className="border-t border-line">
                <td className="p-4">
                  <p className="font-medium">{ownerName(user)}</p>
                  <p>{user.email}</p>
                  {user.is_verified && (
                    <Badge tone="success">Đã xác minh</Badge>
                  )}
                </td>
                <td className="p-4">
                  <Badge tone={user.role === "admin" ? "info" : "neutral"}>
                    {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </Badge>
                </td>
                <td className="p-4">{user.document_count}</td>
                <td className="min-w-48 p-4">
                  {formatBytes(user.storage_used_bytes)} /{" "}
                  {formatBytes(user.storage_limit_bytes ?? 10 * 1024 ** 3)}
                  <progress
                    className="mt-2 block h-2 w-full"
                    aria-label="Dung lượng đã dùng"
                    value={user.storage_used_bytes}
                    max={user.storage_limit_bytes ?? 10 * 1024 ** 3}
                  />
                </td>
                <td className="whitespace-nowrap p-4">
                  {formatDate(user.created_at)}
                </td>
                <td className="p-4">
                  <AdminActionMenu
                    disabled={action.busy}
                    actions={[
                      {
                        label: "Đổi tên hiển thị",
                        onClick: () =>
                          setForm({
                            user,
                            type: "name",
                            value: user.full_name ?? "",
                          }),
                      },
                      {
                        label: "Đặt giới hạn dung lượng",
                        onClick: () =>
                          setForm({
                            user,
                            type: "quota",
                            value: String(
                              (user.storage_limit_bytes ?? 10 * 1024 ** 3) /
                                1024 ** 3,
                            ),
                          }),
                      },
                      {
                        label: "Xóa ảnh đại diện",
                        onClick: async () => {
                          if (
                            await confirm(
                              `Xóa ảnh đại diện của ${ownerName(user)}?`,
                            )
                          )
                            await action.run(
                              () =>
                                adminApi.updateUser(user.user_id, {
                                  avatarUrl: null,
                                }),
                              "Đã xóa ảnh đại diện.",
                              list.reload,
                            );
                        },
                      },
                      {
                        label:
                          user.role === "admin"
                            ? "Gỡ quyền quản trị"
                            : "Cấp quyền quản trị",
                        onClick: () => changeRole(user),
                        disabled:
                          user.user_id === currentId && user.role === "admin",
                        title:
                          user.user_id === currentId
                            ? "Không thể tự hạ quyền."
                            : undefined,
                      },
                      {
                        label: user.is_verified
                          ? "Hủy xác minh"
                          : "Xác minh tài khoản",
                        onClick: async () => {
                          if (
                            await confirm(
                              `Đổi trạng thái xác minh của ${user.email}?`,
                            )
                          )
                            await action.run(
                              () =>
                                adminApi.updateUser(user.user_id, {
                                  isVerified: !user.is_verified,
                                }),
                              "Đã cập nhật xác minh.",
                              list.reload,
                            );
                        },
                      },
                      {
                        label: "Xóa người dùng",
                        onClick: () => remove(user),
                        disabled: user.user_id === currentId,
                        title:
                          user.user_id === currentId
                            ? "Không thể tự xóa tài khoản."
                            : undefined,
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListPanel>
      <AdminPagination {...list} />
      {form && (
        <AdminModal
          title={
            form.type === "quota"
              ? "Đặt giới hạn dung lượng"
              : "Đổi tên hiển thị"
          }
          onClose={() => setForm(null)}
          busy={action.busy}
        >
          <form onSubmit={save} className="space-y-4">
            <label className="block">
              {form.type === "quota" ? "Giới hạn (GB)" : "Tên hiển thị"}
              <input
                className="input-field mt-2"
                required
                type={form.type === "quota" ? "number" : "text"}
                min={form.type === "quota" ? "0.001" : undefined}
                step="any"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </label>
            <button
              type="submit"
              className="btn-primary"
              disabled={action.busy}
            >
              Lưu thay đổi
            </button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
