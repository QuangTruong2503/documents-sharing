import React, { useState } from "react";
import adminApi from "../../../api/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import {
  AdminPagination,
  ListPanel,
  SearchInput,
} from "../components/AdminShared";
import { formatDate, ownerName } from "../adminFormat";

export function prettyMetadata(value?: string) {
  if (!value) return "-";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
export default function AuditLogsView() {
  const list = useAdminList(adminApi.getAuditLogs, 50);
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {(
          [
            ["action", "Hành động", list.options?.actions ?? []],
            ["entityType", "Đối tượng", list.options?.entityTypes ?? []],
          ] as [string, string, string[]][]
        ).map(([key, label, options]) => (
          <select
            key={key}
            className="input-field w-auto"
            aria-label={label}
            value={list.params.get(key) ?? ""}
            onChange={(e) => list.setFilter(key, e.target.value)}
          >
            <option value="">Tất cả {label.toLowerCase()}</option>
            {options.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        ))}
        <SearchInput
          label="Mã người thực hiện"
          value={list.params.get("actorUserId") ?? ""}
          onChange={(v) => list.setFilter("actorUserId", v)}
        />
        {[
          ["from", "Từ ngày"],
          ["to", "Đến ngày"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              className="input-field"
              type="date"
              value={list.params.get(key) ?? ""}
              onChange={(e) => list.setFilter(key, e.target.value)}
            />
          </label>
        ))}
      </div>
      <ListPanel loading={list.loading} empty={!list.data.length}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Thời gian",
                "Người thực hiện",
                "Hành động",
                "Đối tượng",
                "Chi tiết",
              ].map((x) => (
                <th key={x} className="p-4">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.data.map((row) => (
              <React.Fragment key={row.audit_id}>
                <tr className="border-t border-line">
                  <td className="p-4 whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="p-4">
                    {ownerName(row.actor)}
                    <p>{row.actor?.email}</p>
                  </td>
                  <td className="p-4">{row.action}</td>
                  <td className="p-4">
                    {row.entity_type} · {row.entity_id}
                  </td>
                  <td className="p-4">
                    <button
                      className="btn-secondary whitespace-nowrap"
                      aria-expanded={expanded === row.audit_id}
                      onClick={() =>
                        setExpanded(
                          expanded === row.audit_id ? null : row.audit_id,
                        )
                      }
                    >
                      {expanded === row.audit_id ? "Thu gọn" : "Xem chi tiết"}
                    </button>
                  </td>
                </tr>
                {expanded === row.audit_id && (
                  <tr>
                    <td colSpan={5} className="p-4">
                      <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-canvas p-4 text-xs">
                        {prettyMetadata(row.metadata)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </ListPanel>
      <AdminPagination {...list} />
    </div>
  );
}
