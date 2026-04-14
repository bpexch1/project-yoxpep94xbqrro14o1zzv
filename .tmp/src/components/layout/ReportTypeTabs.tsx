import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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

  const handleTabClick = (tab: typeof tabs[0]) => {
    onTabChange(tab.id);
    navigate(tab.path);
  };

  const TabButton = ({ tab, className = "" }: { tab: typeof tabs[0]; className?: string }) => (
    <button
      onClick={() => handleTabClick(tab)}
      className={cn(
        "w-full text-[13px] py-2 px-3 rounded text-center border transition-colors whitespace-nowrap",
        activeTab === tab.id
          ? "bg-[#1a9e71] border-[#1a9e71] text-white font-bold"
          : "text-[#1a9e71] bg-white border-[#1a9e71] hover:bg-green-50",
        className
      )}
    >
      {tab.label}
    </button>
  );

  return (
    <div className="bg-white border border-[#d5d8dc] mb-3 rounded-none overflow-hidden">
      <div className="bg-[#f0f0f0] px-4 py-3 border-b border-[#d5d8dc] flex items-center gap-2">
        <Filter className="w-4 h-4 fill-[#333333] text-[#333333]" />
        <span className="font-bold text-[#2c3e50] text-sm">Report Type</span>
      </div>
      <div className="p-4 grid grid-cols-3 gap-2 lg:flex lg:flex-wrap lg:gap-2">
        {tabs.map((tab, i) => {
          const isMobileCenter = i === 6; // Commission Report
          return (
            <div key={tab.id} className={cn("lg:col-auto", isMobileCenter ? "col-start-2" : "")}>
              <TabButton tab={tab} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
