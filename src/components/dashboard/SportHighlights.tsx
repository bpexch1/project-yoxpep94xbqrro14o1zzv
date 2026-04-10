import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const soccerMatches = [
  { id: 1, name: "Palestino v OHiggins / Match Odds", amount: 126776 },
  { id: 2, name: "Real Salt Lake v Seattle Sounders / Match Odds", amount: 171160 },
];

const cricketMatches = [
  { id: 1, name: "ICC Men's T20 World Cup / Winner", amount: 34576594, live: true },
  { id: 2, name: "Australia W v India W / Match Odds", amount: 263814 },
  { id: 3, name: "India v West Indies / Match Odds", amount: 4127269 },
  { id: 4, name: "South Africa W v Pakistan W / Match Odds", amount: 2260 },
  { id: 5, name: "Zimbabwe v South Africa / Match Odds", amount: 1685927 },
];

export function SportHighlights() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="bg-white rounded border shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700">Sport Highlights</span>
        <button 
          onClick={handleRefresh}
          className="text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.5, ease: "linear" }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
          Refresh
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Soccer Section */}
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
            <span>⚽</span> Soccer
            <div className="flex-1 h-[1px] bg-slate-100" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b">
                  <th className="text-left py-2 px-2">Match</th>
                  <th className="text-right py-2 px-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {soccerMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 text-emerald-600 hover:underline cursor-pointer">
                      {match.name}
                    </td>
                    <td className="py-2 px-2 text-right font-medium text-slate-700">
                      {match.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cricket Section */}
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
            <span>🏏</span> Cricket
            <div className="flex-1 h-[1px] bg-slate-100" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b">
                  <th className="text-left py-2 px-2">Match</th>
                  <th className="text-right py-2 px-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cricketMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 flex items-center gap-2">
                      <span className="text-emerald-600 hover:underline cursor-pointer">
                        {match.name}
                      </span>
                      {match.live && (
                        <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-[10px] text-green-600 font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Live
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right font-medium text-slate-700">
                      {match.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
