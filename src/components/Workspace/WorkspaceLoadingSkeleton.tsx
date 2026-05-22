import React from "react";

const skeletonCards = Array.from({ length: 8 });

const WorkspaceLoadingSkeleton: React.FC = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Đang tải nội dung">
    {skeletonCards.map((_, index) => (
      <div key={index} className="overflow-hidden rounded-lg border border-line bg-surface" aria-hidden="true">
        <div className="h-36 animate-pulse bg-canvas" />
        <div className="space-y-3 p-4">
          <div className="h-4 w-4/5 animate-pulse rounded bg-line" />
          <div className="h-3 w-full animate-pulse rounded bg-line" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-line" />
          <div className="flex justify-between pt-2">
            <div className="h-3 w-24 animate-pulse rounded bg-line" />
            <div className="h-3 w-16 animate-pulse rounded bg-line" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default WorkspaceLoadingSkeleton;
