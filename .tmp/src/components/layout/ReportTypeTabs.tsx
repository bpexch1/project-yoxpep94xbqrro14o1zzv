import { Filter } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const tabs = [
  { id: "Book Detail",       label: "Book Detail",       path: "/reports/book-detail" },
  { id: "Book Detail 2",     label: "Book Detail 2",     path: "/reports/book-detail-2" },
  { id: "Daily PL",          label: "Daily PL",          path: "/reports/daily-pl" },
  { id: "Daily Report",      label: "Daily Report",      path: "/reports/daily" },
  { id: "Final Sheet",       label: "Final Sheet",       path: "/reports/final-sheet" },
  { id: "Accounts",          label: "Accounts",          path: "/accounts" },
  { id: "Commission Report", label: "Commission Report", path: "/reports/commission" },
];

interface ReportTypeTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function ReportTypeTabs({ activeTab, onTabChange }: ReportTypeTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const currentId = tabs.find(t => t.path === location.pathname)?.id ?? activeTab;
  const go = (tab: typeof tabs[0]) => { onTabChange(tab.id); navigate(tab.path); };

  const arialFont = "Arial, Helvetica, sans-serif";

  return (
    <div className={cn(
      "bg-white border border-[#ccc] mb-2 overflow-hidden",
      isMobile ? "rounded-lg" : "rounded-none"
    )} style={{ fontFamily: arialFont }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-[14px] py-2 bg-[#e8e8e8] border-b border-[#ccc]">
        <Filter className="w-3.5 h-3.5 text-[#333] shrink-0" />
        <span className="font-bold text-[14px] text-[#333]">Report Type</span>
      </div>

      {/* Buttons row */}
      <div className="flex flex-wrap gap-1.5 p-3 sm:px-[14px] sm:pt-[10px] sm:pb-[12px]">
        {tabs.map((tab) => {
          const isActive = currentId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => go(tab)}
              className={cn(
                "h-8 px-3.5 border border-[#12b886] rounded-[4px] text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap flex items-center justify-center",
                isActive ? "bg-[#12b886] text-white" : "bg-white text-[#12b886]"
              )}
              style={{ fontFamily: arialFont }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
