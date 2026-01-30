import React from "react";
import { NavLink } from "react-router-dom";

interface MenuItem {
  name: string;
  url: string;
  icon: string;
}

interface ManageDashboardProps {
  data?: MenuItem[];
}

function ManageDashboard({
  data = [],
}: ManageDashboardProps) {
  return (
    <ul className="flex flex-col gap-1">
      {data.map((item, index) => (
        <li key={index}>
          <NavLink
            to={item.url}
            className={({ isActive }) =>
              `
              group relative flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-300 ease-out
              ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-blue-500"
              }
            `
            }
          >
            {/* Active indicator */}
            <span
              className={`
                absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r
                transition-all duration-300
                ${item.url ? "bg-blue-500 opacity-100" : "opacity-0"}
              `}
            />

            {/* Icon */}
            <i className={item.icon}></i>
            {/* Text */}
            <span className="text-sm font-medium tracking-wide">
              {item.name}
            </span>

          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default ManageDashboard;
