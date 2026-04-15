import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { id: "Book Detail", label: "Book Detail", path: "/reports/book-detail" },
  { id: "Book Detail 2", label: "Book Detail 2", path: "/reports/book-detail-2" },
  { id: "Daily PL", label: "Daily PL", path: "/reports/daily-pl" },
  { id: "Daily Report", label: "Daily Report", path: "/reports/daily" },
  { id: "Final Sheet", label: "Final Sheet", path: "/reports/final-sheet" },
  { id: "Accounts", label: "Accounts", path: "/accounts" },
  { id: "Commission Report", label: "Commission Report", path: "/reports/commission" },
];

interface ReportTypeTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function ReportTypeTabs({ activeTab, onTabChange }: ReportTypeTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL
  const currentTabId = tabs.find(t => t.path === location.pathname)?.id || activeTab;

  const handleTabClick = (tab: typeof tabs[0]) => {
    onTabChange(tab.id);
    navigate(tab.path);
  };

  return (
    <div className="bg-white border border-[#d0d0d0] mb-4 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-[#d0d0d0] flex items-center gap-2">
        <Filter className="w-4 h-4 fill-[#2c3e50] text-[#2c3e50]" />
        <span className="font-bold text-[#2c3e50] text-base">Report Type</span>
      </div>
      <div className="p-4 grid grid-cols-3 gap-3 lg:flex lg:flex-wrap lg:gap-2">
        {tabs.map((tab, i) => {
          const isActive = currentTabId === tab.id;
          const isCommissionReport = tab.id === "Commission Report";
          return (
            <div
              key={tab.id}
              className={cn(
                "lg:col-auto",
                isCommissionReport ? "col-start-2" : ""
              )}
            >
              <button
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "w-full py-3 px-2 rounded-lg border-2 text-[14px] font-medium text-center transition-colors leading-tight min-h-[52px] flex items-center justify-center",
                  isActive
                    ? "bg-[#1a9e71] border-[#1a9e71] text-white font-semibold"
                    : "border-[#26bebe] text-[#26bebe] bg-white hover:bg-teal-50"
                )}
              >
                {tab.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
