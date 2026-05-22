import React from "react";
import { RefreshCw } from "lucide-react";

function FullPageLoader({text}) {
  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex flex-col gap-2 items-center justify-center z-50">
      <RefreshCw className="h-7 w-7 animate-spin text-primary" />
      <span className="text-gray-700">{text || "Loading..."}</span>
    </div>
  );
}

export default FullPageLoader;
