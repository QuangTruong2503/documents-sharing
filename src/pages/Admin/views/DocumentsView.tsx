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

export default function DocumentsView() {
  const list = useAdminList(adminApi.getDocuments);
  const action = useAdminAction();
  const confirm = useAdminConfirm();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={list.params.get("search") ?? ""}
          onChange={(v) => list.setFilter("search", v)}
          label="Tìm tài liệu, chủ sở hữu"
        />
        <select
          aria-label="Trạng thái công khai"
          className="input-field w-auto"
          value={list.params.get("isPublic") ?? ""}
          onChange={(e) => list.setFilter("isPublic", e.target.value)}
        >
          <option value="">Tất cả tài liệu</option>
          <option value="true">Công khai</option>
          <option value="false">Riêng tư</option>
        </select>
        <select
          aria-label="Báo cáo tài liệu"
          className="input-field w-auto"
          value={list.params.get("hasReports") ?? ""}
          onChange={(e) => list.setFilter("hasReports", e.target.value)}
        >
          <option value="">Tất cả báo cáo</option>
          <option value="true">Có báo cáo</option>
          <option value="false">Không có báo cáo</option>
        </select>
        <select
          aria-label="Sắp xếp tài liệu"
          className="input-field w-auto"
          value={list.params.get("sortBy") ?? "uploaded_at"}
          onChange={(e) => list.setFilter("sortBy", e.target.value)}
        >
          <option value="uploaded_at">Mới nhất</option>
          <option value="download_count">Lượt tải</option>
          <option value="report_count">Số báo cáo</option>
        </select>
      </div>
      <ListPanel loading={list.loading} empty={!list.data.length}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Tài liệu",
                "Chủ sở hữu",
                "Trạng thái",
                "Lượt tải / Báo cáo",
                "Ngày tải lên",
                "Thao tác",
              ].map((x) => (
                <th key={x} className="p-4 whitespace-nowrap">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.data.map((doc) => (
              <tr key={doc.document_id} className="border-t border-line">
                <td className="min-w-52 p-4">
                  <a
                    className="font-medium text-primary"
                    href={`/document/${doc.document_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doc.title}
                  </a>
                </td>
                <td className="p-4">{ownerName(doc.owner)}</td>
                <td className="p-4">
                  <Badge tone={doc.is_public ? "success" : "neutral"}>
                    {doc.is_public ? "Công khai" : "Riêng tư"}
                  </Badge>
                </td>
                <td className="p-4">
                  {doc.download_count} / {doc.report_count}
                </td>
                <td className="p-4 whitespace-nowrap">
                  {formatDate(doc.uploaded_at)}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      disabled={action.busy}
                      className="btn-secondary whitespace-nowrap"
                      onClick={async () => {
                        if (
                          await confirm(
                            `Chuyển tài liệu “${doc.title}” sang ${doc.is_public ? "riêng tư" : "công khai"}?`,
                          )
                        )
                          await action.run(
                            () =>
                              adminApi.updateDocument(doc.document_id, {
                                isPublic: !doc.is_public,
                              }),
                            "Đã cập nhật tài liệu.",
                            list.reload,
                          );
                      }}
                    >
                      {doc.is_public ? "Chuyển riêng tư" : "Công khai"}
                    </button>
                    <button
                      disabled={action.busy}
                      className="btn-secondary text-danger"
                      onClick={async () => {
                        if (
                          await confirm(
                            `Xóa “${doc.title}” với ${doc.download_count} lượt tải và ${doc.report_count} báo cáo?`,
                            "Xóa tài liệu",
                          )
                        )
                          await action.run(
                            () => adminApi.deleteDocument(doc.document_id),
                            "Đã xóa tài liệu.",
                            list.reload,
                          );
                      }}
                    >
                      Xóa
                    </button>
                  </div>
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
