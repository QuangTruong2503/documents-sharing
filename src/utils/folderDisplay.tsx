import React from "react";
export const roleLabel: Record<string, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị",
  editor: "Biên tập",
  contributor: "Đóng góp",
  commenter: "Bình luận",
  viewer: "Xem",
  public: "Công khai",
};



export const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-secondary">
    {children}
  </span>
);

