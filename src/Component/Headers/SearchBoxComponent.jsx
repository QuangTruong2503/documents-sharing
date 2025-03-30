import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function SearchBoxComponent() {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
  
    // Cập nhật giá trị khi nhập vào input
    const handleSearchChange = (e) => {
      const value = e.target.value.trimStart(); // Loại bỏ khoảng trắng đầu
      setSearchQuery(value);
    };
  
    // Xử lý tìm kiếm khi submit form
    const handleSearch = (e) => {
      e.preventDefault();
      if (!searchQuery.trim()) {
        alert("Vui lòng nhập từ khóa tìm kiếm!");
        return;
      }
      navigate(`/search/${encodeURIComponent(searchQuery.trim())}`); // Mã hóa URL
    };
  return (
    <div>
      {" "}
      {/* Search Box */}
      <form className="w-full" onSubmit={handleSearch}>
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Search documents..."
          />
          <button
            type="submit"
            className="absolute inset-y-0 start-0 flex items-center ps-3"
          >
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBoxComponent;
