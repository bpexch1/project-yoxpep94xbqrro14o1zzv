import { Filter } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const tabs = [
  { id: "Book Detail", label: "Book Detail", path: "/reports/book-detail" },
  { id: "Book Detail 2", label: "Book Detail 2", path: "/reports/book-detail" },
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

  return (
    <div className="bg-white rounded shadow-sm overflow-hidden mb-4 border">
      <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
        <Filter className="w-4 h-4 text-slate-900 fill-slate-900" />
        Report Type
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabClick(tab)}
            className={cn(
              "px-4 py-1.5 rounded text-xs font-bold border transition-all shadow-sm",
              activeTab === tab.id
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-emerald-600 border-emerald-500 hover:bg-emerald-50"
            )}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
