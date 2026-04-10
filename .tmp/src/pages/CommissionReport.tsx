import { Layout } from "@/components/layout/Layout";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { useState } from "react";

export default function CommissionReport() {
  const [activeTab, setActiveTab] = useState("Commission Report");

  return (
    <Layout>
      <div className="p-3 max-w-5xl mx-auto space-y-3">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-800">
            Commission Details
          </div>
          <div className="p-8 text-center text-slate-400 text-sm">
            No commission records found for this period.
          </div>
        </div>
      </div>
    </Layout>
  );
}
