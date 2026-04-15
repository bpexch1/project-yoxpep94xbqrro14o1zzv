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

  const currentTabId = tabs.find(t => t.path === location.pathname)?.id || activeTab;

  const handleTabClick = (tab: typeof tabs[0]) => {
    onTabChange(tab.id);
    navigate(tab.path);
  };

  return (
    <div style={{ borderRadius: 10 }} className="bg-white mb-4 overflow-hidden shadow-sm border border-gray-200">
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <Filter className="w-4 h-4 fill-[#1a1a2e] text-[#1a1a2e]" />
        <span className="font-bold text-[#1a1a2e] text-[16px]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Report Type</span>
      </div>

      {/* Button grid */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab, i) => {
            const isActive = currentTabId === tab.id;
            const isCommissionReport = tab.id === "Commission Report";
            return (
              <div
                key={tab.id}
                className={cn(isCommissionReport ? "col-start-2" : "")}
              >
                <button
                  onClick={() => handleTabClick(tab)}
                  style={{ borderRadius: 8, height: 40, fontFamily: 'Inter, system-ui, sans-serif' }}
                  className={cn(
                    "w-full border-2 text-[13px] font-medium text-center transition-all flex items-center justify-center px-1",
                    isActive
                      ? "bg-[#16a34a] border-[#16a34a] text-white"
                      : "border-[#14b8a6] text-[#14b8a6] bg-white hover:bg-teal-50"
                  )}
                >
                  {tab.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
