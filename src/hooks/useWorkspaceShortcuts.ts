import { useEffect, useRef } from "react";

export default function useWorkspaceShortcuts(handler: (event: KeyboardEvent) => void) {
  const current = useRef(handler);
  current.current = handler;
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      current.current(event);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}
