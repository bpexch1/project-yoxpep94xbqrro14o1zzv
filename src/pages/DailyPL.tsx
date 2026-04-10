import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReportTypeTabs } from "@/components/layout/ReportTypeTabs";
import { Filter, List, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Filter state
  const [startDate, setStartDate] = useState("03/02/2026");
  const [startTime, setStartTime] = useState("12:00");
  const [startPeriod, setStartPeriod] = useState("AM");
  
  const [endDate, setEndDate] = useState("03/02/2026");
  const [endTime, setEndTime] = useState("11:59");
  const [endPeriod, setEndPeriod] = useState("PM");

  const totalProfit = profitData.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLoss = lossData.reduce((acc, curr) => acc + curr.amount, 0);

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

        {/* Report Filter Card */}
        <section className="bg-white rounded border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4 text-slate-900 fill-slate-900" />
            Report Filter
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-4">
              {/* Start Date Row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1 border border-slate-300 rounded overflow-hidden">
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-16 px-2 py-1.5 text-sm focus:outline-none text-center"
                  />
                  <select 
                    value={startPeriod}
                    onChange={(e) => setStartPeriod(e.target.value)}
                    className="bg-slate-50 border-l px-2 py-1.5 text-xs focus:outline-none font-semibold"
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
                <button type="button" className="p-2 bg-slate-100 rounded border hover:bg-slate-200">
                  <Calendar className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="flex justify-center">
                <span className="text-slate-400">-</span>
              </div>

              {/* End Date Row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1 border border-slate-300 rounded overflow-hidden">
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-16 px-2 py-1.5 text-sm focus:outline-none text-center"
                  />
                  <select 
                    value={endPeriod}
                    onChange={(e) => setEndPeriod(e.target.value)}
                    className="bg-slate-50 border-l px-2 py-1.5 text-xs focus:outline-none font-semibold"
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
                <button type="button" className="p-2 bg-slate-100 rounded border hover:bg-slate-200">
                  <Calendar className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-1.5 rounded text-sm font-bold transition-colors shadow-sm"
              >
                Submit
              </button>
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
              
              <div className="p-0 overflow-x-auto">
                <div className="min-w-[600px] flex">
                  {/* Profit Side */}
                  <div className="flex-1 border-r">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b font-bold text-slate-800">
                          <th className="p-2.5 border-r w-3/5">
                            <div className="flex items-center justify-between">
                              Name
                              <div className="flex flex-col scale-75">
                                <ChevronUp className="w-3 h-3 -mb-1 opacity-50" />
                                <ChevronDown className="w-3 h-3" />
                              </div>
                            </div>
                          </th>
                          <th className="p-2.5">
                            <div className="flex items-center justify-between">
                              Amount
                              <div className="flex flex-col scale-75">
                                <ChevronUp className="w-3 h-3 -mb-1" />
                                <ChevronDown className="w-3 h-3 opacity-50" />
                              </div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {profitData.map((row, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2.5 border-r font-medium text-emerald-600 cursor-pointer hover:underline">{row.name}</td>
                            <td className="p-2.5 font-bold text-slate-700">{formatNumber(row.amount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-500 text-white font-bold">
                          <td className="p-2.5 border-r">Total</td>
                          <td className="p-2.5">{formatNumber(totalProfit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Loss Side */}
                  <div className="flex-1">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b font-bold text-slate-800">
                          <th className="p-2.5 border-r w-3/5">
                            <div className="flex items-center justify-between">
                              Name
                              <div className="flex flex-col scale-75">
                                <ChevronUp className="w-3 h-3 -mb-1 opacity-50" />
                                <ChevronDown className="w-3 h-3" />
                              </div>
                            </div>
                          </th>
                          <th className="p-2.5">
                            <div className="flex items-center justify-between">
                              Amount
                              <div className="flex flex-col scale-75">
                                <ChevronUp className="w-3 h-3 -mb-1" />
                                <ChevronDown className="w-3 h-3 opacity-50" />
                              </div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lossData.map((row, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2.5 border-r font-medium text-emerald-600 cursor-pointer hover:underline">{row.name}</td>
                            <td className="p-2.5 font-bold text-red-500">{formatNumber(row.amount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-red-500 text-white font-bold">
                          <td className="p-2.5 border-r">Total</td>
                          <td className="p-2.5">{formatNumber(totalLoss)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
