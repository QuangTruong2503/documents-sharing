import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MoreVertical, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";
import WorkspaceConfirmDialog from "../../../components/Workspace/WorkspaceConfirmDialog";
import Modal from "../../../components/Workspace/dialogs/Modal";
import PaginationControl from "../../../components/Pagination/Pagination";
import { apiMessage } from "../../../utils/apiMessage";
import type { Pagination } from "../types";

type Confirm = (message: string, title?: string) => Promise<boolean>;
const ConfirmContext = createContext<Confirm>(async () => false);
export function AdminConfirmProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<{
    message: string;
    title: string;
    done: (value: boolean) => void;
  } | null>(null);
  const active = useRef<typeof pending>(null);
  const confirm = useCallback<Confirm>(
    (message, title = "Xác nhận thao tác") =>
      new Promise((done) => {
        active.current?.done(false);
        active.current = { message, title, done };
        setPending(active.current);
      }),
    [],
  );
  const finish = (value: boolean) => {
    active.current?.done(value);
    active.current = null;
    setPending(null);
  };
  useEffect(
    () => () => {
      active.current?.done(false);
    },
    [],
  );
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <WorkspaceConfirmDialog
          title={pending.title}
          message={pending.message}
          confirmLabel="Xác nhận"
          onCancel={() => finish(false)}
          onConfirm={() => finish(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
}
export const useAdminConfirm = () => useContext(ConfirmContext);
export function useAdminAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = async (
    action: () => Promise<unknown>,
    success: string,
    after?: () => void,
  ) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    try {
      await action();
      toast.success(success);
      after?.();
      return true;
    } catch (error) {
      toast.error(apiMessage(error, "Không thực hiện được thao tác."));
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { busy, run };
}
export function AdminModal({
  title,
  children,
  onClose,
  busy = false,
  drawer = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
  drawer?: boolean;
}) {
  return (
    <Modal label={title} onClose={onClose} busy={busy} drawer={drawer}>
      <section className="w-full rounded-md bg-surface">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            className="btn-secondary"
            aria-label="Đóng hộp thoại"
            disabled={busy}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-4">{children}</div>
      </section>
    </Modal>
  );
}
export { default as Badge } from "../../../components/Badge";
export function SearchInput({
  value,
  onChange,
  label = "Tìm kiếm",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <input
      className="input-field w-full md:w-64"
      aria-label={label}
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
export function ListPanel({
  loading,
  empty,
  children,
}: {
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card relative min-w-0" aria-busy={loading}>
      {loading && (
        <div
          role="status"
          className="flex items-center gap-2 border-b border-line p-3 text-sm text-ink-secondary"
        >
          <RefreshCw size={16} className="animate-spin" />
          Đang tải dữ liệu…
        </div>
      )}
      {empty ? (
        <p className="p-8 text-center text-ink-secondary">
          {loading ? "Đang tải…" : "Không có dữ liệu phù hợp."}
        </p>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </section>
  );
}
export function AdminPagination({
  pagination,
  params,
  setFilter,
}: {
  pagination: Pagination;
  params: URLSearchParams;
  setFilter: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3 py-3">
      <label className="flex items-center gap-2 text-sm">
        Số mục mỗi trang
        <select
          aria-label="Số mục mỗi trang"
          className="input-field w-20"
          value={params.get("pageSize") ?? pagination.pageSize}
          onChange={(e) => setFilter("pageSize", e.target.value)}
        >
          {[20, 50, 100].map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </label>
      <PaginationControl
        {...pagination}
        onPageChange={(page) => setFilter("page", String(page))}
        itemLabel="mục"
      />
    </div>
  );
}
interface MenuAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}
export function AdminActionMenu({
  actions,
  disabled,
}: {
  actions: MenuAction[];
  disabled?: boolean;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const outside = (e: PointerEvent) => {
      if (
        !menu.current?.contains(e.target as Node) &&
        !trigger.current?.contains(e.target as Node)
      )
        close();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        trigger.current?.focus();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(
          menu.current?.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ) ?? [],
        );
        const index = items.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        items[
          (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length
        ]?.focus();
      }
    };
    menu.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [position]);
  return (
    <>
      <button
        ref={trigger}
        className="btn-secondary"
        type="button"
        aria-label="Thao tác người dùng"
        aria-haspopup="menu"
        aria-expanded={!!position}
        disabled={disabled}
        onClick={() => {
          if (position) {
            setPosition(null);
            return;
          }
          const box = trigger.current!.getBoundingClientRect();
          const height = actions.length * 42 + 16;
          setPosition({
            top: Math.max(
              8,
              box.bottom + height > window.innerHeight
                ? box.top - height
                : box.bottom + 4,
            ),
            left: Math.max(
              8,
              Math.min(box.right - 230, window.innerWidth - 238),
            ),
          });
        }}
      >
        <MoreVertical size={18} />
      </button>
      {position &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label="Thao tác người dùng"
            className="fixed z-40 w-[230px] rounded-md border border-line bg-surface p-2 shadow-lg"
            style={position}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                role="menuitem"
                disabled={action.disabled}
                title={action.title}
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-canvas disabled:opacity-50"
                onClick={() => {
                  trigger.current?.focus();
                  setPosition(null);
                  action.onClick();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
