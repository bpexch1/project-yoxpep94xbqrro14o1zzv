import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Filter } from "lucide-react";

interface ReportTypeTabsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const row1 = [
  { label: "Book Detail", path: "/reports/book-detail" },
  { label: "Book Detail 2", path: "/reports/book-detail-2" },
  { label: "Daily PL", path: "/reports/daily-pl" },
];

const row2 = [
  { label: "Daily Report", path: "/reports/daily" },
  { label: "Final Sheet", path: "/reports/final-sheet" },
  { label: "Accounts", path: "/accounts" },
];

const row3 = [
  { label: "Commission Report", path: "/reports/commission" },
];

export function ReportTypeTabs({ activeTab, onTabChange }: ReportTypeTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const renderButton = (tab: { label: string; path: string }) => {
    const isActive =
      location.pathname === tab.path ||
      (tab.path === "/accounts" && (location.pathname === "/accounts" || location.pathname.startsWith("/accounts/")));

    return (
      <button
        key={tab.label}
        onClick={() => {
          onTabChange?.(tab.label);
          navigate(tab.path);
        }}
        className={`px-3 py-1 text-[0.875rem] font-medium rounded-[0.2rem] border transition-all duration-150 select-none ${
          isActive
            ? "bg-[#00b98a] text-white border-[#00b98a] font-semibold shadow-sm"
            : "bg-white text-[#17a2b8] border-[#17a2b8] hover:bg-[#17a2b8] hover:text-white"
        }`}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          minWidth: "90px",
        }}
      >
        {tab.label}
      </button>
    );
  };

  return (
    <div className="bg-white border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden mb-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      {/* Header Bar - Light grey matching original website screenshot */}
      <div className="bg-[#f0f3f5] border-b border-[rgb(200,206,211)] px-3 py-2 flex items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 fill-[rgb(35,40,44)] text-[rgb(35,40,44)] shrink-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .71 1.71L14 11.42V19a1 1 0 0 1-.55.89l-4 2A1 1 0 0 1 8 21v-9.58L3.29 5.71A1 1 0 0 1 3 4z" />
        </svg>
        <span
          className="font-bold text-[0.875rem] text-[rgb(35,40,44)] tracking-tight"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          Report Type
        </span>
      </div>

      {/* Button Grid Area */}
      <div className="p-3 flex flex-col items-center justify-center gap-2">
        {/* Row 1 */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          {row1.map(renderButton)}
        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          {row2.map(renderButton)}
        </div>

        {/* Row 3 */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          {row3.map(renderButton)}
        </div>
      </div>
    </div>
  );
}
