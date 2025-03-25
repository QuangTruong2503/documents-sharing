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

  return (
    // <div className="flex justify-center items-center mt-12">
    //   <button
    //     onClick={handlePrevious}
    //     disabled={currentPage === 1}
    //     className="px-3 py-1 mx-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
    //   >
    //     Previous
    //   </button>
    //   {renderPageNumbers()}
    //   <button
    //     onClick={handleNext}
    //     disabled={currentPage === totalPages}
    //     className="px-3 py-1 mx-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
    //   >
    //     Next
    //   </button>
    //   <p className="ml-4 text-sm text-gray-600">
    //     Page {currentPage} of {totalPages} (Total: {totalCount} items)
    //   </p>
    // </div>
    <div className="flex flex-col overflow-x-auto justify-center items-center w-full mt-12 text-blue-600 font-semibold">
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      <p className="ml-4 text-sm text-gray-600 mt-2">
        Page {currentPage} of {totalPages} (Total: {totalCount} items)
      </p>
    </div>
  );
};

export default PaginationComponent;