import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { useToast } from "@/hooks/use-toast";
import { Info, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Sub-components
import { TennisMatchInfo } from "@/components/user/TennisMatchInfo";
import { TennisScoreTable } from "@/components/user/TennisScoreTable";
import { TennisScoreCard } from "@/components/user/TennisScoreCard";
import { TennisOddsRow } from "@/components/user/TennisOddsRow";

interface TennisMatchDetailProps {
  match: any;
  clientData: any;
  session: any;
}

export default function TennisMatchDetail({ match, clientData, session }: TennisMatchDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  return (
    <div className="min-h-screen bg-[#ecf0f1] flex flex-col font-sans">
      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 1. MATCH INFO HEADER */}
      <TennisMatchInfo 
        match={match} 
        keepDisplayOn={keepDisplayOn} 
        setKeepDisplayOn={setKeepDisplayOn} 
      />

      {/* 2. TENNIS SCORE TABLE */}
      <TennisScoreTable match={match} />

      <main className="flex-1 overflow-y-auto pb-32">
        {/* 4. MATCH ODDS SECTION */}
        <div className="flex items-stretch bg-[#254465] border-b border-white/5">
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5">
            <div className="w-5.5 h-5.5 rounded-full bg-[#00b181] flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
              <span className="text-white text-[11px] font-black">$</span>
            </div>
            <span className="text-white font-black text-[13px] uppercase tracking-tight">
              MATCH ODDS (MaxBet: 250K)
            </span>
            <button 
              className="ml-2 flex items-center justify-center" 
              style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: "#1a2c44" }}
            >
              <Info size={14} className="text-white" />
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

        {/* 5. TV / SCORE CARD TABS & COURT VISUAL */}
        <TennisScoreCard 
          scoreTab={scoreTab} 
          setScoreTab={setScoreTab} 
          match={match} 
        />

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
