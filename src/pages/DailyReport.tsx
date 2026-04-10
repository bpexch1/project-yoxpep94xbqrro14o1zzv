import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, List, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const dailyReportData = [
  { name: "09Sarfraz90", pl: 15400, commission: 154, netPl: 15246 },
  { name: "10Ikram90", pl: 47934, commission: 479, netPl: 47455 },
  { name: "Neeraj685", pl: 86002, commission: 860, netPl: 85142 },
  { name: "@Sajid86755", pl: -1020000, commission: 0, netPl: -1020000 },
];

export default function DailyReport() {
  const [activeTab, setActiveTab] = useState("Daily Report");
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [startDate, setStartDate] = useState("03/02/2026");
  const [endDate, setEndDate] = useState("03/02/2026");

  const total = dailyReportData.reduce(
    (acc, curr) => ({
      pl: acc.pl + curr.pl,
      commission: acc.commission + curr.commission,
      netPl: acc.netPl + curr.netPl,
    }),
    { pl: 0, commission: 0, netPl: 0 }
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
      <main className="p-4 max-w-6xl mx-auto space-y-4">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Filter Card */}
        <section className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4 text-slate-900 fill-slate-900" />
            Report Filter
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">From Date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button type="button" className="p-2 bg-slate-100 rounded border hover:bg-slate-200">
                    <Calendar className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">To Date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button type="button" className="p-2 bg-slate-100 rounded border hover:bg-slate-200">
                    <Calendar className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex justify-end items-end h-full mt-5">
                <button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded text-sm font-bold transition-colors shadow-sm"
                >
                  Submit
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Report Card */}
        <AnimatePresence>
          {isLoaded && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
                      <th className="p-3 border-r">P/L</th>
                      <th className="p-3 border-r">Commission</th>
                      <th className="p-3">Net P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReportData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="p-3 border-r font-medium text-emerald-600 cursor-pointer">{row.name}</td>
                        <td className={cn("p-3 border-r font-bold", row.pl < 0 ? "text-red-500" : "text-emerald-600")}>
                          {formatNumber(row.pl)}
                        </td>
                        <td className="p-3 border-r text-slate-600 font-semibold">{formatNumber(row.commission)}</td>
                        <td className={cn("p-3 font-bold", row.netPl < 0 ? "text-red-500" : "text-emerald-600")}>
                          {formatNumber(row.netPl)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-500 text-white font-bold">
                      <td className="p-3 border-r">Total</td>
                      <td className="p-3 border-r">{formatNumber(total.pl)}</td>
                      <td className="p-3 border-r">{formatNumber(total.commission)}</td>
                      <td className="p-3">{formatNumber(total.netPl)}</td>
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
