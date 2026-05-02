import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { useToast } from "@/hooks/use-toast";
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
  liveOddsData?: any;
}

export default function TennisMatchDetail({ match, clientData, session, liveOddsData }: TennisMatchDetailProps) {
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

  // Extract Match Odds market
  const matchOddsMarket = liveOddsData?.markets?.find((m: any) =>
    m.marketName?.toLowerCase().includes('match odds') || m.marketName?.toLowerCase().includes('match_odds')
  ) || liveOddsData?.markets?.[0];

  const hasLiveOdds = !!match?.betfair_event_id && !!matchOddsMarket;

  const formatSize = (size: number | null) => {
    if (!size) return '';
    if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
    if (size >= 1000) return `${(size / 1000).toFixed(1)}K`;
    return String(Math.round(size));
  };

  const getLiveRunner = (teamName: string, idx: number) => {
    if (!matchOddsMarket) return null;
    return matchOddsMarket.runners?.[idx] || 
      matchOddsMarket.runners?.find((r: any) => 
        r.runnerName?.toLowerCase() === teamName?.toLowerCase()
      ) || null;
  };

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

      <main className="flex-1 overflow-y-auto pb-6">
        {/* 4. MATCH ODDS SECTION */}
        <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#254465" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "5px 10px" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#00b181", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontSize: 10, fontWeight: 900 }}>$</span>
            </div>
            <span style={{ color: "white", fontWeight: 900, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.3 }}>MATCH ODDS (MaxBet: 250K)</span>
            <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: "#1a2c44", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4, cursor: "pointer" }}>
              <span style={{ color: "white", fontSize: 9, fontWeight: 700 }}>i</span>
            </div>
          </div>
          <div style={{ display: "flex", flexShrink: 0 }}>
            <div style={{ width: 60, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e3a5c", borderLeft: "1px solid rgba(255,255,255,0.1)", padding: "5px 0" }}>
              <span style={{ color: "white", fontWeight: 900, fontSize: 11, letterSpacing: 1 }}>BACK</span>
            </div>
            <div style={{ width: 60, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e3a5c", borderLeft: "1px solid rgba(255,255,255,0.1)", padding: "5px 0" }}>
              <span style={{ color: "white", fontWeight: 900, fontSize: 11, letterSpacing: 1 }}>LAY</span>
            </div>
          </div>
        </div>

        {(() => {
          const runner1 = getLiveRunner(match.team1, 0);
          const runner2 = getLiveRunner(match.team2, 1);
          return (
            <>
              <TennisOddsRow 
                name={match.team1} 
                odds={hasLiveOdds ? (runner1?.backPrice ?? match.back_odds ?? 1.72) : (match.back_odds ?? 1.72)} 
                layOdds={hasLiveOdds ? (runner1?.layPrice ?? match.lay_odds ?? 1.74) : (match.lay_odds ?? 1.74)} 
                backSize={hasLiveOdds ? formatSize(runner1?.backSize) : undefined}
                laySize={hasLiveOdds ? formatSize(runner1?.laySize) : undefined}
                onBet={(t, o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })} 
              />
              <TennisOddsRow 
                name={match.team2} 
                odds={hasLiveOdds ? (runner2?.backPrice ?? match.back_odds2 ?? 2.36) : (match.back_odds2 ?? 2.36)} 
                layOdds={hasLiveOdds ? (runner2?.layPrice ?? match.lay_odds2 ?? 2.4) : (match.lay_odds2 ?? 2.4)} 
                backSize={hasLiveOdds ? formatSize(runner2?.backSize) : undefined}
                laySize={hasLiveOdds ? formatSize(runner2?.laySize) : undefined}
                onBet={(t, o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })} 
              />
            </>
          );
        })()}

        {/* 5. TV / SCORE CARD TABS & COURT VISUAL */}
        <TennisScoreCard 
          scoreTab={scoreTab} 
          setScoreTab={setScoreTab} 
          match={match} 
        />

        {/* 7. OPEN BETS SECTION */}
        <div style={{ marginTop: 0, backgroundColor: "white" }}>
          <div style={{ backgroundColor: "#254465", padding: "7px 12px" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Open Bets ({openBets.length})</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "5px 10px", textAlign: "left", fontWeight: 700, color: "#254465", borderBottom: "1px solid #e0e0e0" }}>Runner</th>
                <th style={{ padding: "5px 10px", textAlign: "center", fontWeight: 700, color: "#254465", borderBottom: "1px solid #e0e0e0" }}>Price</th>
                <th style={{ padding: "5px 10px", textAlign: "right", fontWeight: 700, color: "#254465", borderBottom: "1px solid #e0e0e0" }}>Size</th>
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
                    <td className="px-3 py-2">
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
                    <td className="px-3 py-2 text-center font-black text-[15px] text-[#1e293b]">{bet.odds}</td>
                    <td className="px-3 py-2 text-right font-black text-[15px] text-[#1e293b]">Rs. {bet.stake?.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MATCHED BETS */}
        <div style={{ marginTop: 0, backgroundColor: "white", marginBottom: 16 }}>
          <div style={{ backgroundColor: "#254465", padding: "7px 12px" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Matched Bets (0)</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "5px 10px", textAlign: "left", fontWeight: 700, color: "#254465", borderBottom: "1px solid #e0e0e0" }}>Runner</th>
                <th style={{ padding: "5px 10px", textAlign: "center", fontWeight: 700, color: "#254465", borderBottom: "1px solid #e0e0e0" }}>Price</th>
                <th style={{ padding: "5px 10px", textAlign: "right", fontWeight: 700, color: "#254465", borderBottom: "1px solid #e0e0e0" }}>Size</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={3} style={{ padding: "16px", textAlign: "center", color: "#999" }}>No matched bets</td></tr>
            </tbody>
          </table>
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
