import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BettingMatchCardProps {
  match: any;
  onSelectBet: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
}

export function BettingMatchCard({ match, onSelectBet }: BettingMatchCardProps) {
  const isLive = match.status === 'live';

  return (
    <div className="bg-[#111827] border border-[#1e2d47] rounded-xl overflow-hidden hover:border-amber-500/30 transition-all group">
      {/* Card Header */}
      <div className="px-4 py-2 border-b border-[#1e2d47] bg-[#1a2235]/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              <span className="w-1 h-1 bg-white rounded-full" />
              LIVE
            </div>
          ) : (
            <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              UPCOMING
            </div>
          )}
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {match.category}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          {match.sport}
        </span>
      </div>

      {/* Match Info */}
      <div className="p-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-1">
            <span className="text-white font-bold text-base md:text-lg">{match.team1}</span>
            <span className="text-gray-500 text-xs font-black italic">VS</span>
            <span className="text-white font-bold text-base md:text-lg">{match.team2}</span>
          </div>
          <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">
            {match.match_time}
          </p>
        </div>

        {/* Odds Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Team 1 Odds */}
          <div className="space-y-2">
            <div className="text-[10px] text-gray-500 font-bold uppercase text-center truncate">{match.team1}</div>
            <div className="flex gap-2">
              <button
                onClick={() => onSelectBet(match, match.team1, 'back', match.back_odds)}
                className="flex-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 py-2 rounded-lg transition-all group/btn"
              >
                <div className="text-[10px] font-bold opacity-70 group-hover/btn:opacity-100 uppercase">Back</div>
                <div className="text-sm font-black">{match.back_odds?.toFixed(2)}</div>
              </button>
              <button
                onClick={() => onSelectBet(match, match.team1, 'lay', match.lay_odds)}
                className="flex-1 bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white border border-pink-500/20 py-2 rounded-lg transition-all group/btn"
              >
                <div className="text-[10px] font-bold opacity-70 group-hover/btn:opacity-100 uppercase">Lay</div>
                <div className="text-sm font-black">{match.lay_odds?.toFixed(2)}</div>
              </button>
            </div>
          </div>

          {/* Team 2 Odds */}
          <div className="space-y-2">
            <div className="text-[10px] text-gray-500 font-bold uppercase text-center truncate">{match.team2}</div>
            <div className="flex gap-2">
              <button
                onClick={() => onSelectBet(match, match.team2, 'back', match.back_odds2)}
                className="flex-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 py-2 rounded-lg transition-all group/btn"
              >
                <div className="text-[10px] font-bold opacity-70 group-hover/btn:opacity-100 uppercase">Back</div>
                <div className="text-sm font-black">{match.back_odds2?.toFixed(2)}</div>
              </button>
              <button
                onClick={() => onSelectBet(match, match.team2, 'lay', match.lay_odds2)}
                className="flex-1 bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white border border-pink-500/20 py-2 rounded-lg transition-all group/btn"
              >
                <div className="text-[10px] font-bold opacity-70 group-hover/btn:opacity-100 uppercase">Lay</div>
                <div className="text-sm font-black">{match.lay_odds2?.toFixed(2)}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
