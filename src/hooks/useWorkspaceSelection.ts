import { useEffect, useRef, useState } from "react";
import { WorkspaceItem } from "api/workspaceLibraryApi.ts";

export const itemKey = (item: WorkspaceItem) => `${item.type}-${item.id}`;
export default function useWorkspaceSelection(items: WorkspaceItem[]) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const anchor = useRef<string | null>(null);
  useEffect(() => {
    const validKeys = new Set(items.map(itemKey));
    setSelectedKeys(current => current.some(key => !validKeys.has(key)) ? current.filter(key => validKeys.has(key)) : current);
    if (anchor.current && !validKeys.has(anchor.current)) anchor.current = null;
  }, [items]);
  useEffect(() => { if (selectedKeys.length === 0) anchor.current = null; }, [selectedKeys]);
  const toggleSelection = (item: WorkspaceItem, shift = false) => {
    const key = itemKey(item);
    const keys = items.map(itemKey);
    const start = anchor.current ? keys.indexOf(anchor.current) : -1;
    const end = keys.indexOf(key);
    if (shift && start >= 0 && end >= 0) {
      const range = keys.slice(Math.min(start, end), Math.max(start, end) + 1);
      setSelectedKeys(current => Array.from(new Set([...current, ...range])));
    } else {
      setSelectedKeys(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key]);
      anchor.current = key;
    }
  };
  return { selectedKeys, setSelectedKeys, toggleSelection };
}
