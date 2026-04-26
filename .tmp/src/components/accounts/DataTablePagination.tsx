import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  startRecord: number;
  endRecord: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showBottomControls?: boolean;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  startRecord,
  endRecord,
  onPageChange,
  onPageSizeChange,
  searchValue,
  onSearchChange,
  showBottomControls = true,
}: DataTablePaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)
  );

  const renderPageNumbers = () => {
    const result: (number | string)[] = [];
    let prev: number | null = null;

    for (const p of visiblePages) {
      if (prev !== null && p - prev > 1) {
        result.push("...");
      }
      result.push(p);
      prev = p;
    }
    return result;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#212529] font-medium">Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-[#ced4da] rounded px-2 py-1 text-[12px] bg-white outline-none focus:border-[#3DCCC8]"
          >
            {[25, 50, 100, 250].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-[#212529] font-medium">entries</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#212529] font-medium">Search:</span>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border border-[#ced4da] rounded px-3 py-1 text-[12px] bg-white outline-none focus:border-[#3DCCC8] w-48"
          />
        </div>
      </div>

      {/* Bottom Controls */}
      {showBottomControls && (
        <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div className="text-[12px] text-[#6c757d]">
            Showing {startRecord} to {endRecord} of {totalRecords} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="p-1 border border-[#dee2e6] rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronsLeft className="w-4 h-4 text-[#212529]" />
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 border border-[#dee2e6] rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#212529]" />
            </button>

            <div className="flex items-center gap-1 mx-2">
              {renderPageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === "number" && onPageChange(page)}
                  disabled={page === "..."}
                  className={cn(
                    "min-w-[30px] h-[30px] text-[12px] font-bold rounded border transition-all",
                    currentPage === page
                      ? "bg-[#3DCCC8] border-[#3DCCC8] text-white shadow-sm"
                      : page === "..."
                      ? "border-transparent text-[#6c757d]"
                      : "border-[#dee2e6] bg-white text-[#212529] hover:bg-gray-50"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 border border-[#dee2e6] rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#212529]" />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 border border-[#dee2e6] rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronsRight className="w-4 h-4 text-[#212529]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
