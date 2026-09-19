import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface BetSlipProps {
  bet?: { match?: any; selection: string; betType: "back" | "lay"; odds: number; stake?: number } | null;
  activeBet?: { match?: any; selection: string; betType: "back" | "lay"; odds: number; stake?: number } | null;
  onClose: () => void;
  onSubmit: (stake: number, odds?: number) => void;
  isSubmitting?: boolean;
  balance?: number;
}

export function BetSlip({
  bet,
  activeBet,
  onClose,
  onSubmit,
  isSubmitting = false,
  balance,
}: BetSlipProps) {
  const currentBet = bet || activeBet;

  const [odds, setOdds] = useState<number>(currentBet?.odds ?? 1.5);
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    if (currentBet?.odds != null && currentBet.odds > 0) {
      setOdds(currentBet.odds);
    }
  }, [currentBet?.odds, currentBet?.selection, currentBet?.betType]);

  useEffect(() => {
    setAmount("");
  }, [currentBet?.selection, currentBet?.betType]);

  if (!currentBet) return null;

  const isBack = currentBet.betType === "back";
  // Screenshot 1: Back bet is soft light blue (#f0f6fb)
  // Screenshot 2: Lay bet is soft pink/peach (#fceeee)
  const panelBg = isBack ? "#eaf2f8" : "#fceeee";
  const borderColor = isBack ? "#c8dbea" : "#fad2d2";

  const amountNum = parseFloat(amount) || 0;
  const currentOdds = typeof odds === "number" ? odds : parseFloat(String(odds)) || 1;

  // Calculate profit and liability for Back and Lay bets
  let profitText = "0";
  let liabilityText = "-0";

  if (amountNum > 0) {
    if (isBack) {
      // BACK bet: Profit = Stake * (Odds - 1), Liability = Stake
      const profit = Math.round(amountNum * (currentOdds - 1));
      profitText = `${profit.toLocaleString("en-IN")}`;
      liabilityText = `-${amountNum.toLocaleString("en-IN")}`;
    } else {
      // LAY bet: Profit = Stake, Liability = Stake * (Odds - 1)
      const liability = Math.round(amountNum * (currentOdds - 1));
      profitText = `${amountNum.toLocaleString("en-IN")}`;
      liabilityText = `-${liability.toLocaleString("en-IN")}`;
    }
  }

  const absoluteStakes = [2000, 5000, 10000, 25000];
  const addStakes = [1000, 5000, 10000, 25000];

  const handleAbsoluteStake = (val: number) => {
    setAmount(val.toString());
  };

  const handleAddStake = (val: number) => {
    setAmount((prev) => {
      const current = parseFloat(prev || "0") || 0;
      return (current + val).toString();
    });
  };

  const handleOddsDecrease = () => {
    setOdds((prev) => {
      const p = typeof prev === "number" ? prev : parseFloat(String(prev)) || 1.01;
      const step = p > 2 ? 0.1 : 0.01;
      const next = Math.max(1.01, parseFloat((p - step).toFixed(2)));
      return next;
    });
  };

  const handleOddsIncrease = () => {
    setOdds((prev) => {
      const p = typeof prev === "number" ? prev : parseFloat(String(prev)) || 1.01;
      const step = p >= 2 ? 0.1 : 0.01;
      const next = parseFloat((p + step).toFixed(2));
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum <= 0 || isSubmitting) return;
    onSubmit(amountNum, currentOdds);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 select-none">
        {/* Dim backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-[1.5px]"
          onClick={onClose}
        />

        {/* Bet Slip Card Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", damping: 26, stiffness: 380 }}
          className="relative w-full max-w-[340px] shadow-2xl z-10 border"
          style={{
            backgroundColor: panelBg,
            borderColor: borderColor,
            borderRadius: 6,
            padding: "16px 14px 16px 14px",
            fontFamily:
              '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          }}
        >
          {/* Team / Selection Name */}
          <div className="text-center mb-3">
            <h2 className="text-[17px] font-bold text-[#142a45] leading-tight tracking-wide">
              {currentBet.selection}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {/* Row 1: ODDS */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-[#142a45] w-16">
                ODDS
              </span>
              <div className="flex-1 flex items-stretch h-[34px] bg-white border border-[#c8d4e2] rounded-[4px] overflow-hidden">
                {/* [-] Button */}
                <button
                  type="button"
                  onClick={handleOddsDecrease}
                  className="w-10 bg-[#eaeff5] hover:bg-[#d8e2ee] active:bg-[#c9d7e7] text-[#142a45] font-bold text-base flex items-center justify-center transition-colors border-r border-[#c8d4e2]"
                >
                  -
                </button>

                {/* Odds Value / Input */}
                <input
                  type="number"
                  step="0.01"
                  value={odds}
                  onChange={(e) => setOdds(parseFloat(e.target.value) || 0)}
                  className="flex-1 text-center font-bold text-[#142a45] text-[15px] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                {/* [+] Button */}
                <button
                  type="button"
                  onClick={handleOddsIncrease}
                  className="w-10 bg-[#eaeff5] hover:bg-[#d8e2ee] active:bg-[#c9d7e7] text-[#142a45] font-bold text-base flex items-center justify-center transition-colors border-l border-[#c8d4e2]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Row 2: Amount */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-[#142a45] w-16">
                Amount
              </span>
              <div className="flex-1">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder=""
                  autoFocus
                  className="w-full h-[34px] px-2.5 bg-white border-2 border-[#5c9bd5] focus:border-[#2b6cb0] rounded-[4px] font-bold text-[15px] text-[#142a45] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                />
              </div>
            </div>

            {/* Row 3: Preset Stake Buttons */}
            <div className="grid grid-cols-4 gap-1.5 mt-0.5">
              {absoluteStakes.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAbsoluteStake(val)}
                  className="h-[32px] bg-[#5c738e] hover:bg-[#4f647d] active:bg-[#43566d] text-white font-bold text-[12.5px] rounded-[4px] transition-colors shadow-sm"
                >
                  {val.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            {/* Row 4: Incremental Stake Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {addStakes.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddStake(val)}
                  className="h-[32px] bg-[#5c738e] hover:bg-[#4f647d] active:bg-[#43566d] text-white font-bold text-[12.5px] rounded-[4px] transition-colors shadow-sm"
                >
                  +{val.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            {/* Row 5: Close / Submit / Result Text */}
            <div className="flex items-center gap-2 mt-1 pt-1">
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="h-[34px] px-4 bg-[#e53935] hover:bg-[#d32f2f] active:bg-[#b71c1c] text-white font-bold text-[13px] rounded-[4px] transition-colors shadow-sm"
              >
                Close
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || amountNum <= 0}
                className="h-[34px] px-4 bg-[#00a676] hover:bg-[#008f64] active:bg-[#007853] text-white font-bold text-[13px] rounded-[4px] transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>

              {/* Profit / Liability Display (e.g., 0 / -0 or 7000 / -1000) */}
              <div className="ml-1 text-[13px] font-bold text-[#142a45]">
                {profitText} / {liabilityText}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
