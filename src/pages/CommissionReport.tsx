import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, List, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const commissionData = [
  { name: "09Sarfraz90", turnover: 154000, percentage: 1.0, amount: 1540 },
  { name: "10Ikram90", turnover: 479340, percentage: 1.0, amount: 4793 },
  { name: "Neeraj685", turnover: 860020, percentage: 1.0, amount: 8600 },
];

export default function CommissionReport() {
  const [activeTab, setActiveTab] = useState("Commission Report");
  const [isLoaded, setIsLoaded] = useState(false);

  const total = commissionData.reduce(
    (acc, curr) => ({
      turnover: acc.turnover + curr.turnover,
      amount: acc.amount + curr.amount,
    }),
    { turnover: 0, amount: 0 }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoaded(true);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10 font-sans">
      <Header />
      <main className="p-4 max-w-5xl mx-auto space-y-4">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Filter Card */}
        <section className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4 text-slate-900 fill-slate-900" />
            Report Filter
          </div>
          <form onSubmit={handleSubmit} className="p-4 flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">From Date</label>
              <div className="flex gap-1">
                <input type="text" defaultValue="03/02/2026" className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
                <button type="button" className="p-2 bg-slate-100 border rounded"><Calendar className="w-4 h-4 text-slate-500" /></button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">To Date</label>
              <div className="flex gap-1">
                <input type="text" defaultValue="03/02/2026" className="border rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
                <button type="button" className="p-2 bg-slate-100 border rounded"><Calendar className="w-4 h-4 text-slate-500" /></button>
              </div>
            </div>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded text-sm font-bold shadow-sm">
              Submit
            </button>
          </form>
        </section>

        {/* Report Card */}
        <AnimatePresence>
          {isLoaded && (
            <motion.section 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded border shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
                <List className="w-4 h-4 text-slate-900" />
                Report
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b font-bold text-slate-800">
                      <th className="p-3 border-r">User Name</th>
                      <th className="p-3 border-r">Turnover</th>
                      <th className="p-3 border-r">Comm %</th>
                      <th className="p-3">Comm Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="p-3 border-r font-bold text-emerald-600">{row.name}</td>
                        <td className="p-3 border-r">{formatNumber(row.turnover)}</td>
                        <td className="p-3 border-r text-slate-500">{row.percentage.toFixed(1)}%</td>
                        <td className="p-3 font-bold text-emerald-600">{formatNumber(row.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-500 text-white font-bold">
                      <td className="p-3 border-r">Total</td>
                      <td className="p-3 border-r">{formatNumber(total.turnover)}</td>
                      <td className="p-3 border-r">-</td>
                      <td className="p-3">{formatNumber(total.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
