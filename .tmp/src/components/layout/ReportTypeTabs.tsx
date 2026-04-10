import React from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const tabs = [
  { id: "Book Detail", label: "Book Detail", path: "/reports/book-detail" },
  { id: "Book Detail 2", label: "Book Detail 2", path: "/reports/book-detail" },
  { id: "Daily PL", label: "Daily PL", path: "/reports/daily-pl" },
  { id: "Daily Report", label: "Daily Report", path: "/reports/daily" },
  { id: "Final Sheet", label: "Final Sheet", path: "/reports/final-sheet" },
  { id: "Accounts", label: "Accounts", path: "/accounts" },
  { id: "Current Position", label: "Current Position", path: "/reports/current-position" },
  { id: "Commission Report", label: "Commission Report", path: "/reports/commission" },
];

interface ReportTypeTabsProps {
  activeTab: string;
  onTabChange?: (id: string) => void;
}

export function ReportTypeTabs({ activeTab, onTabChange }: ReportTypeTabsProps) {
  const navigate = useNavigate();

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (onTabChange) onTabChange(tab.id);
    navigate(tab.path);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4">
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <Filter className="w-3.5 h-3.5 text-emerald-500" />
        Report Type
      </div>
      <div className="p-4 flex flex-wrap gap-2.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={cn(
              "px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-150",
              activeTab === tab.id
                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                : "bg-white text-emerald-600 border-emerald-500 hover:bg-emerald-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
