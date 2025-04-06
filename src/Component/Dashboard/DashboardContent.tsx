import React from "react";
import { NavLink } from "react-router-dom";

// Define interface for the menu items
interface MenuItem {
  name: string;
  url: string;
}

// Define props interface
interface ManageDashboardProps {
  data?: MenuItem[];
}

function ManageDashboard({ 
  data = [{ name: "", url: "" }] 
}: ManageDashboardProps) {
  return (
    <ul className="flex flex-col space-y-2">
      {data.map((item, index) => (
        <li key={index}>
          <NavLink
            to={item.url}
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-gray-100 text-blue-600 font-semibold"
                  : "text-gray-700 hover:bg-gray-50 hover:text-blue-500"
              }`
            }
          >
            <span>{item.name}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default ManageDashboard;