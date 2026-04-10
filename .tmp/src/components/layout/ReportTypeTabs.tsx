import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "Book Detail", label: "Book Detail" },
  { id: "Book Detail 2", label: "Book Detail 2" },
  { id: "Daily PL", label: "Daily PL" },
  { id: "Daily Report", label: "Daily Report" },
  { id: "Final Sheet", label: "Final Sheet" },
  { id: "Accounts", label: "Accounts" },
  { id: "Commission Report", label: "Commission Report" },
];

interface ReportTypeTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function ReportTypeTabs({ activeTab, onTabChange }: ReportTypeTabsProps) {
  return (
    <div className="bg-white rounded shadow-sm overflow-hidden mb-4">
      <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Filter className="w-4 h-4" />
        Report Type
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded text-xs font-medium border transition-all active:scale-95",
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
