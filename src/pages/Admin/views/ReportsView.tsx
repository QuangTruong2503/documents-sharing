import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import adminApi from "../../../api/adminApi";
import { apiMessage } from "../../../utils/apiMessage";
import { useAdminList } from "../hooks/useAdminList";
import {
  AdminModal,
  AdminPagination,
  Badge,
  ListPanel,
  SearchInput,
  useAdminAction,
  useAdminConfirm,
} from "../components/AdminShared";
import {
  formatDate,
  ownerName,
  statusLabel,
  statusTone,
  statusOptions,
} from "../adminFormat";
import type { AdminReport, ResolveAction } from "../types";

export default function ReportsView() {
  const list = useAdminList(adminApi.getReports);
  const action = useAdminAction();
  const confirm = useAdminConfirm();
  const [options, setOptions] = useState(statusOptions);
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [opened, setOpened] = useState(false);
  const [note, setNote] = useState("");
  const detailId = useRef(0);
  const open = async (id: number) => {
    const request = ++detailId.current;
    setOpened(true);
    setSelected(null);
    setNote("");
    try {
      const report = await adminApi.getReport(id);
      if (request === detailId.current) setSelected(report);
    } catch (error) {
      if (request === detailId.current) {
        toast.error(apiMessage(error, "Không tải được báo cáo."));
        setOpened(false);
      }
    }
  };
  const close = () => {
    detailId.current++;
    setOpened(false);
    setSelected(null);
  };
  useEffect(() => {
    let active = true;
    adminApi
      .getReportOptions()
      .then((x) => {
        if (active)
          setOptions(
            x.statusOptions ??
              x.statuses.map((label) => ({ code: label, label })),
          );
      })
      .catch(() => {});
    const invalidate = () => {
      detailId.current++;
    };
    return () => {
      active = false;
      invalidate();
    };
  }, []);
  const reportParam = list.params.get("reportId");
  useEffect(() => {
    if (reportParam && /^\d+$/.test(reportParam))
      void open(Number(reportParam));
  }, [reportParam]);
  const resolve = async (type: ResolveAction) => {
    if (!selected) return;
    if (type === "reject" && !note.trim()) {
      toast.error("Vui lòng ghi lý do từ chối.");
      return;
    }
    if (
      !(await confirm(
        `Xác nhận xử lý báo cáo cho “${selected.document.title}”?`,
        type === "delete_document"
          ? "Xóa tài liệu và xử lý báo cáo"
          : "Xử lý báo cáo",
      ))
    )
      return;
    const ok = await action.run(
      () => adminApi.resolveReport(selected.report_id, type, note),
      "Đã xử lý báo cáo.",
      list.reload,
    );
    if (ok) close();
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          label="Tìm tên tài liệu, email người báo cáo"
          value={list.params.get("search") ?? ""}
          onChange={(v) => list.setFilter("search", v)}
        />
        <select
          aria-label="Trạng thái báo cáo"
          className="input-field w-auto"
          value={list.params.get("status") ?? ""}
          onChange={(e) => list.setFilter("status", e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {options.map((x) => (
            <option value={x.code} key={x.code}>
              {x.label}
            </option>
          ))}
        </select>
        <SearchInput
          label="Mã tài liệu"
          value={list.params.get("documentId") ?? ""}
          onChange={(v) => list.setFilter("documentId", v)}
        />
        <SearchInput
          label="Mã người báo cáo"
          value={list.params.get("userId") ?? ""}
          onChange={(v) => list.setFilter("userId", v)}
        />
      </div>
      <ListPanel loading={list.loading} empty={!list.data.length}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Tài liệu",
                "Người báo cáo",
                "Lý do",
                "Trạng thái",
                "Ngày gửi",
                "Thao tác",
              ].map((x) => (
                <th className="p-4 whitespace-nowrap" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.data.map((report) => (
              <tr className="border-t border-line" key={report.report_id}>
                <td className="min-w-48 p-4">{report.document.title}</td>
                <td className="p-4">
                  {ownerName(report.reporter)}
                  <p>{report.reporter.email}</p>
                </td>
                <td className="p-4 min-w-48">{report.reason}</td>
                <td className="p-4">
                  <Badge tone={statusTone(report.status)}>
                    {statusLabel(report.status)}
                  </Badge>
                </td>
                <td className="p-4 whitespace-nowrap">
                  {formatDate(report.created_at)}
                </td>
                <td className="p-4">
                  <button
                    className="btn-secondary whitespace-nowrap"
                    onClick={() => open(report.report_id)}
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListPanel>
      <AdminPagination {...list} />
      {opened && (
        <AdminModal
          title="Chi tiết báo cáo"
          drawer
          busy={action.busy}
          onClose={close}
        >
          {!selected ? (
            <p role="status">Đang tải báo cáo…</p>
          ) : (
            <>
              <p className="text-sm text-ink-secondary">
                Xem tài liệu, người báo cáo và xử lý.
              </p>
              <a
                href={`/document/${selected.document_id}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary"
              >
                {selected.document.title}
              </a>
              <p>Mã tài liệu {selected.document_id}</p>
              <p>Chủ sở hữu: {ownerName(selected.document.owner)}</p>
              <p>
                Trạng thái:{" "}
                {selected.document.is_public ? "Công khai" : "Riêng tư"}
              </p>
              <p>Báo cáo khác: {selected.document.other_report_count ?? 0}</p>
              <p>Người báo cáo: {selected.reporter.email}</p>
              <p>{selected.reason}</p>
              <Badge tone={statusTone(selected.status)}>
                {statusLabel(selected.status)}
              </Badge>
              <label className="block">
                Ghi chú xử lý
                <textarea
                  maxLength={2000}
                  className="input-field mt-2 min-h-28"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <div className="grid gap-2">
                {(
                  [
                    ["hide_document", "Ẩn tài liệu và đánh dấu Đã xử lý"],
                    ["delete_document", "Xóa tài liệu và đánh dấu Đã xử lý"],
                    ["reject", "Từ chối báo cáo"],
                    ["mark_resolved", "Đánh dấu Đã xử lý"],
                  ] as [ResolveAction, string][]
                ).map(([type, label]) => (
                  <button
                    key={type}
                    disabled={action.busy}
                    className="btn-secondary text-left"
                    onClick={() => resolve(type)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  disabled={action.busy}
                  className="btn-secondary text-danger"
                  onClick={async () => {
                    if (await confirm("Xóa vĩnh viễn báo cáo này?")) {
                      const ok = await action.run(
                        () => adminApi.deleteReport(selected.report_id),
                        "Đã xóa báo cáo.",
                        list.reload,
                      );
                      if (ok) close();
                    }
                  }}
                >
                  Xóa báo cáo
                </button>
              </div>
            </>
          )}
        </AdminModal>
      )}
    </div>
  );
}
