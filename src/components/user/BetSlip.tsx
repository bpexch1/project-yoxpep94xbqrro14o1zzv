import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BetSlipProps {
  bet: { match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null;
  onClose: () => void;
  onSubmit: (stake: number) => void;
  isSubmitting: boolean;
}

export function BetSlip({ bet, onClose, onSubmit, isSubmitting }: BetSlipProps) {
  const [stake, setStake] = useState<string>("100");
  
  if (!bet) return null;

  const stakeNum = parseFloat(stake) || 0;
  const potentialWin = (stakeNum * bet.odds) - stakeNum;

  const quickStakes = [100, 500, 1000, 5000];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[60] p-4 bg-[#0a0f1e] md:relative md:p-0 md:bg-transparent"
      >
        <div className="max-w-md mx-auto bg-[#0d1526] border border-amber-500/30 rounded-t-2xl md:rounded-2xl shadow-2xl shadow-black overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-[#1a2235] flex items-center justify-between border-b border-[#1e2d47]">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black tracking-tighter">BET SLIP</span>
              <div className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                bet.betType === 'back' ? "bg-blue-500 text-white" : "bg-pink-500 text-white"
              )}>
                {bet.betType}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Bet Info */}
          <div className="p-4 space-y-4">
            <div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{bet.match.title}</div>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-lg">{bet.selection}</span>
                <span className="text-amber-400 font-black text-xl">@ {bet.odds.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-gray-500 text-[10px] font-black uppercase tracking-widest block">Stake (Rs.)</label>
              <Input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="bg-[#1a2235] border-[#2d3f5e] text-white text-lg font-bold h-12 focus:border-amber-500 focus:ring-amber-500"
                placeholder="0.00"
              />
              
              <div className="grid grid-cols-4 gap-2">
                {quickStakes.map((val) => (
                  <button
                    key={val}
                    onClick={() => setStake(val.toString())}
                    className="py-1.5 rounded bg-[#1a2235] hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-[#2d3f5e] hover:border-amber-500/50 text-[10px] font-black transition-all"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1e2d47] flex items-center justify-between">
              <span className="text-gray-500 text-xs font-bold uppercase">Potential Win</span>
              <span className="text-amber-400 font-black text-lg">Rs. {potentialWin.toFixed(2)}</span>
            </div>

            <Button
              onClick={() => onSubmit(stakeNum)}
              disabled={isSubmitting || stakeNum <= 0}
              className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-black font-black text-lg shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "PLACE BET NOW"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
