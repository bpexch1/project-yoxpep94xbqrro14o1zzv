import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getClientSession } from "@/hooks/useClientAuth";
import { Trophy, Search, Play, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UserDashboard() {
  const navigate = useNavigate();
  const session = getClientSession();
  const [selectedSport, setSelectedSport] = useState<"all" | "cricket" | "soccer" | "tennis">("all");

  // 1. MongoDB prioritized data fetch
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["user-matches-db"],
    queryFn: async () => {
      // Yahan aapka MongoDB fetch logic hai
      // Jo manual matches ko 'source: "db"' mark karke deta hai
      const response = await fetch('/api/matches/live'); 
      const data = await response.json();
      
      // Sorting Logic: MongoDB (db) matches always on top
      return data.sort((a: any, b: any) => (a.source === 'db' ? -1 : 1));
    }
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-200 font-sans pb-20">
      {/* Header with Balance */}
      <header className="bg-[#161b26] border-b border-gray-800 p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="font-black text-lg text-yellow-500">BETPRO<span className="text-white">EXCH</span></span>
          </div>
          <div className="bg-[#1c2230] px-3 py-1 rounded border border-gray-800 text-xs font-bold text-[#00b181]">
            PKR {session?.balance?.toLocaleString() || "0.00"}
          </div>
        </div>
      </header>

      {/* Sport Tabs */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {["all", "cricket", "soccer", "tennis"].map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSport(s as any)}
            className={cn("px-4 py-2 rounded text-[10px] font-black uppercase", 
              selectedSport === s ? "bg-yellow-500 text-black" : "bg-[#161b26] text-gray-400")}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Matches List */}
      <div className="px-4 space-y-3">
        {isLoading ? <div className="text-center text-xs text-gray-500">Loading...</div> : 
         matches.filter((m: any) => selectedSport === "all" || m.sport_type === selectedSport).map((match: any) => (
          <div key={match.id} className="bg-[#161b26] border border-gray-800 rounded-lg p-3" onClick={() => navigate(`/play/match/${match.id}`)}>
            <div className="flex justify-between mb-2">
              <span className="text-[9px] font-black uppercase text-gray-500 flex items-center gap-1">
                {match.is_live && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                {match.sport_type}
              </span>
              {match.source === 'db' && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 rounded font-black">ADMIN CONTROLLED</span>}
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-bold">{match.team_a}</div>
                <div className="text-sm font-bold text-gray-500">vs</div>
                <div className="text-sm font-bold">{match.team_b}</div>
              </div>

              {/* Odds Section */}
              <div className="flex gap-1">
                <div className="bg-[#1a2d47] p-2 rounded text-center">
                  <div className="text-[8px] text-blue-400">BACK</div>
                  <div className="text-xs font-black">{match.back_odds_a}</div>
                </div>
                <div className="bg-[#372335] p-2 rounded text-center">
                  <div className="text-[8px] text-pink-400">LAY</div>
                  <div className="text-xs font-black">{match.lay_odds_a}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
