import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

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
      if (searchQuery.trim()) {
        navigate(`/search/${encodeURIComponent(searchQuery.trim())}`); // Mã hóa URL
        return;
      }
    };
  return (
    <div>
      {/* Search Box */}
      <form className="w-full" onSubmit={handleSearch}>
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            className="input-field rounded-xl py-2 pl-10 pr-20"
            placeholder="Tìm kiếm tài liệu..."
            required
            autoComplete="off"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] text-ink-secondary sm:inline">
            Enter
          </span>
          <button
            type="submit"
            className="sr-only"
          >
            Tìm kiếm
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBoxComponent;
