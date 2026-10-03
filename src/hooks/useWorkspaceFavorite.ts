import { Dispatch, MutableRefObject, SetStateAction, useRef } from "react";
import { toast } from "react-toastify";
import workspaceLibraryApi, { WorkspaceItem } from "api/workspaceLibraryApi.ts";
import { WorkspacePagination } from "utils/workspaceLibraryHelpers.ts";
import { apiMessage } from "utils/apiMessage.ts";

export default function useWorkspaceFavorite({ area, items, setItems, setCounts, setPagination, requestId, refreshSummary, reload }: {
  area: string; items: WorkspaceItem[]; setItems: Dispatch<SetStateAction<WorkspaceItem[]>>;
  setCounts: Dispatch<SetStateAction<Record<string, number>>>;
  setPagination?: Dispatch<SetStateAction<WorkspacePagination>>;
  requestId: MutableRefObject<number>; refreshSummary: () => Promise<void>; reload: () => void;
}) {
  const pending = useRef(new Set<string>());
  return async (item: WorkspaceItem) => {
    const key = `${item.type}-${item.id}`;
    if (area === "trash" || pending.current.has(key)) return;
    pending.current.add(key);
    const request = requestId.current;
    const nextFavorite = !item.isFavorite;
    const removed = area === "favorites" && !nextFavorite;
    const index = items.findIndex(row => row.id === item.id && row.type === item.type);
    const same = (row: WorkspaceItem) => row.id === item.id && row.type === item.type;
    const changeCount = (delta: number) => setCounts(current => ({ ...current, favorites: Math.max(0, (current.favorites || 0) + delta) }));
    setItems(current => removed ? current.filter(row => !same(row)) : current.map(row => same(row) ? { ...row, isFavorite: nextFavorite } : row));
    changeCount(nextFavorite ? 1 : -1);
    if (removed) setPagination?.(current => ({ ...current, totalCount: Math.max(0, current.totalCount - 1) }));
    try {
      await workspaceLibraryApi.setFavorite(item.id, { type: item.type, favorite: nextFavorite });
      await refreshSummary();
      if (removed && requestId.current === request) reload();
    } catch (error) {
      if (requestId.current === request) {
        setItems(current => {
          if (!removed) return current.map(row => same(row) ? item : row);
          if (current.some(same)) return current;
          const next = [...current]; next.splice(Math.max(0, index), 0, item); return next;
        });
        if (removed) setPagination?.(current => ({ ...current, totalCount: current.totalCount + 1 }));
      }
      changeCount(nextFavorite ? -1 : 1);
      toast.error(apiMessage(error, "Không thể cập nhật yêu thích."));
    } finally { pending.current.delete(key); }
  };
}
