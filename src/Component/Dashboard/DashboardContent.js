import React from "react";
import { NavLink } from "react-router-dom";

function ManageDashboard({
  data = [
    {
      name: "",
      url: "",
    },
  ],
}) {
  const checkIfHrefContains = (url) => {
    // Lấy href hiện tại từ window.location.href
    const currentHref = window.location.href;

    // So sánh nếu href hiện tại chứa chuỗi url
    return currentHref.includes(url);
  };

  return (
    <ul className="flex flex-col">
      {/* Sidebar cho màn hình lớn */}
      <div className="hidden lg:block" id="accordionDashboard">
        {data.map((item, index) => (
          <li
            className={`mb-2 ${
              checkIfHrefContains(item.url)
                ? "bg-gray-200 text-blue-600 font-semibold"
                : ""
            }`}
            key={index}
          >
            <NavLink
              to={`${item.url}`}
              className="flex items-center text-gray-800 hover:text-blue-500 p-2 rounded transition"
            >
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </div>

      {/* Sidebar cho thiết bị di động */}
      {/* <div
        className="block lg:hidden"
        id="accordionDashboard"
      >
        {data.map((item, index) => (
          <li
            data-bs-dismiss="offcanvas"
            className={`mb-2 ${
              checkIfHrefContains(item.url)
                ? "bg-gray-200 text-blue-600 font-semibold"
                : ""
            }`}
            key={index}
          >
            <NavLink
              to={item.url}
              className="flex items-center text-gray-800 hover:text-blue-500 p-2 rounded transition"
            >
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </div> */}
    </ul>
  );
}

export default ManageDashboard;
