import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BetSlipProps {
  bet: { match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null;
  onClose: () => void;
  onSubmit: (stake: number) => void;
  isSubmitting: boolean;
}

export function BetSlip({ bet, onClose, onSubmit, isSubmitting }: BetSlipProps) {
  const [odds, setOdds] = useState(bet?.odds ?? 0);
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    if (bet?.odds != null && bet.odds > 0) {
      setOdds(bet.odds);
    }
  }, [bet?.odds, bet?.selection, bet?.betType]);

  useEffect(() => {
    setAmount("");
  }, [bet?.selection, bet?.betType]);

  if (!bet) return null;

  const isBack = bet.betType === 'back';
  const panelBg = isBack ? '#dbeafe' : '#fde8e8';
  const badgeBg = isBack ? '#72bbef' : '#faa9ba';

  const amountNum = parseFloat(amount) || 0;
  const profitLoss = amountNum > 0 ? ((amountNum * odds) - amountNum).toFixed(0) : 0;

  const absoluteStakes = [2000, 5000, 10000, 25000];
  const addStakes = [1000, 5000, 10000, 25000];

  const handleAbsoluteStake = (val: number) => setAmount(val.toString());
  const handleAddStake = (val: number) => setAmount(prev => (parseFloat(prev || "0") + val).toString());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        {/* Dim backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" 
          onClick={onClose} 
        />

        {/* Panel */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm rounded-xl shadow-2xl p-6 z-10 border border-white/20"
          style={{ backgroundColor: panelBg }}
        >
          {/* Team name */}
          <h2 className="text-center font-black text-[18px] text-[#1e3a5c] mb-2 uppercase tracking-tight">
            {bet.selection}
          </h2>

          {/* Bet Type Badge */}
          <div className="flex justify-center mb-6">
            <span 
              className="px-4 py-1 rounded-full text-[11px] font-black text-white uppercase tracking-widest shadow-sm"
              style={{ backgroundColor: badgeBg }}
            >
              {bet.betType}
            </span>
          </div>

          {/* ODDS row */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[13px] font-black text-[#1e3a5c]/70 w-16 tracking-wider">ODDS</span>
            <div className="flex items-center flex-1 bg-white rounded-md border border-gray-200 p-0.5 shadow-sm">
              <button
                onClick={() => setOdds(prev => Math.max(1.01, parseFloat((prev - 0.01).toFixed(2))))}
                className="w-10 h-10 bg-[#5a6478] hover:bg-[#4a5468] text-white font-black text-[20px] rounded flex items-center justify-center transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={odds}
                onChange={e => setOdds(parseFloat(e.target.value) || 0)}
                className="flex-1 h-10 text-center text-[17px] font-black text-[#1e3a5c] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setOdds(prev => parseFloat((prev + 0.01).toFixed(2)))}
                className="w-10 h-10 bg-[#5a6478] hover:bg-[#4a5468] text-white font-black text-[20px] rounded flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Amount row */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[13px] font-black text-[#1e3a5c]/70 w-16 tracking-wider">AMOUNT</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
              placeholder="0"
              className="flex-1 h-11 px-4 text-[17px] font-black text-[#1e3a5c] border-2 border-blue-400 bg-white focus:outline-none rounded-md shadow-[0_0_10px_rgba(96,165,250,0.1)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Quick stake row 1 — absolute values */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {absoluteStakes.map((val, i) => (
              <button
                key={i}
                onClick={() => handleAbsoluteStake(val)}
                className="h-10 bg-[#4a5568] hover:bg-[#3d4756] text-white font-black text-[12px] rounded-md transition-all active:scale-95 shadow-sm"
              >
                {val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Quick stake row 2 — add values */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {addStakes.map((val, i) => (
              <button
                key={i}
                onClick={() => handleAddStake(val)}
                className="h-10 bg-[#4a5568] hover:bg-[#3d4756] text-white font-black text-[12px] rounded-md transition-all active:scale-95 shadow-sm"
              >
                +{val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Bottom row: Close | Submit | P&L */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-24 h-11 bg-[#e53e3e] hover:bg-[#c53030] text-white font-black text-[14px] rounded-md transition-colors shadow-lg shadow-red-500/10"
            >
              CLOSE
            </button>
            <button
              onClick={() => onSubmit(amountNum)}
              disabled={isSubmitting || amountNum <= 0}
              className="flex-1 h-11 bg-[#16a085] hover:bg-[#148a72] text-white font-black text-[14px] rounded-md transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/10"
            >
              {isSubmitting ? "PROCESSING..." : "SUBMIT"}
            </button>
            <div className="flex flex-col items-end min-w-[70px]">
              <span className="text-[14px] font-black text-[#16a085]">
                {amountNum > 0 ? profitLoss : "0"}
              </span>
              <span className="text-[14px] font-black text-red-500">
                {amountNum > 0 ? `-${amountNum}` : "-0"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
