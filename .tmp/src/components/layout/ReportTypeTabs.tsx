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

  const TabButton = ({ tab }: { tab: typeof tabs[0] }) => (
    <button
      onClick={() => handleTabClick(tab)}
      className={cn(
        "px-4 py-2 rounded text-xs transition-colors border whitespace-nowrap min-w-[100px] text-center",
        activeTab === tab.id
          ? "bg-[#26A69A] border-[#26A69A] text-white font-bold"
          : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50 font-medium"
      )}
    >
      {tab.label}
    </button>
  );

  return (
    <div className="bg-white rounded-none border-b border-gray-200 shadow-sm overflow-hidden mb-4">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-gray-500" />
        <span className="font-bold text-[11px] text-gray-600 uppercase tracking-tight">Report Type</span>
      </div>
      <div className="p-3 overflow-x-auto custom-scrollbar">
        <div className="flex gap-2 min-w-max lg:flex-wrap lg:min-w-0 lg:justify-start">
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>
      </div>
    </div>
  );
}
