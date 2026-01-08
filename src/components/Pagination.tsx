"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-800">
      <div className="text-sm text-gray-400 text-center sm:text-left">
        Showing <span className="font-medium text-white">{startItem}-{endItem}</span> of{" "}
        <span className="font-medium text-white">{totalItems}</span> leads
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FF6B35]/10 hover:border-[#FF6B35] transition-colors flex items-center gap-1 min-h-[44px]"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-700 rounded-lg min-h-[44px]">
          <span className="text-white font-medium">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FF6B35]/10 hover:border-[#FF6B35] transition-colors flex items-center gap-1 min-h-[44px]"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {onItemsPerPageChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-400 whitespace-nowrap">
            Per page:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none min-h-[44px]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
