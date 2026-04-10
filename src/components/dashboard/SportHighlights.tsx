import React, { useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const soccerEvents = [
  { match: "Palestino v OHiggins / Match Odds", amount: 126776 },
  { match: "Real Salt Lake v Seattle Sounders / Match Odds", amount: 171160 },
];

const cricketEvents = [
  { match: "ICC Men's T20 World Cup / Winner", amount: 34576594, live: true },
  { match: "Australia W v India W / Match Odds", amount: 263814 },
  { match: "India v West Indies / Match Odds", amount: 4127269 },
  { match: "South Africa W v Pakistan W / Match Odds", amount: 2260 },
  { match: "Zimbabwe v South Africa / Match Odds", amount: 1685927 },
];

export function SportHighlights() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-emerald-500" />
          Sport Highlights
        </div>
        <button
          onClick={handleRefresh}
          className={cn(
            "text-emerald-600 hover:text-emerald-700 p-1.5 rounded-full transition-all",
            isRefreshing && "animate-spin"
          )}
          aria-label="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-0">
        {/* Soccer Section */}
        <div className="px-4 py-2 bg-emerald-50/50 border-y border-emerald-100/50 flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
          ⚽ Soccer
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-tighter text-[10px]">
                <th className="px-4 py-2 border-r border-slate-200">Match</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {soccerEvents.map((event, index) => (
                <tr 
                  key={index} 
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3 border-r border-slate-100 text-emerald-600 font-bold cursor-pointer hover:underline text-[13px]">
                    {event.match}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 text-[13px]">
                    {event.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cricket Section */}
        <div className="px-4 py-2 bg-emerald-50/50 border-y border-emerald-100/50 flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
          🏏 Cricket
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-tighter text-[10px]">
                <th className="px-4 py-2 border-r border-slate-200">Match</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {cricketEvents.map((event, index) => (
                <tr 
                  key={index} 
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3 border-r border-slate-100 text-emerald-600 font-bold cursor-pointer hover:underline text-[13px] flex items-center gap-2">
                    {event.match}
                    {event.live && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 text-[13px]">
                    {event.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
