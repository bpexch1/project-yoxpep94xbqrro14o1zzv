import { useState } from "react";
import { Filter, RefreshCw, Trophy } from "lucide-react";
import { motion } from "framer-motion";

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="bg-white rounded border shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between text-sm font-bold text-slate-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Sport Highlights
        </div>
        <motion.button
          onClick={handleRefresh}
          animate={{ rotate: isRefreshing ? 360 : 0 }}
          transition={{ duration: 1, ease: "linear" }}
          className="text-emerald-600 hover:text-emerald-700 p-1 rounded-full transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="p-0">
        {/* Soccer Section */}
        <div className="px-4 py-2 bg-emerald-50 border-y flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
          ⚽ Soccer
        </div>
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="overflow-x-auto"
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/50 border-b text-slate-500 font-semibold">
                <th className="p-3 border-r">Match</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {soccerEvents.map((event, index) => (
                <motion.tr 
                  key={index} 
                  variants={item}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3 border-r text-emerald-600 font-medium cursor-pointer hover:underline">
                    {event.match}
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-700">
                    {event.amount.toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Cricket Section */}
        <div className="px-4 py-2 bg-emerald-50 border-y flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
          🏏 Cricket
        </div>
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="overflow-x-auto"
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/50 border-b text-slate-500 font-semibold">
                <th className="p-3 border-r">Match</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {cricketEvents.map((event, index) => (
                <motion.tr 
                  key={index} 
                  variants={item}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3 border-r text-emerald-600 font-medium cursor-pointer hover:underline flex items-center gap-2">
                    {event.match}
                    {event.live && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-700">
                    {event.amount.toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
