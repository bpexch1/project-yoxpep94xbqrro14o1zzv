import { Layout } from "@/components/layout/Layout";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { useState } from "react";
import { Filter } from "lucide-react";

export default function BookDetail() {
  const [activeTab, setActiveTab] = useState("Book Detail");

  return (
    <Layout>
      <div className="p-3 max-w-5xl mx-auto space-y-3">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4" />
            Book Detail Filter
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="text" placeholder="Event Name" className="border rounded px-3 py-2 text-sm" />
            <input type="date" className="border rounded px-3 py-2 text-sm" />
            <select className="border rounded px-3 py-2 text-sm">
              <option>All Sports</option>
              <option>Cricket</option>
              <option>Tennis</option>
              <option>Soccer</option>
            </select>
            <button className="bg-emerald-600 text-white px-6 py-2 rounded text-sm font-medium">Filter</button>
          </div>
        </div>

        <div className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-800">
            Detailed Book Records
          </div>
          <div className="p-8 text-center text-slate-400 text-sm italic">
            Enter search criteria to view records.
          </div>
        </div>
      </div>
    </Layout>
  );
}
