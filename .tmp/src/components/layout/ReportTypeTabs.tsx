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
        "px-3 py-2 rounded text-sm transition-colors border whitespace-nowrap min-w-[110px] text-center",
        activeTab === tab.id
          ? "bg-[#26A69A] border-[#26A69A] text-white font-medium"
          : "border-[#26A69A] text-[#26A69A] bg-white hover:bg-teal-50 font-normal"
      )}
    >
      {tab.label}
    </button>
  );

  return (
    <div className="bg-white rounded-none border border-[#E0E0E0] shadow-none overflow-hidden mb-2">
      <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E0E0E0] flex items-center gap-2">
        <Filter className="w-4 h-4 text-black" style={{ fill: 'black' }} />
        <span className="font-bold text-sm text-black">Report Type</span>
      </div>
      <div className="p-4 flex flex-col gap-2.5 items-center">
        <div className="flex gap-2 justify-center">
          <TabButton tab={tabs[0]} />
          <TabButton tab={tabs[1]} />
          <TabButton tab={tabs[2]} />
        </div>
        <div className="flex gap-2 justify-center">
          <TabButton tab={tabs[3]} />
          <TabButton tab={tabs[4]} />
          <TabButton tab={tabs[5]} />
        </div>
        <div className="flex gap-2 justify-center">
          <TabButton tab={tabs[6]} />
        </div>
      </div>
    </div>
  );
}
