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
  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => onTabChange(id)}
      className={cn(
        "px-4 py-1.5 rounded text-[11px] font-medium border transition-colors whitespace-nowrap",
        activeTab === id
          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
          : "border-teal-500 text-teal-600 bg-white hover:bg-teal-50"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded shadow-sm overflow-hidden mb-4 border border-gray-200">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2 text-[13px] font-bold text-gray-800">
        <Filter className="w-4 h-4 text-gray-900 fill-gray-900" />
        Report Type
      </div>
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <TabButton id="Book Detail" label="Book Detail" />
          <TabButton id="Book Detail 2" label="Book Detail 2" />
          <TabButton id="Daily PL" label="Daily PL" />
        </div>
        <div className="flex gap-2">
          <TabButton id="Daily Report" label="Daily Report" />
          <TabButton id="Final Sheet" label="Final Sheet" />
          <TabButton id="Accounts" label="Accounts" />
        </div>
        <div className="flex gap-2">
          <TabButton id="Commission Report" label="Commission Report" />
        </div>
      </div>
    </div>
  );
}
