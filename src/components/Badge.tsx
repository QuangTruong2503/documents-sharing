import React from "react";

export default function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  const color = tone
    ? ({
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
        info: "bg-primary-soft text-primary",
        neutral: "bg-canvas text-ink-secondary",
      }[tone] ?? "bg-canvas text-ink-secondary")
    : "border border-line text-ink-secondary";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${color}`}
    >
      {children}
    </span>
  );
}
