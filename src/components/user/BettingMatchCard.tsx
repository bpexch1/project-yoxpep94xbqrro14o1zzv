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

  return (
    <button
      onClick={() => navigate(`/play/match/${match.id}`)}
      className="w-full bg-white border-b border-[#e0e8ef] flex items-center px-3 py-3 text-left hover:bg-[#f5f8fa] transition-colors active:bg-[#eef2f5]"
    >
      {/* Date / Time Column */}
      <div className="flex flex-col items-start justify-center min-w-[52px] shrink-0 mr-3">
        <span className="text-[10px] text-gray-500 font-medium leading-tight">{displayDate}</span>
        <span className="text-[11px] text-gray-700 font-semibold leading-tight">{displayTime}</span>
      </div>
      
      {/* Match Name Column */}
      <div className="flex-1 min-w-0 mr-3">
        <span className="text-[13px] font-bold text-[#1e3a5c] leading-snug line-clamp-2">
          {matchTitle}
        </span>
      </div>
      
      {/* Matched Amount + Info Icon Column */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[12px] text-gray-600 font-semibold text-right">
          {matchedAmount}
        </span>
        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center shrink-0">
          <span className="text-gray-500 text-[9px] font-black">i</span>
        </div>
      </div>
    </button>
  );
}
