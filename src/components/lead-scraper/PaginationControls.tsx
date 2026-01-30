"use client";

import React, { useState } from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls = ({ currentPage, totalPages, onPageChange }: PaginationControlsProps) => {
  const [jumpPage, setJumpPage] = useState("");

  const handleJump = () => {
    const parsed = Number(jumpPage);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
      setJumpPage("");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1a1a1a] border border-gray-800 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      <div className="text-sm text-gray-400">Page {currentPage} of {totalPages}</div>

      <div className="flex items-center gap-2">
        <input
          value={jumpPage}
          onChange={(event) => setJumpPage(event.target.value)}
          placeholder="Jump to page"
          className="w-full sm:w-32 rounded-lg bg-black border border-gray-700 text-white px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
        />
        <button
          type="button"
          onClick={handleJump}
          className="px-3 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 text-sm"
        >
          Go
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
