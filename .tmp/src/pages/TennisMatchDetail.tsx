import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Info, ChevronDown, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TennisMatchDetailProps {
  match: any;
  clientData: any;
  session: any;
}

export default function TennisMatchDetail({ match, clientData, session }: TennisMatchDetailProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [scoreTab, setScoreTab] = useState<"tv" | "scorecard">("scorecard");
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keepDisplayOn, setKeepDisplayOn] = useState(true);

  const clientBalance = clientData?.cash ?? 0;

  // Fetch open bets for this match
  const { data: openBets = [] } = useQuery({
    queryKey: ['open-bets', match?.id, session?.username],
    queryFn: () => Bet.filter({ 
      user_email: session?.username,
      match_id: match?.id,
      status: 'pending'
    }),
    enabled: !!session?.username && !!match?.id,
    refetchInterval: 5000
  });

  const { mutate: placeBet, isPending: isSubmitting } = useMutation({
    mutationFn: async (stake: number) => {
      if (!activeBet || !session || !clientData) return;
      if (stake > clientBalance) throw new Error("Insufficient balance");
      
      const potentialWin = (stake * activeBet.odds) - stake;
      
      await Bet.create({
        user_email: session.username,
        match_id: activeBet.match.id,
        match_title: activeBet.match.title || `${activeBet.match.team1} v ${activeBet.match.team2}`,
        selection: activeBet.selection,
        bet_type: activeBet.betType,
        stake,
        odds: activeBet.odds,
        potential_win: potentialWin,
        status: 'pending'
      });
      
      await Client.update(clientData.id, { cash: clientBalance - stake });
    },
    onSuccess: () => {
      setActiveBet(null);
      queryClient.invalidateQueries({ queryKey: ['client-data'] });
      queryClient.invalidateQueries({ queryKey: ['open-bets'] });
      toast({ title: "Bet Placed", description: "Your bet has been recorded successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Bet Failed", description: error.message });
    }
  });

  const matchTitle = match.title || `${match.team1} v ${match.team2}`;

  return (
    <div className="min-h-screen bg-[#e6f2fc] flex flex-col font-sans">
      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 1. MATCH INFO HEADER */}
      <div className="bg-[#254465] p-3.5 text-white">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/play')} className="hover:opacity-80 transition-opacity">
                <ArrowLeft size={22} />
              </button>
              <div className="flex items-center gap-1.5 ml-1">
                <Clock size={14} className="text-white/60" />
                <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">
                  an hour ago | {match.match_time || 'Live Now'} | Winners: 1
                </span>
              </div>
            </div>
            <h1 className="font-black text-[22px] leading-none mt-2 tracking-tight">
              {matchTitle}
            </h1>
          </div>
          <span className="text-[#00b181] font-black text-sm uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
            INPLAY
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <span className="font-black text-[14px] text-white/90">Elapsed : 01:07:56</span>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                id="keep-display"
                checked={keepDisplayOn} 
                onChange={(e) => setKeepDisplayOn(e.target.checked)} 
                className="w-4.5 h-4.5 accent-[#00b181] cursor-pointer" 
              />
            </div>
            <label htmlFor="keep-display" className="text-[13px] font-bold cursor-pointer">Keep Display On</label>
          </div>
        </div>
      </div>

      {/* 2. TENNIS SCORE TABLE */}
      <div className="bg-[#1f2a36] text-white border-y border-white/5">
        <div className="flex flex-col">
          {/* Data Rows */}
          <div className="flex items-center border-b border-white/5 py-1.5 px-3">
            <div className="flex-1 font-bold text-[14px] truncate">{match.team1}</div>
            <div className="flex items-center text-center">
              <div className="w-[35px] font-black text-[17px]">6</div>
              <div className="w-[35px] font-black text-[17px]">1</div>
              <div className="w-[35px] font-black text-[17px] text-white/40">0</div>
              <div className="w-[55px] font-black text-[17px] text-[#00b181]">0</div>
              <div className="w-[65px] font-black text-[17px]">0</div>
            </div>
          </div>
          <div className="flex items-center py-1.5 px-3">
            <div className="flex-1 font-bold text-[14px] truncate">{match.team2}</div>
            <div className="flex items-center text-center">
              <div className="w-[35px] font-black text-[17px]">2</div>
              <div className="w-[35px] font-black text-[17px]">6</div>
              <div className="w-[35px] font-black text-[17px] text-white/40">0</div>
              <div className="w-[55px] font-black text-[17px] text-[#00b181]">0</div>
              <div className="w-[65px] font-black text-[17px]">0</div>
            </div>
          </div>
          {/* Headers Row */}
          <div className="flex items-center bg-black/30 py-1 px-3 text-[10px] font-black text-white/40 uppercase tracking-widest">
            <div className="flex-1"></div>
            <div className="flex items-center text-center">
              <div className="w-[35px]">1</div>
              <div className="w-[35px]">2</div>
              <div className="w-[35px]">3</div>
              <div className="w-[55px]">Points</div>
              <div className="w-[65px]">ServBreak</div>
            </div>
          </div>
          {/* Bottom indicator */}
          <div className="px-3 py-1.5 bg-black/10">
            <span className="text-[#00b181] font-black text-[11px] uppercase">Set 3 | 0:0</span>
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS */}
      <div className="bg-[#254465] p-2.5 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5">
        {["ALL", "Others"].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={cn(
              "rounded-full px-5 py-1.5 font-black text-[13px] border-2 transition-all active:scale-95 uppercase tracking-wide",
              activeTab === tab 
                ? "bg-[#00b181] text-white border-[#00b181]" 
                : "text-white border-white/20 hover:bg-white/5"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-32">
        {/* 4. MATCH ODDS SECTION */}
        {(activeTab === "ALL" || activeTab === "Match Odds") && (
          <>
            <div className="flex items-stretch bg-[#254465] border-b border-white/5">
              <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5">
                <div className="w-5.5 h-5.5 rounded-full bg-[#00b181] flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
                  <span className="text-white text-[11px] font-black">$</span>
                </div>
                <span className="text-white font-black text-[13px] uppercase tracking-tight">
                  MATCH ODDS (MaxBet: 250K)
                </span>
                <button className="w-5 h-5 rounded bg-[#1a2c44] flex items-center justify-center ml-1 text-white/60 hover:text-white transition-colors">
                  <Info size={12} />
                </button>
              </div>
              <div className="flex shrink-0">
                <div className="w-[60px] flex items-center justify-center bg-[#3d5a7a]">
                  <span className="text-white font-black text-[12px] tracking-widest">BACK</span>
                </div>
                <div className="w-[60px] flex items-center justify-center bg-[#3d5a7a] border-l border-white/5">
                  <span className="text-white font-black text-[12px] tracking-widest">LAY</span>
                </div>
              </div>
            </div>

            <TennisOddsRow 
              name={match.team1} 
              odds={match.back_odds || 1.72} 
              layOdds={match.lay_odds || 1.74} 
              onBet={(t, o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })} 
            />
            <TennisOddsRow 
              name={match.team2} 
              odds={match.back_odds2 || 2.36} 
              layOdds={match.lay_odds2 || 2.4} 
              onBet={(t, o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })} 
            />

            {/* LIVE VIDEO STATUS */}
            <div className="bg-white p-3.5 border-b border-gray-200">
              <span className="text-[#e53e3e] font-black text-sm tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                LIVE VIDEO AVAILABLE
              </span>
            </div>
          </>
        )}

        {/* 5. TV / SCORE CARD TABS */}
        <div className="mt-0">
          <div className="flex border-b-2 border-white/10">
            <button 
              onClick={() => setScoreTab("tv")}
              className={cn(
                "flex-1 py-3.5 font-black text-[16px] transition-all",
                scoreTab === "tv" ? "bg-[#008c66] text-white shadow-inner" : "bg-[#00b181] text-white/80 hover:bg-[#00a377]"
              )}
            >
              Tv
            </button>
            <button 
              onClick={() => setScoreTab("scorecard")}
              className={cn(
                "flex-1 py-3.5 font-black text-[16px] transition-all border-l border-white/10",
                scoreTab === "scorecard" ? "bg-[#008c66] text-white shadow-inner" : "bg-[#00b181] text-white/80 hover:bg-[#00a377]"
              )}
            >
              Score Card
            </button>
          </div>

          {/* 6. SCORE CARD SECTION */}
          {scoreTab === "scorecard" ? (
            <div className="bg-[#0d1117] p-0 flex flex-col relative">
              {/* Card Header Area */}
              <div className="p-4 flex flex-col items-center">
                <div className="bg-[#5a3a22] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full mb-4 tracking-widest border border-white/10">
                  Set 3 | Game 1
                </div>
                
                <div className="flex justify-between items-center w-full px-4 max-w-lg mb-6">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-[28px] drop-shadow-md">🇺🇦</span>
                    <span className="font-black text-sm text-white/90 uppercase text-center tracking-tight leading-none h-8 flex items-center">
                      {match.team1}
                    </span>
                  </div>
                  
                  <div className="px-6 flex flex-col items-center">
                    <span className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">0 : 0</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-[28px] drop-shadow-md">🇦🇹</span>
                    <span className="font-black text-sm text-white/90 uppercase text-center tracking-tight leading-none h-8 flex items-center">
                      {match.team2}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between w-full max-w-md px-2 text-[12px] font-bold text-white/40 mb-2">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                    Set 3 <ChevronDown size={14} />
                  </div>
                  <span className="tracking-wide">Best of 3</span>
                </div>

                {/* Score Grid Small */}
                <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-black text-white/60 uppercase">
                      <span>KOS</span>
                      <div className="flex gap-1">
                        {[6,1,0].map((v, i) => (
                          <div key={i} className="w-5 h-5 bg-white/5 rounded border border-white/10 flex items-center justify-center">{v}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-black text-white/60 uppercase">
                      <span>POT</span>
                      <div className="flex gap-1">
                        {[2,6,0].map((v, i) => (
                          <div key={i} className="w-5 h-5 bg-white/5 rounded border border-white/10 flex items-center justify-center">{v}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TENNIS COURT VISUALIZATION */}
              <div className="w-full aspect-[16/10] bg-[#c07040] relative overflow-hidden border-y-4 border-white/10 mx-auto max-w-2xl">
                {/* Court Lines */}
                <div className="absolute inset-4 border-[1.5px] border-white/60">
                  {/* Center line vertical */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-white/60" />
                  {/* Baseline / Service Line area */}
                  <div className="absolute top-[20%] bottom-[20%] left-0 right-0 border-y-[1.5px] border-white/60">
                    <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-white/60 -translate-y-1/2" />
                  </div>
                </div>

                {/* Center Stat Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                  <div className="bg-black/20 backdrop-blur-[2px] p-4 rounded-xl border border-white/10 flex flex-col items-center">
                    <span className="text-white font-black text-4xl leading-none">24/46</span>
                    <span className="text-white font-black text-xl mt-1 opacity-90">52%</span>
                    <span className="text-white/60 font-black text-[10px] uppercase tracking-[0.2em] mt-2">Service Points Won</span>
                  </div>
                </div>

                {/* Ball indicator */}
                <div className="absolute right-[25%] top-[45%] w-3.5 h-3.5 bg-yellow-400 rounded-full shadow-[0_0_12px_rgba(250,204,21,1)] z-20" />

                {/* Player Labels on Court */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-[#5a3a22]/80 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                    <span className="text-white font-black text-[11px] uppercase tracking-wider">Set 3 • {match.team2} 🇦🇹</span>
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 drop-shadow-lg">
                    <span className="text-white font-black text-[13px] uppercase tracking-widest">🇺🇦 {match.team1}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1a2e] p-12 text-center text-white/40 font-black uppercase tracking-widest border-y border-white/5">
              Live stream unavailable
            </div>
          )}
        </div>

        {/* 7. OPEN BETS SECTION */}
        <div className="mt-4 bg-white shadow-sm border-y border-gray-200">
          <div className="bg-[#254465] px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-white font-black text-[14px] uppercase tracking-wide">Open Bets ({openBets.length})</span>
            <ChevronDown size={16} className="text-white/60" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-[11px] font-black text-[#64748b] uppercase tracking-widest">Runner</th>
                  <th className="px-4 py-3 text-center text-[11px] font-black text-[#64748b] uppercase tracking-widest w-[80px]">Price</th>
                  <th className="px-4 py-3 text-right text-[11px] font-black text-[#64748b] uppercase tracking-widest w-[120px]">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {openBets.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-[13px] font-bold text-gray-400 uppercase tracking-widest">
                      No open bets found
                    </td>
                  </tr>
                ) : (
                  openBets.map((bet: any) => (
                    <tr key={bet.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-tighter",
                            bet.bet_type === 'back' ? "bg-[#72bbef] text-black" : "bg-[#faa9ba] text-black"
                          )}>
                            {bet.bet_type}
                          </span>
                          <span className="font-black text-[14px] text-[#1e293b]">{bet.selection}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-black text-[15px] text-[#1e293b]">{bet.odds}</td>
                      <td className="px-4 py-3.5 text-right font-black text-[15px] text-[#1e293b]">Rs. {bet.stake?.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <BetSlip 
        bet={activeBet} 
        onClose={() => setActiveBet(null)} 
        onSubmit={(stake) => placeBet(stake)} 
        isSubmitting={isSubmitting} 
      />
    </div>
  );
}

function TennisOddsRow({ name, odds, layOdds, onBet }: { 
  name: string; 
  odds: number; 
  layOdds: number; 
  onBet: (type: 'back' | 'lay', odds: number) => void 
}) {
  const backSize = `${(Math.random() * 400 + 100).toFixed(1)}K`;
  const laySize = `${(Math.random() * 600 + 200).toFixed(1)}K`;
  
  return (
    <div className="flex items-stretch bg-[#dce8f3] border-b border-[#c4d9ea] min-h-[70px] hover:bg-[#d4e2ee] transition-colors">
      <div className="flex-1 flex items-center px-4 py-3">
        <span className="font-black text-[17px] text-[#1e293b] tracking-tight">{name}</span>
      </div>
      <div 
        onClick={() => onBet('back', odds)} 
        className="w-[60px] bg-[#72bbef] hover:bg-[#62aadd] flex flex-col items-center justify-center cursor-pointer transition-colors active:scale-95 border-l border-white/10"
      >
        <span className="font-black text-[22px] text-[#1e293b] leading-none">{odds.toFixed(2)}</span>
        <span className="text-[10px] font-black text-[#1e293b]/60 mt-1 tracking-tighter">{backSize}</span>
      </div>
      <div 
        onClick={() => onBet('lay', layOdds)} 
        className="w-[60px] bg-[#faa9ba] hover:bg-[#f898ab] flex flex-col items-center justify-center cursor-pointer transition-colors active:scale-95 border-l border-white/10"
      >
        <span className="font-black text-[22px] text-[#1e293b] leading-none">{layOdds.toFixed(2)}</span>
        <span className="text-[10px] font-black text-[#1e293b]/60 mt-1 tracking-tighter">{laySize}</span>
      </div>
    </div>
  );
}

