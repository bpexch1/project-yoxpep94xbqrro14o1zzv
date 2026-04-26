import React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  showTopControls?: boolean;
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
  showTopControls = true,
  showBottomControls = true,
}: DataTablePaginationProps) {
  
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-4 w-full text-[13px] text-[#212529]">
      {showTopControls && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 border border-[#ccc] rounded px-1 outline-none bg-white min-w-[60px]"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-bold">Search:</span>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 border border-[#ccc] rounded px-2 outline-none w-full sm:w-48"
              placeholder=""
            />
          </div>
        </div>
      )}

      {showBottomControls && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 px-1">
          <div className="text-[12px] font-bold text-[#6c757d]">
            Showing {totalRecords === 0 ? 0 : startRecord} to {endRecord} of {totalRecords} entries
          </div>
          
          <div className="flex items-center overflow-x-auto no-scrollbar">
            <div className="flex border border-[#ccc] rounded overflow-hidden">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "px-3 py-1.5 border-r border-[#ccc] hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:hover:bg-transparent",
                  "flex items-center gap-1"
                )}
              >
                Previous
              </button>
              
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "px-3 py-1.5 border-r border-[#ccc] last:border-r-0 transition-colors font-bold",
                    currentPage === page ? "bg-[#00ab81] text-white" : "hover:bg-gray-100 bg-white"
                  )}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalRecords === 0}
                className={cn(
                  "px-3 py-1.5 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:hover:bg-transparent",
                  "flex items-center gap-1"
                )}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
