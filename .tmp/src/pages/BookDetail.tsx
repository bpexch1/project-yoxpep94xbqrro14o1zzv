import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, List, Calendar, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const bookDetailData = [
  { event: "India vs Pakistan", market: "Match Odds", team1: "India", team2: "Pakistan", pl: 45000, commission: 450, final: 44550 },
  { event: "England vs Australia", market: "Match Odds", team1: "England", team2: "Australia", pl: -12000, commission: 0, final: -12000 },
];

export default function BookDetail() {
  const [activeTab, setActiveTab] = useState("Book Detail");
  const [isLoaded, setIsLoaded] = useState(false);
  const [sport, setSport] = useState("Cricket");

  const total = bookDetailData.reduce(
    (acc, curr) => ({
      pl: acc.pl + curr.pl,
      commission: acc.commission + curr.commission,
      final: acc.final + curr.final,
    }),
    { pl: 0, commission: 0, final: 0 }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">From Date</label>
                <div className="flex gap-1">
                  <input type="text" defaultValue="03/02/2026" className="flex-1 border rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" />
                  <button type="button" className="p-1.5 bg-slate-100 border rounded"><Calendar className="w-4 h-4 text-slate-500" /></button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">To Date</label>
                <div className="flex gap-1">
                  <input type="text" defaultValue="03/02/2026" className="flex-1 border rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" />
                  <button type="button" className="p-1.5 bg-slate-100 border rounded"><Calendar className="w-4 h-4 text-slate-500" /></button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Sport</label>
                <select 
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option>Cricket</option>
                  <option>Football</option>
                  <option>Tennis</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Market Name</label>
                <input type="text" placeholder="Search Market..." className="w-full border rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2 rounded text-sm font-bold shadow-sm transition-all">
                Submit
              </button>
            </div>
          </form>
        </section>

        {/* Report Card */}
        <AnimatePresence>
          {isLoaded && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded border shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
                <List className="w-4 h-4 text-slate-900" />
                Report
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-medium border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-600 font-bold uppercase tracking-tight">
                      <th className="p-3 border-r">Event Name</th>
                      <th className="p-3 border-r">Market</th>
                      <th className="p-3 border-r">Team 1</th>
                      <th className="p-3 border-r">Team 2</th>
                      <th className="p-3 border-r">Net P/L</th>
                      <th className="p-3 border-r">Comm.</th>
                      <th className="p-3">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookDetailData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="p-3 border-r text-emerald-600 font-bold cursor-pointer">{row.event}</td>
                        <td className="p-3 border-r">{row.market}</td>
                        <td className="p-3 border-r text-slate-500">{row.team1}</td>
                        <td className="p-3 border-r text-slate-500">{row.team2}</td>
                        <td className={cn("p-3 border-r font-bold", row.pl < 0 ? "text-red-500" : "text-emerald-600")}>{formatNumber(row.pl)}</td>
                        <td className="p-3 border-r text-slate-400">{formatNumber(row.commission)}</td>
                        <td className={cn("p-3 font-bold", row.final < 0 ? "text-red-500" : "text-emerald-600")}>{formatNumber(row.final)}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-500 text-white font-bold">
                      <td colSpan={4} className="p-3 border-r text-right">Totals:</td>
                      <td className="p-3 border-r">{formatNumber(total.pl)}</td>
                      <td className="p-3 border-r">{formatNumber(total.commission)}</td>
                      <td className="p-3">{formatNumber(total.final)}</td>
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
