import { Info, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

interface BettingMatchCardProps {
  match: any;
  onSelectBet: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
}

export function BettingMatchCard({ match, onSelectBet }: BettingMatchCardProps) {
  const isLive = match.status === 'live';

  return (
    <div className="w-full bg-white border-b border-[#ccd9e5] flex flex-col md:flex-row md:items-center">
      {/* Left: InPlay/Time + Match Name */}
      <div className="flex-1 flex items-center px-3 py-2.5 min-w-0">
        <div className="flex flex-col items-center justify-center min-w-[56px] h-11 bg-[#16a085]/10 rounded border border-[#16a085]/20 mr-3">
          <span className="text-[#16a085] text-[9px] font-black uppercase leading-tight">InPlay</span>
          <span className="text-[#16a085] text-[10px] font-bold leading-tight">{match.match_time?.split(' ')?.[0] || '18:00'}</span>
        </div>
        
        <div className="flex flex-col min-w-0">
          <span className="text-[#1e3a5c] font-bold text-[13px] leading-tight truncate">
            {match.title || `${match.team1} v ${match.team2}`}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{match.category}</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{match.sport}</span>
          </div>
        </div>
      </div>

      {/* Right: Stats + Odds */}
      <div className="flex items-center bg-[#f0f5f9] md:bg-transparent">
        {/* Info Icons */}
        <div className="hidden lg:flex items-center gap-4 px-4 border-r border-[#ccd9e5]">
          <div className="flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-[#1e3a5c]/40" />
            <span className="text-[10px] font-black text-[#1e3a5c]/60">12,020,774</span>
          </div>
          <Info className="w-4 h-4 text-[#1e3a5c]/40" />
        </div>

        {/* Odds Buttons */}
        <div className="flex items-center h-full">
          {/* Team 1 Selection Group */}
          <div className="flex">
            <button
              onClick={() => onSelectBet(match, match.team1, 'back', match.back_odds)}
              className="w-[60px] md:w-[70px] h-[52px] bg-[#72bbef] flex flex-col items-center justify-center border-r border-white/20 transition-all hover:brightness-105 active:scale-95"
            >
              <span className="text-[#1e3a5c] font-black text-sm">{match.back_odds?.toFixed(2)}</span>
              <span className="text-[#1e3a5c]/60 text-[8px] font-bold uppercase">1.2k</span>
            </button>
            <button
              onClick={() => onSelectBet(match, match.team1, 'lay', match.lay_odds)}
              className="w-[60px] md:w-[70px] h-[52px] bg-[#faa9ba] flex flex-col items-center justify-center border-r border-[#ccd9e5] transition-all hover:brightness-105 active:scale-95"
            >
              <span className="text-[#1e3a5c] font-black text-sm">{match.lay_odds?.toFixed(2)}</span>
              <span className="text-[#1e3a5c]/60 text-[8px] font-bold uppercase">4.5k</span>
            </button>
          </div>

          {/* Team 2 Selection Group (Visual only for list view usually, but implementing buttons) */}
          <div className="hidden sm:flex">
             <button
              onClick={() => onSelectBet(match, match.team2, 'back', match.back_odds2)}
              className="w-[60px] md:w-[70px] h-[52px] bg-[#72bbef] flex flex-col items-center justify-center border-r border-white/20 transition-all hover:brightness-105 active:scale-95"
            >
              <span className="text-[#1e3a5c] font-black text-sm">{match.back_odds2?.toFixed(2)}</span>
              <span className="text-[#1e3a5c]/60 text-[8px] font-bold uppercase">800</span>
            </button>
            <button
              onClick={() => onSelectBet(match, match.team2, 'lay', match.lay_odds2)}
              className="w-[60px] md:w-[70px] h-[52px] bg-[#faa9ba] flex flex-col items-center justify-center transition-all hover:brightness-105 active:scale-95"
            >
              <span className="text-[#1e3a5c] font-black text-sm">{match.lay_odds2?.toFixed(2)}</span>
              <span className="text-[#1e3a5c]/60 text-[8px] font-bold uppercase">2.1k</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
