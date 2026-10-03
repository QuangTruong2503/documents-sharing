import { ChevronDown, ChevronRight } from "lucide-react";
import { FolderTreeNode } from "api/workspaceLibraryApi.ts";
import Modal from "./Modal.tsx";
import React, { useEffect, useState } from "react";

import { toast } from "react-toastify";

import workspaceLibraryApi, { WorkspaceItem } from "api/workspaceLibraryApi.ts";

import { workspaceFailureMessage } from "utils/workspaceLibraryHelpers.ts";

import { apiMessage } from "utils/apiMessage.ts";

import { toPayloadItems } from "utils/workspaceItem.ts";

const MoveCopyDialog = ({
  mode,
  items,
  onClose,
  onDone,
}: {
  mode: "move" | "copy";
  items: WorkspaceItem[];
  onClose: () => void;
  onDone: () => void;
}) => {
  const [nodes, setNodes] = useState<FolderTreeNode[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<number | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const sameParent = items.length > 0 && items.every(item => (item.parentFolderId ?? null) === (items[0].parentFolderId ?? null));
  const currentParent = sameParent ? items[0].parentFolderId ?? null : undefined;

  useEffect(() => {
    workspaceLibraryApi
      .getFolderTree({ root: "my", includeShared: true })
      .then((response) => {
        setNodes(response.nodes || []);
        const open = new Set<number>();
        const walk = (node: FolderTreeNode): boolean => {
          const children = node.children.map(walk);
          const found = node.id === currentParent || children.some(Boolean);
          if (found) open.add(node.id);
          return found;
        };
        response.nodes.forEach(walk); setExpanded(open);
      })
      .catch((error) => toast.error(apiMessage(error, "Không tải được cây thư mục.")));
  }, [currentParent]);

  const matches = (node: FolderTreeNode): boolean => node.name.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")) || node.children.some(matches);
  const renderNode = (node: FolderTreeNode, depth = 0, parentBlocked = false): React.ReactNode => {
    if (search && !matches(node)) return null;
    const blocked = parentBlocked || items.some(item => item.type === "folder" && item.id === node.id);
    const disabled = blocked || !node.canReceiveItems || (mode === "move" && node.id === currentParent);
    const open = !!search || expanded.has(node.id);
    return <div key={node.id}>
      <div className="flex items-center gap-2 border-b border-line py-2 pr-3" style={{ paddingLeft: depth * 18 + 8 }}>
        {node.children.length > 0 ? <button type="button" aria-label={node.name} aria-expanded={open} onClick={() => setExpanded(current => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; })}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</button> : <span className="w-[18px]" />}
        <label className={disabled ? "flex items-center gap-2 text-sm opacity-50" : "flex cursor-pointer items-center gap-2 text-sm"}>
          <input type="radio" name="destination" checked={targetFolderId === node.id} disabled={disabled || saving} onChange={() => setTargetFolderId(node.id)} /><span>{node.name}</span>
        </label>
      </div>
      {open && node.children.map(child => renderNode(child, depth + 1, blocked))}
    </div>;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (targetFolderId === undefined || saving) return;
    setSaving(true);
    try {
      const payload = { items: toPayloadItems(items), targetFolderId };
      const response = mode === "move" ? await workspaceLibraryApi.moveItems(payload) : await workspaceLibraryApi.copyItems(payload);
      if (response.failed?.length) {
        toast.info(workspaceFailureMessage(response, "Một số mục chưa xử lý được."));
      } else {
        toast.success(mode === "move" ? "Đã di chuyển." : "Đã sao chép.");
      }
      onDone();
    } catch (error: any) {
      toast.error(apiMessage(error, mode === "move" ? "Không thể di chuyển." : "Không thể sao chép."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} busy={saving}>
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold text-ink">{mode === "move" ? "Di chuyển" : "Sao chép"} {items.length} mục</h2>
        <input className="input-field mt-4" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm thư mục theo tên" aria-label="Tìm thư mục đích" />
        <div className="mt-5 max-h-80 overflow-auto rounded-lg border border-line">
          <label className="flex cursor-pointer items-center gap-3 border-b border-line p-3 text-sm hover:bg-canvas">
            <input type="radio" name="destination" disabled={saving || (mode === "move" && currentParent === null)} checked={targetFolderId === null} onChange={() => setTargetFolderId(null)} />
            <span className="font-medium text-ink">Tài liệu của tôi</span>
          </label>
          {nodes.filter(node => node.rootArea === "my").map(node => renderNode(node))}
          {nodes.some(node => node.rootArea === "shared") && <p className="border-t border-line p-3 text-sm font-semibold">Được chia sẻ với tôi</p>}
          {nodes.filter(node => node.rootArea === "shared").map(node => renderNode(node))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={saving || targetFolderId === undefined} className="btn-primary">{saving ? "Đang xử lý..." : "Xác nhận"}</button>
        </div>
      </form>
    </Modal>
  );
};

export default MoveCopyDialog;
