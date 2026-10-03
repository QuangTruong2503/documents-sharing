import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const modalStack: HTMLElement[] = [];
let savedBodyOverflow = "";

export default function Modal({ children, onClose, busy = false, label = "Hộp thoại", drawer = false }: {
  children: React.ReactNode; onClose: () => void; busy?: boolean; label?: string; drawer?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [title, setTitle] = useState(label);
  const originalFocus = useRef(document.activeElement as HTMLElement | null);
  const callback = useRef(onClose);
  const busyRef = useRef(busy);
  callback.current = onClose;
  busyRef.current = busy;
  useEffect(() => {
    const previous = originalFocus.current;
    if (!modalStack.length) savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = ref.current!;
    modalStack.push(panel);
    const isTop = () => modalStack[modalStack.length - 1] === panel;
    const heading = panel.querySelector("h1, h2, h3");
    setTitle(heading?.textContent || label);
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
    if (!panel.contains(document.activeElement)) (panel.querySelector<HTMLElement>("input, select, textarea") || focusable()[0] || panel).focus();
    const keydown = (event: KeyboardEvent) => {
      if (!isTop()) return;
      if (event.key === "Escape") {
        event.preventDefault(); event.stopPropagation();
        if (!busyRef.current) callback.current();
      }
      if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0], last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); panel.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const keepFocus = (event: FocusEvent) => {
      if (!isTop()) return;
      if (!panel.contains(event.target as Node)) (focusable()[0] || panel).focus();
    };
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", keepFocus);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", keepFocus);
      const index = modalStack.indexOf(panel);
      if (index >= 0) modalStack.splice(index, 1);
      if (!modalStack.length) document.body.style.overflow = savedBodyOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [titleId, label]);
  return createPortal(
    <div className={`fixed inset-0 z-50 flex bg-black/40 ${drawer ? "justify-end" : "items-center justify-center p-4"}`}
      onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} aria-labelledby={titleId} tabIndex={-1}
        className={drawer ? "h-full w-full max-w-md overflow-y-auto bg-surface" : "flex max-h-[calc(100vh-2rem)] w-full max-w-xl justify-center overflow-y-auto"}>
        <span id={titleId} className="sr-only">{title}</span>
        {children}
      </div>
    </div>, document.body
  );
}
