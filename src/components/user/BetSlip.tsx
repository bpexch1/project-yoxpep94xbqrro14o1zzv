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
  // Match the reference slip's direction colors: blue for Back, pink for Lay.
  const panelBg = isBack ? "#e9f6fc" : "#fce4e4";
  const borderColor = "#c6cbd0";
  const oddsControlBg = isBack ? "#e8f5fb" : "#fbe3e3";

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
      <div className="fixed inset-0 z-[110] reference-bet-slip fixed-slip flex items-start justify-center p-2 sm:p-4 overflow-y-auto select-none">
        {/* Dim backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Bet Slip Card Dialog */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", damping: 26, stiffness: 380 }}
          role="dialog" aria-modal="true" aria-label="Selection slip"
          className="relative w-full max-w-[500px] shadow-2xl z-10 border"
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
              <span className="text-[16px] font-normal text-[#292d30] w-20">
                ODDS
              </span>
              <div className="flex-1 flex items-stretch h-[34px] bg-white border border-[#c8d4e2] rounded-[4px] overflow-hidden">
                {/* [-] Button */}
                <button
                  type="button"
                  onClick={handleOddsDecrease}
                  className="w-10 text-[#142a45] font-bold text-base flex items-center justify-center transition-colors border-r"
                  style={{ backgroundColor: oddsControlBg, borderColor }}
                >
                  -
                </button>

                {/* Odds Value / Input */}
                <input
                  type="number"
                  aria-label="Odds"
                  step="0.01"
                  value={odds}
                  onChange={(e) => setOdds(parseFloat(e.target.value) || 0)}
                  className="flex-1 text-center font-bold text-[#142a45] text-[15px] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                {/* [+] Button */}
                <button
                  type="button"
                  onClick={handleOddsIncrease}
                  className="w-10 text-[#142a45] font-bold text-base flex items-center justify-center transition-colors border-l"
                  style={{ backgroundColor: oddsControlBg, borderColor }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Row 2: Amount */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[16px] font-normal text-[#292d30] w-20">
                Amount
              </span>
              <div className="flex-1">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder=""
                  aria-label="Amount"
                  className="w-full h-[34px] px-2.5 bg-white border border-[#ced4da] focus:border-[#7a9db5] rounded-[4px] font-medium text-[15px] text-[#343a40] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  className="h-[36px] bg-[#6c757d] hover:bg-[#4f647d] active:bg-[#43566d] text-white font-bold text-[16px] rounded-[4px] transition-colors shadow-sm"
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
                  className="h-[36px] bg-[#6c757d] hover:bg-[#4f647d] active:bg-[#43566d] text-white font-bold text-[16px] rounded-[4px] transition-colors shadow-sm"
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
