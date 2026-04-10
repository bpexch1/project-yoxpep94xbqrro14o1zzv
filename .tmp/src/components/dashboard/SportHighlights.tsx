import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
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
    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-sm font-bold text-slate-700">
        <span>Sport Highlights</span>
        <button
          onClick={handleRefresh}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs px-3 py-1 rounded flex items-center gap-1.5 transition-all shadow-sm"
        >
          <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="p-0">
        {/* Soccer Section */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-b font-bold text-sm text-slate-800">
          <span>Soccer</span>
          <span className="text-right">Amount</span>
        </div>
        <div>
          {soccerEvents.map((event, index) => (
            <div 
              key={index} 
              className="flex items-start justify-between px-4 py-2 border-b last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="text-emerald-600 text-xs font-medium cursor-pointer hover:underline flex-1 pr-4">
                {event.match}
              </div>
              <div className="text-xs font-semibold text-slate-700 shrink-0 text-right">
                {event.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Cricket Section */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-y font-bold text-sm text-slate-800">
          <span>Cricket</span>
          <span className="text-right">Amount</span>
        </div>
        <div>
          {cricketEvents.map((event, index) => (
            <div 
              key={index} 
              className="flex items-start justify-between px-4 py-2 border-b last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="text-emerald-600 text-xs font-medium cursor-pointer hover:underline flex-1 pr-4 flex items-center">
                {event.match}
                {event.live && (
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1 shrink-0"></span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-700 shrink-0 text-right">
                {event.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
