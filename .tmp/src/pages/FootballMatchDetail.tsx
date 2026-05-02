import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";

interface FootballMatchDetailProps {
  match: any;
  clientData: any;
  session: any;
  liveOddsData?: any;
}

export default function FootballMatchDetail({ match, clientData, session, liveOddsData }: FootballMatchDetailProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeMediaTab, setActiveMediaTab] = useState<'tv'|'scorecard'>('tv');
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keepDisplayOn, setKeepDisplayOn] = useState(true);

  const clientBalance = clientData?.cash ?? 0;

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

  const matchTitle = match.title || `${match.team1} v ${match.team2}`;

  return (
    <div className="min-h-screen bg-[#ecf0f1] flex flex-col">
      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="bg-[#254465] p-3 text-white">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-white/60" />
            <span className="text-[11px] text-white/60">3 hours ago | May 01 6:00 pm | Winners: 1</span>
          </div>
          <span className="text-[#00b181] font-black text-sm tracking-wider">INPLAY</span>
        </div>
        <h1 className="font-black text-xl leading-tight my-1.5">{matchTitle}</h1>
        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-[13px]">Remaining : 00:42:15</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <input type="checkbox" checked={keepDisplayOn} onChange={(e) => setKeepDisplayOn(e.target.checked)} className="w-4 h-4 accent-blue-500" />
          <span className="text-[13px]">Keep Display On</span>
        </div>
      </div>

      <div className="bg-[#254465] p-2.5 flex gap-2 overflow-x-auto no-scrollbar">
        {["ALL", "Others"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-1.5 font-bold text-[13px] border-2 border-white/20 transition-colors ${activeTab === tab ? "bg-[#00b181] text-white" : "text-white"}`}>
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-6">
        <FootballCombinedSectionHeader title="MATCH ODDS (MaxBet: 1M)" />
        {(() => {
          const runner1 = getLiveRunner(match.team1, 0);
          const runner2 = getLiveRunner(match.team2, 1);
          const runnerDraw = getLiveRunner("The Draw", 2) || matchOddsMarket?.runners?.find((r: any) => r.runnerName?.toLowerCase().includes('draw'));
          
          return (
            <>
              <FootballTeamRow 
                name={match.team1} 
                odds={hasLiveOdds ? (runner1?.backPrice ?? match.back_odds ?? 2.1) : (match.back_odds ?? 2.1)} 
                layOdds={hasLiveOdds ? (runner1?.layPrice ?? match.lay_odds ?? 2.12) : (match.lay_odds ?? 2.12)} 
                backSize={hasLiveOdds ? formatSize(runner1?.backSize) : undefined}
                laySize={hasLiveOdds ? formatSize(runner1?.laySize) : undefined}
                onBet={(t, o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })} 
              />
              <FootballTeamRow 
                name={match.team2} 
                odds={hasLiveOdds ? (runner2?.backPrice ?? match.back_odds2 ?? 3.4) : (match.back_odds2 ?? 3.4)} 
                layOdds={hasLiveOdds ? (runner2?.layPrice ?? match.lay_odds2 ?? 3.45) : (match.lay_odds2 ?? 3.45)} 
                backSize={hasLiveOdds ? formatSize(runner2?.backSize) : undefined}
                laySize={hasLiveOdds ? formatSize(runner2?.laySize) : undefined}
                onBet={(t, o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })} 
              />
              <FootballTeamRow 
                name="The Draw" 
                odds={hasLiveOdds ? (runnerDraw?.backPrice ?? 3.85) : 3.85} 
                layOdds={hasLiveOdds ? (runnerDraw?.layPrice ?? 3.9) : 3.9} 
                backSize={hasLiveOdds ? formatSize(runnerDraw?.backSize) : undefined}
                laySize={hasLiveOdds ? formatSize(runnerDraw?.laySize) : undefined}
                onBet={(t, o) => setActiveBet({ match, selection: "The Draw", betType: t, odds: o })} 
              />
            </>
          );
        })()}

        <GoalsSection title="OVER/UNDER 0.5 GOALS (MaxBet: 250K)" underOdds={13} underLay={14.5} overOdds={1.07} overLay={1.09} onBet={(s, t, o) => setActiveBet({ match, selection: s, betType: t, odds: o })} />
        <GoalsSection title="OVER/UNDER 1.5 GOALS (MaxBet: 250K)" underOdds={3.85} underLay={3.95} overOdds={1.34} overLay={1.35} onBet={(s, t, o) => setActiveBet({ match, selection: s, betType: t, odds: o })} />
        <GoalsSection title="OVER/UNDER 2.5 GOALS (MaxBet: 250K)" underOdds={1.98} underLay={1.99} overOdds={2.0} overLay={2.04} onBet={(s, t, o) => setActiveBet({ match, selection: s, betType: t, odds: o })} />

        {/* TV / SCORE CARD */}
        <div style={{ marginTop: 4 }}>
          <div style={{ display: "flex" }}>
            <button onClick={() => setActiveMediaTab('tv')} style={{ flex: 1, padding: "11px 0", backgroundColor: activeMediaTab === 'tv' ? "#00b181" : "#00a070", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", borderRight: "1px solid rgba(255,255,255,0.25)" }}>Tv</button>
            <button onClick={() => setActiveMediaTab('scorecard')} style={{ flex: 1, padding: "11px 0", backgroundColor: activeMediaTab === 'scorecard' ? "#00b181" : "#00a070", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>Score Card</button>
          </div>
          <div style={{ backgroundColor: "#111", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "3px solid #00b181" }}>
            {activeMediaTab === 'tv' ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>📺 Live stream unavailable</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Stream will appear when match is live</div>
              </div>
            ) : (
              <FootballScoreCard match={match} />
            )}
          </div>
        </div>

        {/* OPEN BETS */}
        <div style={{ marginTop: 0, backgroundColor: "white" }}>
          <div style={{ backgroundColor: "#254465", padding: "7px 12px" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Open Bets (0)</span>
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
              <tr><td colSpan={3} style={{ padding: "16px", textAlign: "center", color: "#999" }}>No open bets</td></tr>
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

      <BetSlip bet={activeBet} onClose={() => setActiveBet(null)} onSubmit={(stake) => placeBet(stake)} isSubmitting={isSubmitting} />
    </div>
  );
}

function FootballCombinedSectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#254465" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "5px 10px" }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#00b181", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 10, fontWeight: 900 }}>$</span>
        </div>
        <span style={{ color: "white", fontWeight: 900, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.3 }}>{title}</span>
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
  );
}

function FootballTeamRow({ name, odds, layOdds, backSize, laySize, onBet }: { name: string; odds: number; layOdds: number; backSize?: string; laySize?: string; onBet: (type: 'back' | 'lay', odds: number) => void }) {
  const displayBackSize = backSize || `${(Math.random() * 3 + 0.5).toFixed(1)}M`;
  const displayLaySize = laySize || `${(Math.random() * 2 + 0.2).toFixed(1)}M`;
  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#edf4fc", borderBottom: "1px solid #c4d9ea", minHeight: 44 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "6px 12px" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#212529" }}>{name}</span>
      </div>
      <div onClick={() => onBet('back', odds)} style={{ width: 60, backgroundColor: "#a5d9fe", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 0, padding: "0 2px" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#212529", lineHeight: 1.1 }}>{odds.toFixed(2)}</span>
        <span style={{ fontSize: 9, color: "#666", lineHeight: 1 }}>{displayBackSize}</span>
      </div>
      <div onClick={() => onBet('lay', layOdds)} style={{ width: 60, backgroundColor: "#f8d0ce", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 0, padding: "0 2px" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#212529", lineHeight: 1.1 }}>{layOdds.toFixed(2)}</span>
        <span style={{ fontSize: 9, color: "#666", lineHeight: 1 }}>{displayLaySize}</span>
      </div>
    </div>
  );
}

function GoalsSection({ title, underOdds, underLay, overOdds, overLay, onBet }: any) {
  return (
    <>
      <FootballCombinedSectionHeader title={title} />
      <FootballTeamRow name={`Under ${title.split(' ')[1]}`} odds={underOdds} layOdds={underLay} onBet={(t, o) => onBet(`Under ${title.split(' ')[1]}`, t, o)} />
      <FootballTeamRow name={`Over ${title.split(' ')[1]}`} odds={overOdds} layOdds={overLay} onBet={(t, o) => onBet(`Over ${title.split(' ')[1]}`, t, o)} />
    </>
  );
}

function FootballScoreCard({ match }: { match: any }) {
  return (
    <div className="bg-[#1a1a2e] p-4 text-white flex flex-col items-center">
      <div className="text-[13px] font-bold text-white/80 mb-4">01 MAY | 18:00</div>
      <div className="flex justify-between items-center w-full max-w-sm mb-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">⚽</span>
          <span className="font-bold text-sm uppercase">{match.team1 || 'Team A'}</span>
          <span className="text-[11px] text-white/50">MAN</span>
        </div>
        <div className="flex gap-4">
          {[ 
            { val: '00', label: 'DAYS' },
            { val: '18', label: 'HRS' },
            { val: '42', label: 'MINS' },
            { val: '15', label: 'SECS' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-white/10 rounded border border-white/5 flex items-center justify-center font-bold text-lg">{item.val}</div>
              <span className="text-[9px] text-white/40 font-bold">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">⚽</span>
          <span className="font-bold text-sm uppercase">{match.team2 || 'Team B'}</span>
          <span className="text-[11px] text-white/50">MON</span>
        </div>
      </div>
      <div className="w-full max-w-md h-32 bg-green-900/40 rounded-lg border border-white/10 relative overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border border-white/20 rounded-full" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] text-white/40">2x45 min</div>
      </div>
      <div className="w-full max-w-md bg-white/5 p-2 rounded flex justify-between text-[11px] text-white/60">
        <span>Referee: M. Oliver</span>
        <span>Manager: P. Guardiola / J. Klopp</span>
      </div>
    </div>
  );
}
