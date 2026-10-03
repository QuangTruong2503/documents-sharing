import React from "react";
import adminApi from "../../../api/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import {
  AdminPagination,
  Badge,
  ListPanel,
  SearchInput,
  useAdminAction,
  useAdminConfirm,
} from "../components/AdminShared";
import { formatDate, ownerName } from "../adminFormat";

export default function CollectionsView() {
  const list = useAdminList(adminApi.getCollections);
  const action = useAdminAction();
  const confirm = useAdminConfirm();
  return (
    <div className="space-y-4">
      <SearchInput
        label="Tìm bộ sưu tập"
        value={list.params.get("search") ?? ""}
        onChange={(v) => list.setFilter("search", v)}
      />
      <ListPanel loading={list.loading} empty={!list.data.length}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Bộ sưu tập",
                "Chủ sở hữu",
                "Trạng thái",
                "Tài liệu",
                "Ngày tạo",
                "Thao tác",
              ].map((x) => (
                <th className="p-4" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.data.map((row) => (
              <tr key={row.collection_id} className="border-t border-line">
                <td className="min-w-48 p-4">
                  <a
                    href={`/collection/${row.collection_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary"
                  >
                    {row.name}
                  </a>
                </td>
                <td className="p-4">{ownerName(row.owner)}</td>
                <td className="p-4">
                  <Badge tone={row.is_public ? "success" : "neutral"}>
                    {row.is_public ? "Công khai" : "Riêng tư"}
                  </Badge>
                </td>
                <td className="p-4">{row.document_count}</td>
                <td className="p-4 whitespace-nowrap">
                  {formatDate(row.created_at)}
                </td>
                <td className="p-4">
                  <button
                    className="btn-secondary text-danger"
                    disabled={action.busy}
                    onClick={async () => {
                      if (
                        await confirm(
                          `Xóa bộ sưu tập “${row.name}” với ${row.document_count} tài liệu? Các tài liệu gốc vẫn được giữ.`,
                        )
                      )
                        await action.run(
                          () => adminApi.deleteCollection(row.collection_id),
                          "Đã xóa bộ sưu tập.",
                          list.reload,
                        );
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListPanel>
      <AdminPagination {...list} />
    </div>
  );
}
