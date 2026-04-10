import { Layout } from "@/components/layout/Layout";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { useState } from "react";

export default function FinalSheet() {
  const [activeTab, setActiveTab] = useState("Final Sheet");

  return (
    <Layout>
      <div className="p-3 max-w-5xl mx-auto space-y-3">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-800">
            Final Sheet Summary
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b text-slate-600 font-bold">
                  <th className="p-3 border-r">Account</th>
                  <th className="p-3 border-r text-right">Debit</th>
                  <th className="p-3 border-r text-right">Credit</th>
                  <th className="p-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b font-bold">
                  <td className="p-3 border-r">Total Summary</td>
                  <td className="p-3 border-r text-right text-red-500">0.00</td>
                  <td className="p-3 border-r text-right text-emerald-600">0.00</td>
                  <td className="p-3 text-right">0.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
