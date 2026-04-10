import { Layout } from "@/components/layout/Layout";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { SearchUsers } from "@/components/dashboard/SearchUsers";
import { useState } from "react";
import { Filter } from "lucide-react";

export default function DailyPL() {
  const [activeTab, setActiveTab] = useState("Daily PL");

  return (
    <Layout>
      <div className="p-3 max-w-5xl mx-auto space-y-3">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4" />
            Daily P/L Filter
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="date" className="border rounded px-3 py-2 text-sm" defaultValue="2024-03-20" />
            <input type="date" className="border rounded px-3 py-2 text-sm" defaultValue="2024-03-20" />
            <button className="bg-emerald-600 text-white px-6 py-2 rounded text-sm font-medium">Show</button>
          </div>
        </div>

        <div className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-800">
            Daily P/L Report
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-bold">
                  <th className="p-3 border-r whitespace-nowrap">Date</th>
                  <th className="p-3 border-r whitespace-nowrap">Total P/L</th>
                  <th className="p-3 border-r whitespace-nowrap">Commission</th>
                  <th className="p-3 whitespace-nowrap">Net P/L</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 border-r">2024-03-20</td>
                  <td className="p-3 border-r text-emerald-600 font-bold">125,400</td>
                  <td className="p-3 border-r">2,500</td>
                  <td className="p-3 text-emerald-600 font-bold">122,900</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
