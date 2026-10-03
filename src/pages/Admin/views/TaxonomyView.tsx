import React, { useMemo, useState } from "react";
import adminApi from "../../../api/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import {
  AdminPagination,
  ListPanel,
  SearchInput,
  useAdminAction,
  useAdminConfirm,
} from "../components/AdminShared";
import type { Taxonomy } from "../types";

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function excludedParents(rows: Taxonomy[], id: string | null) {
  const excluded = new Set<string>();
  if (!id) return excluded;
  excluded.add(id);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) {
      if (
        row.parent_id &&
        excluded.has(row.parent_id) &&
        row.category_id &&
        !excluded.has(row.category_id)
      ) {
        excluded.add(row.category_id);
        changed = true;
      }
    }
  }
  return excluded;
}
export default function TaxonomyView({
  type,
}: {
  type: "categories" | "tags";
}) {
  const list = useAdminList(
    type === "categories" ? adminApi.getCategories : adminApi.getTags,
  );
  const action = useAdminAction();
  const confirm = useAdminConfirm();
  const [form, setForm] = useState({
    id: null as string | null,
    name: "",
    slug: "",
    description: "",
    parentId: "",
  });
  const excluded = useMemo(
    () => excludedParents(list.data, form.id),
    [list.data, form.id],
  );
  const filtered = list.data.filter((x) =>
    `${x.name} ${x.category_id ?? x.tag_id}`
      .toLowerCase()
      .includes((list.params.get("search") ?? "").toLowerCase()),
  );
  const size = Number(list.params.get("pageSize")) || 20;
  const page = Math.max(1, Number(list.params.get("page")) || 1);
  const shown = filtered.slice((page - 1) * size, page * size);
  const pagination = {
    currentPage: page,
    pageSize: size,
    totalCount: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
  };
  const clear = () =>
    setForm({ id: null, name: "", slug: "", description: "", parentId: "" });
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await action.run(
      () =>
        type === "categories"
          ? adminApi.saveCategory(form.id, {
              categoryId: form.slug,
              name: form.name.trim(),
              description: form.description,
              parentId: form.parentId,
            })
          : adminApi.saveTag(form.id, {
              tagId: form.slug,
              name: form.name.trim(),
            }),
      form.id ? "Đã cập nhật phân loại." : "Đã tạo phân loại.",
      list.reload,
    );
    if (ok) clear();
  };
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[300px_1fr]">
      <form className="surface-card space-y-4 p-4" onSubmit={save}>
        <h2 className="text-lg font-semibold">
          {form.id ? "Sửa" : "Tạo"}{" "}
          {type === "categories" ? "chuyên mục" : "thẻ"}
        </h2>
        <label className="block">
          Tên
          <input
            className="input-field mt-2"
            required
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
                slug: form.id ? form.slug : slugify(e.target.value),
              })
            }
          />
        </label>
        <label className="block">
          Slug
          <input
            className="input-field mt-2"
            required
            disabled={!!form.id}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </label>
        {type === "categories" && (
          <>
            <label className="block">
              Chuyên mục cha
              <select
                className="input-field mt-2"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <option value="">Không có chuyên mục cha</option>
                {list.data
                  .filter((x) => x.category_id && !excluded.has(x.category_id))
                  .map((x) => (
                    <option key={x.category_id} value={x.category_id}>
                      {x.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block">
              Mô tả
              <textarea
                className="input-field mt-2"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
          </>
        )}
        <div className="flex gap-2">
          <button className="btn-primary" disabled={action.busy}>
            {form.id ? "Cập nhật" : "Tạo mới"}
          </button>
          {form.id && (
            <button
              type="button"
              className="btn-secondary"
              disabled={action.busy}
              onClick={clear}
            >
              Hủy
            </button>
          )}
        </div>
      </form>
      <div className="min-w-0 space-y-4">
        <SearchInput
          value={list.params.get("search") ?? ""}
          onChange={(v) => list.setFilter("search", v)}
          label="Tìm phân loại"
        />
        <ListPanel loading={list.loading} empty={!shown.length}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  "Tên / Slug",
                  ...(type === "categories" ? ["Chuyên mục cha"] : []),
                  "Tài liệu",
                  "Thao tác",
                ].map((x) => (
                  <th className="p-4" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const id = row.category_id ?? row.tag_id!;
                return (
                  <tr key={id} className="border-t border-line">
                    <td className="p-4">
                      {row.name}
                      <p className="text-xs text-ink-secondary">{id}</p>
                    </td>
                    {type === "categories" && (
                      <td className="p-4">
                        {row.parent_name ??
                          list.data.find((x) => x.category_id === row.parent_id)
                            ?.name ??
                          "-"}
                      </td>
                    )}
                    <td className="p-4">{row.document_count}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          className="btn-secondary"
                          disabled={action.busy}
                          onClick={() =>
                            setForm({
                              id,
                              name: row.name,
                              slug: id,
                              description: row.description ?? "",
                              parentId: row.parent_id ?? "",
                            })
                          }
                        >
                          Sửa
                        </button>
                        <button
                          className="btn-secondary text-danger"
                          disabled={action.busy}
                          onClick={async () => {
                            if (
                              await confirm(
                                `Xóa “${row.name}”? Phân loại đang có ${row.document_count} tài liệu và ${row.child_count ?? 0} chuyên mục con. Cần chuyển hoặc gỡ chúng trước khi xóa.`,
                              )
                            )
                              await action.run(
                                () => adminApi.deleteTaxonomy(type, id),
                                "Đã xóa phân loại.",
                                list.reload,
                              );
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ListPanel>
        <AdminPagination
          pagination={pagination}
          params={list.params}
          setFilter={list.setFilter}
        />
      </div>
    </div>
  );
}
