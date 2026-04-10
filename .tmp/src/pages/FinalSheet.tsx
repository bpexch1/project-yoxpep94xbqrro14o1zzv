import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, List, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const finalSheetData = [
  { name: "09Sarfraz90", given: 100000, used: 85000, cashIn: 5000, cashOut: 0, pl: 15400, net: 20400 },
  { name: "10Ikram90", given: 500000, used: 452066, cashIn: 0, cashOut: 10000, pl: 47934, net: 37934 },
  { name: "Neeraj685", given: 250000, used: 163998, cashIn: 0, cashOut: 0, pl: 86002, net: 86002 },
];

export default function FinalSheet() {
  const [activeTab, setActiveTab] = useState("Final Sheet");
  const [isLoaded, setIsLoaded] = useState(false);

  const total = finalSheetData.reduce(
    (acc, curr) => ({
      given: acc.given + curr.given,
      used: acc.used + curr.used,
      cashIn: acc.cashIn + curr.cashIn,
      cashOut: acc.cashOut + curr.cashOut,
      pl: acc.pl + curr.pl,
      net: acc.net + curr.net,
    }),
    { given: 0, used: 0, cashIn: 0, cashOut: 0, pl: 0, net: 0 }
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
      <main className="p-4 max-w-7xl mx-auto space-y-4">
        <ReportTypeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Filter Card */}
        <section className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4 text-slate-900 fill-slate-900" />
            Report Filter
          </div>
          <form onSubmit={handleSubmit} className="p-4 flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
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
              initial={{ opacity: 0, y: 5 }}
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
                      <th className="p-3 border-r">Credit Given</th>
                      <th className="p-3 border-r">Credit Used</th>
                      <th className="p-3 border-r text-emerald-600">Cash In</th>
                      <th className="p-3 border-r text-red-500">Cash Out</th>
                      <th className="p-3 border-r">P/L</th>
                      <th className="p-3">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalSheetData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="p-3 border-r font-bold text-emerald-600">{row.name}</td>
                        <td className="p-3 border-r">{formatNumber(row.given)}</td>
                        <td className="p-3 border-r">{formatNumber(row.used)}</td>
                        <td className="p-3 border-r text-emerald-600">{formatNumber(row.cashIn)}</td>
                        <td className="p-3 border-r text-red-500">{formatNumber(row.cashOut)}</td>
                        <td className={cn("p-3 border-r font-bold", row.pl < 0 ? "text-red-500" : "text-emerald-600")}>{formatNumber(row.pl)}</td>
                        <td className={cn("p-3 font-bold", row.net < 0 ? "text-red-500" : "text-emerald-600")}>{formatNumber(row.net)}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-500 text-white font-bold">
                      <td className="p-3 border-r">Total</td>
                      <td className="p-3 border-r">{formatNumber(total.given)}</td>
                      <td className="p-3 border-r">{formatNumber(total.used)}</td>
                      <td className="p-3 border-r">{formatNumber(total.cashIn)}</td>
                      <td className="p-3 border-r">{formatNumber(total.cashOut)}</td>
                      <td className="p-3 border-r">{formatNumber(total.pl)}</td>
                      <td className="p-3">{formatNumber(total.net)}</td>
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
