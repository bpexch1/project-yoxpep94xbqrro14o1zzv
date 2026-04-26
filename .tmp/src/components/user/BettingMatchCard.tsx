import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BettingMatchCardProps {
  match: any;
  onSelectBet: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
}

export function BettingMatchCard({ match, onSelectBet }: BettingMatchCardProps) {
  const navigate = useNavigate();
  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const matchTime = match.match_time || "16:00";
  
  // Use "Today" for display if no date is provided
  const displayDate = "Today";
  const displayTime = matchTime.includes(' ') ? matchTime.split(' ')[0] : (matchTime.length > 5 ? matchTime.substring(0, 5) : matchTime);
  
  // Simulated matched amount for UI authenticity
  const matchedAmount = Math.floor(Math.random() * 5000000 + 50000).toLocaleString();
  const isLive = match.status === 'live';

  return (
    <div className="w-full bg-white border-b border-[#e0e8ef] flex items-center hover:bg-[#f5f8fa] transition-colors group">
      <button
        onClick={() => navigate(`/play/match/${match.id}`)}
        className="flex-1 flex items-center px-3 py-3 text-left"
      >
        {/* Date / Time Column */}
        <div className="flex flex-col items-start justify-center min-w-[52px] shrink-0 mr-3">
          <span className="text-[10px] text-gray-500 font-medium leading-tight">{displayDate}</span>
          <span className={cn(
            "text-[11px] font-semibold leading-tight",
            isLive ? "text-[#16a085]" : "text-gray-700"
          )}>
            {displayTime}
          </span>
        </div>
        
        {/* Match Name Column */}
        <div className="flex-1 min-w-0 mr-3 relative">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isLive && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a085] animate-pulse" />
                <span className="text-[9px] font-black text-[#16a085] uppercase tracking-tighter blink_me">
                  IN-PLAY
                </span>
              </div>
            )}
            {match.source === 'betfair' && (
              <span className="text-[8px] font-black bg-[#1e3a5c] text-white px-1 rounded-sm leading-tight shrink-0">BF</span>
            )}
          </div>
          <span className="text-[13px] font-bold text-[#1e3a5c] leading-snug line-clamp-2">
            {matchTitle}
          </span>
        </div>
        
        {/* Matched Amount Column (hidden on mobile when odds show) */}
        <div className="hidden sm:flex items-center gap-2 shrink-0 mr-2">
          <span className="text-[12px] text-gray-600 font-semibold text-right">
            {matchedAmount}
          </span>
        </div>
      </button>

      {/* Quick Odds Display */}
      <div className="flex items-center gap-1 pr-3 py-3 shrink-0">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelectBet(match, match.team1 || match.title, 'back', match.back_odds || 1.50);
          }}
          className="w-11 h-10 bg-[#72bbef] rounded flex items-center justify-center text-[13px] font-black text-[#1e3a5c] hover:brightness-90 transition-all active:scale-95 shadow-sm"
        >
          {(match.back_odds || 1.50).toFixed(2)}
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelectBet(match, match.team1 || match.title, 'lay', match.lay_odds || 1.52);
          }}
          className="w-11 h-10 bg-[#faa9ba] rounded flex items-center justify-center text-[13px] font-black text-[#1e3a5c] hover:brightness-90 transition-all active:scale-95 shadow-sm"
        >
          {(match.lay_odds || 1.52).toFixed(2)}
        </button>
        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center shrink-0 ml-1 cursor-help group-hover:border-gray-600 transition-colors">
          <span className="text-gray-500 text-[9px] font-black group-hover:text-gray-700">i</span>
        </div>
      </div>
    </div>
  );
}
