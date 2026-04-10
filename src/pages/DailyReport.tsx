import { Layout } from "@/components/layout/Layout";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { useState } from "react";
import { Filter } from "lucide-react";

export default function DailyReport() {
  const [activeTab, setActiveTab] = useState("Daily Report");

  return (
    <Layout>
      <div className="p-3 max-w-5xl mx-auto space-y-3">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4" />
            Daily Report Filter
          </div>
          <div className="p-4 flex gap-3">
            <input type="date" className="border rounded px-3 py-2 text-sm flex-1" defaultValue="2024-03-20" />
            <button className="bg-emerald-600 text-white px-6 py-2 rounded text-sm font-medium">Search</button>
          </div>
        </div>

        <div className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-800">
            Daily Transaction Summary
          </div>
          <div className="p-4 text-center text-slate-400 text-sm">
            No data available for the selected date.
          </div>
        </div>
      </div>
    </Layout>
  );
}
