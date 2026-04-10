import { Layout } from "@/components/layout/Layout";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { useState } from "react";
import { Filter, CalendarDays, List, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const profitData = [
  { name: "09Sarfraz90", amount: 0 },
  { name: "10Ikram90", amount: 47934 },
  { name: "Neeraj685", amount: 86002 },
];

const lossData = [
  { name: "@Sajid86755", amount: -1020000 },
  { name: "NomanSA8592", amount: -73101 },
];

export default function DailyPL() {
  const [activeTab, setActiveTab] = useState("Daily PL");
  const [submitted, setSubmitted] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const totalProfit = profitData.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLoss = lossData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <Layout>
      <div className="p-3 max-w-5xl mx-auto space-y-3">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4" />
            Report Filter
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div className="space-y-2 max-w-md">
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className="border rounded px-2 py-1.5 text-sm flex-1 min-w-0" 
                  defaultValue="2026-03-02" 
                />
                <input 
                  type="time" 
                  className="border rounded px-2 py-1.5 text-sm w-24" 
                  defaultValue="12:00" 
                />
                <select className="border rounded px-2 py-1.5 text-sm w-20 bg-white">
                  <option>AM</option>
                  <option>PM</option>
                </select>
                <button type="button" className="p-1.5 border rounded text-slate-500 hover:bg-gray-50 flex-shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center text-slate-400 text-sm">-</div>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className="border rounded px-2 py-1.5 text-sm flex-1 min-w-0" 
                  defaultValue="2026-03-02" 
                />
                <input 
                  type="time" 
                  className="border rounded px-2 py-1.5 text-sm w-24" 
                  defaultValue="11:59" 
                />
                <select className="border rounded px-2 py-1.5 text-sm w-20 bg-white" defaultValue="PM">
                  <option>AM</option>
                  <option>PM</option>
                </select>
                <button type="button" className="p-1.5 border rounded text-slate-500 hover:bg-gray-50 flex-shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded text-sm font-medium transition-colors shadow-sm"
              >
                Submit
              </button>
            </div>
          </form>
        </div>

        <AnimatePresence>
          {submitted && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded border shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
                <List className="w-4 h-4" />
                Report
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs font-bold">
                      <th className="p-2 text-left border border-slate-200">
                        Name <span className="text-slate-400 ml-1">▲▼</span>
                      </th>
                      <th className="p-2 text-left border border-slate-200">
                        Amount <span className="text-slate-400 ml-1">▲▼</span>
                      </th>
                      <th className="p-2 text-left border border-slate-200">
                        Name <span className="text-slate-400 ml-1">▲▼</span>
                      </th>
                      <th className="p-2 text-left border border-slate-200">
                        Amount <span className="text-slate-400 ml-1">▲▼</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(profitData.length, lossData.length) }).map((_, i) => (
                      <motion.tr 
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-xs"
                      >
                        <td className="p-2 border border-slate-200 text-emerald-600 font-medium">
                          {profitData[i]?.name || ""}
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-700 font-semibold">
                          {profitData[i] ? profitData[i].amount.toLocaleString() : ""}
                        </td>
                        <td className="p-2 border border-slate-200 text-emerald-600 font-medium">
                          {lossData[i]?.name || ""}
                        </td>
                        <td className={`p-2 border border-slate-200 font-semibold ${lossData[i] ? "text-red-500" : ""}`}>
                          {lossData[i] ? lossData[i].amount.toLocaleString() : ""}
                        </td>
                      </motion.tr>
                    ))}
                    <tr className="text-xs font-bold text-white">
                      <td className="p-3 bg-emerald-500 border border-emerald-600">Total</td>
                      <td className="p-3 bg-emerald-500 border border-emerald-600">{totalProfit.toLocaleString()}</td>
                      <td className="p-3 bg-red-500 border border-red-600">Total</td>
                      <td className="p-3 bg-red-500 border border-red-600">{totalLoss.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
