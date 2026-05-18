import React from "react";
import { Pagination } from "flowbite-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

const PaginationComponent: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}) => {
  if (totalPages <= 1) return null; // Không cần phân trang nếu chỉ có 1 trang

  return (
    <div className="flex flex-col items-center w-full mt-12 text-blue-600 font-semibold">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        showIcons
      />
      <p className="text-sm text-gray-600 mt-2">
        Trang {currentPage} / {totalPages} (Tổng cộng: {totalCount.toLocaleString()} tài liệu)
      </p>
    </div>
  );
};

export default PaginationComponent;
