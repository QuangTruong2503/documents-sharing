import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { FolderOpen, Users, Folder, Clock3, Star, Link2, ClipboardList, Trash2 } from "lucide-react";
import workspaceLibraryApi from "api/workspaceLibraryApi.ts";
import { formatBytes } from "utils/workspaceItem.ts";
import { LibraryArea, validArea, preferredView } from "utils/libraryQuery.ts";
interface LibraryContextValue {
 counts: Record<string, number>; storage: { usedBytes?: number; limitBytes?: number };
 refreshSummary: () => Promise<void>; setCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
 setRootArea: (area: LibraryArea) => void;
}
const LibraryContext = createContext<LibraryContextValue | null>(null);
export const useLibraryContext = () => { const value = useContext(LibraryContext); if (!value) throw new Error("LibraryLayout is required"); return value; };
const navItems = [
  { key: "my", label: "Tài liệu của tôi", icon: FolderOpen, href: "/library" },
  { key: "shared", label: "Được chia sẻ với tôi", icon: Users, href: "/library?area=shared" },
  { key: "team", label: "Thư viện nhóm", icon: Folder, href: "/library?area=team" },
  { key: "recent", label: "Gần đây", icon: Clock3, href: "/library?area=recent" },
  { key: "favorites", label: "Yêu thích", icon: Star, href: "/library?area=favorites" },
  { key: "shared-links", label: "Liên kết đã chia sẻ", icon: Link2, href: "/library?area=shared-links" },
  { key: "activity", label: "Hoạt động", icon: ClipboardList, href: "/library?area=activity" },
  { key: "trash", label: "Thùng rác", icon: Trash2, href: "/library?area=trash" },
];

const LibrarySidebar = ({
  activeArea,
  counts,
  storage,
}: {
  activeArea: string;
  counts: Record<string, number>;
  storage: { usedBytes?: number; limitBytes?: number };
}) => {
  const viewMode = preferredView(new URLSearchParams(useLocation().search).get("view"));
  const storagePercent = storage.limitBytes ? Math.min(100, Math.round(((storage.usedBytes || 0) / storage.limitBytes) * 100)) : 0;

  return (
    <aside className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface p-3 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
      <div className="mb-4 hidden items-center gap-2 px-2 lg:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
          <FolderOpen className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">DocShare</p>
          <p className="text-xs text-ink-secondary">Thư viện tài liệu</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto lg:block lg:space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeArea === item.key;
          return (
            <NavLink
              key={item.key}
              aria-current={active ? "page" : false}
              to={`${item.href}${item.href.includes("?") ? "&" : "?"}view=${viewMode}`}
              className={`flex shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-primary-soft text-primary" : "text-ink-secondary hover:bg-canvas hover:text-ink"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {counts[item.key] > 0 && <span className="text-xs">{counts[item.key]}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 hidden rounded-md border border-line bg-canvas p-3 lg:block">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary">
          <span>Dung lượng</span>
          <span>{storagePercent}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-line">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${storagePercent}%` }} />
        </div>
        <p className="mt-2 text-xs text-ink-secondary">
          Đang dùng {formatBytes(storage.usedBytes)} / {formatBytes(storage.limitBytes)}
        </p>
      </div>
    </aside>
  );
};

export default function LibraryLayout() {
 const location = useLocation();
 const [counts, setCounts] = useState<Record<string, number>>({});
 const [storage, setStorage] = useState<{ usedBytes?: number; limitBytes?: number }>({});
 const [rootArea, setRootArea] = useState<LibraryArea>("my");
 const request = useRef({ id: 0 });
 const refreshSummary = useCallback(async () => {
   const id = ++request.current.id;
   try { const response = await workspaceLibraryApi.getSummary(); if (id !== request.current.id) return;
     setCounts(current => ({ ...current, ...response.counts, "shared-links": response.counts.sharedLinks }));
     setStorage(response.storage);
   } catch { /* Keep the last successful summary while offline. */ }
 }, []);
 useEffect(() => { const tracker = request.current; refreshSummary(); return () => { tracker.id++; }; }, [refreshSummary]);
 const area = location.pathname.includes("/folders/") ? rootArea : validArea(new URLSearchParams(location.search).get("area") || (new URLSearchParams(location.search).get("tab") === "shared" ? "shared" : "my"));
 return <LibraryContext.Provider value={{ counts, storage, refreshSummary, setCounts, setRootArea }}>
   <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
     <LibrarySidebar activeArea={area} counts={counts} storage={storage} />
     <div className="min-w-0"><Outlet /></div>
   </div>
 </LibraryContext.Provider>;
}
