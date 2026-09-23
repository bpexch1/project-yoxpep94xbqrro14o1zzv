import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { MatchedAndOpenBets } from "@/components/user/MatchedAndOpenBets";
import { FootballShotmap } from "@/components/football/FootballShotmap";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { calculateMarketPositions } from "@/utils/bettingPositions";

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
  const [activeMediaTab, setActiveMediaTab] = useState<'tv' | 'scorecard' | 'shotmap'>('shotmap');
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keepDisplayOn, setKeepDisplayOn] = useState(true);

  const clientBalance = clientData?.cash ?? 0;

  // Fetch real-time open bets for this match and user
  const { data: openBets = [] } = useQuery({
    queryKey: ['open-bets', match?.id, match?.title, session?.username],
    queryFn: async () => {
      if (!session?.username) return [];
      const userBets = await Bet.filter({ 
        user_email: session.username,
        status: 'pending'
      });
      const currentId = match?.id;
      const currentTitle = (match?.title || `${match?.team1 || ""} v ${match?.team2 || ""}`).toLowerCase().trim();
      return (userBets || []).filter((b: any) => {
        if (currentId && b.match_id === currentId) return true;
        if (match?.betfair_event_id && b.match_id === match.betfair_event_id) return true;
        if (currentTitle && b.match_title && b.match_title.toLowerCase().trim() === currentTitle) return true;
        return false;
      });
    },
    enabled: !!session?.username && (!!match?.id || !!match?.title),
    refetchInterval: 3000
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
      queryClient.invalidateQueries({ queryKey: ['user-header-balance'] });
      queryClient.invalidateQueries({ queryKey: ['user-header-bets'] });
      queryClient.invalidateQueries({ queryKey: ['open-bets', match?.id, session?.username] });
      toast({
        title: "Bet Placed Successfully",
        description: `Matched on ${activeBet?.selection || ""} at ${activeBet?.odds}`,
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Bet Failed", description: error.message });
    }
  });

  // Calculate runner positions across football markets
  const matchOddsRunners = [match.team1, match.team2, "The Draw"].filter(Boolean);
  const matchOddsPositions = calculateMarketPositions(matchOddsRunners, openBets as any);

  const underOver05Runners = ["Under 0.5 Goals", "Over 0.5 Goals"];
  const underOver05Positions = calculateMarketPositions(underOver05Runners, openBets as any);

  const underOver15Runners = ["Under 1.5 Goals", "Over 1.5 Goals"];
  const underOver15Positions = calculateMarketPositions(underOver15Runners, openBets as any);

  const underOver25Runners = ["Under 2.5 Goals", "Over 2.5 Goals"];
  const underOver25Positions = calculateMarketPositions(underOver25Runners, openBets as any);

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

  const formatPKT = (timeStr: string | null | undefined): string => {
    if (!timeStr) return '';
    const s = String(timeStr);
    try {
      if (s.includes('T') || s.includes('Z') || /^\d{10,}$/.test(s)) {
        const d = /^\d{10,}$/.test(s) ? new Date(parseInt(s)) : new Date(s);
        return d.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Karachi'
        });
      }
      return s.length > 5 ? s.substring(0, 5) : s;
    } catch { return s; }
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
            <span className="text-[11px] text-white/60">Starts at: {formatPKT(match.match_time)} | Winners: 1</span>
          </div>
          <span className="text-[#00b181] font-black text-sm tracking-wider uppercase">
            {match.status === 'live' ? 'INPLAY' : match.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED'}
          </span>
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
                position={matchOddsPositions[match.team1]}
                odds={hasLiveOdds ? (runner1?.backPrice ?? match.back_odds ?? 2.1) : (match.back_odds ?? 2.1)} 
                layOdds={hasLiveOdds ? (runner1?.layPrice ?? match.lay_odds ?? 2.12) : (match.lay_odds ?? 2.12)} 
                backSize={hasLiveOdds ? formatSize(runner1?.backSize) : undefined}
                laySize={hasLiveOdds ? formatSize(runner1?.laySize) : undefined}
                onBet={(t, o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })} 
              />
              <FootballTeamRow 
                name={match.team2} 
                position={matchOddsPositions[match.team2]}
                odds={hasLiveOdds ? (runner2?.backPrice ?? match.back_odds2 ?? 3.4) : (match.back_odds2 ?? 3.4)} 
                layOdds={hasLiveOdds ? (runner2?.layPrice ?? match.lay_odds2 ?? 3.45) : (match.lay_odds2 ?? 3.45)} 
                backSize={hasLiveOdds ? formatSize(runner2?.backSize) : undefined}
                laySize={hasLiveOdds ? formatSize(runner2?.laySize) : undefined}
                onBet={(t, o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })} 
              />
              <FootballTeamRow 
                name="The Draw" 
                position={matchOddsPositions["The Draw"]}
                odds={hasLiveOdds ? (runnerDraw?.backPrice ?? 3.85) : 3.85} 
                layOdds={hasLiveOdds ? (runnerDraw?.layPrice ?? 3.9) : 3.9} 
                backSize={hasLiveOdds ? formatSize(runnerDraw?.backSize) : undefined}
                laySize={hasLiveOdds ? formatSize(runnerDraw?.laySize) : undefined}
                onBet={(t, o) => setActiveBet({ match, selection: "The Draw", betType: t, odds: o })} 
              />
            </>
          );
        })()}

        {/* LIVE VIDEO AVAILABLE Banner */}
        <div style={{ backgroundColor: "#e8eff5", padding: "6px 10px", borderBottom: "1px solid #cbd5e1", display: "flex", alignItems: "center" }}>
          <span style={{ color: "#e53935", fontWeight: 900, fontSize: 12, letterSpacing: "0.5px" }}>
            LIVE VIDEO AVAILABLE
          </span>
        </div>

        <GoalsSection 
          title="OVER/UNDER 2.5 GOALS (MaxBet: 250K)" 
          underOdds={3.75} 
          underLay={3.8} 
          overOdds={1.35} 
          overLay={1.37} 
          positions={underOver25Positions}
          onBet={(s: string, t: any, o: any) => setActiveBet({ match, selection: s, betType: t, odds: o })} 
        />
        <GoalsSection 
          title="OVER/UNDER 3.5 GOALS (MaxBet: 250K)" 
          underOdds={1.58} 
          underLay={1.59} 
          overOdds={2.68} 
          overLay={2.72} 
          positions={underOver15Positions}
          onBet={(s: string, t: any, o: any) => setActiveBet({ match, selection: s, betType: t, odds: o })} 
        />
        <GoalsSection 
          title="OVER/UNDER 4.5 GOALS (MaxBet: 250K)" 
          underOdds={1.13} 
          underLay={1.14} 
          overOdds={8.0} 
          overLay={8.2} 
          positions={underOver05Positions}
          onBet={(s: string, t: any, o: any) => setActiveBet({ match, selection: s, betType: t, odds: o })} 
        />

        {/* TV / SCORE CARD */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", gap: 4, padding: "0 10px" }}>
            <button
              onClick={() => setActiveMediaTab('tv')}
              style={{
                padding: "6px 18px",
                borderRadius: "16px 16px 0 0",
                backgroundColor: activeMediaTab === 'tv' ? "#00b894" : "#1e3a5f",
                color: "white",
                fontWeight: 800,
                fontSize: 12.5,
                border: "none",
                cursor: "pointer"
              }}
            >
              Tv
            </button>
            <button
              onClick={() => setActiveMediaTab('scorecard')}
              style={{
                padding: "6px 18px",
                borderRadius: "16px 16px 0 0",
                backgroundColor: activeMediaTab === 'scorecard' ? "#00b894" : "#1e3a5f",
                color: "white",
                fontWeight: 800,
                fontSize: 12.5,
                border: "none",
                cursor: "pointer"
              }}
            >
              Score Card
            </button>
          </div>
          <div style={{ backgroundColor: "#142a45", minHeight: 120, borderTop: "2px solid #00b894" }}>
            {activeMediaTab === 'tv' ? (
              <div style={{ textAlign: "center", padding: 24, minHeight: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>📺 Live broadcast feed</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Video stream will automatically sync when match is in progress</div>
              </div>
            ) : (
              <FootballScoreCard match={match} />
            )}
          </div>
        </div>

        {/* OPEN & MATCHED BETS SECTIONS */}
        <MatchedAndOpenBets openBets={[]} matchedBets={openBets} />

        {/* RELATED EVENTS */}
        <div style={{ marginTop: 12, backgroundColor: "#fff", border: "1px solid #cbd5e1" }}>
          <div style={{ backgroundColor: "#1e3a5f", padding: "6px 10px" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>
              Related Events
            </span>
          </div>
          {[
            { id: "fb-2", title: "Nottm Forest V Coventry", team1: "Nottm Forest", team2: "Coventry", sport: "Soccer", time: "21:30" },
            { id: "fb-3", title: "Stuttgart V Dortmund", team1: "Stuttgart", team2: "Dortmund", sport: "Soccer", time: "21:30" },
            { id: "fb-4", title: "Trabzonspor V Galatasaray", team1: "Trabzonspor", team2: "Galatasaray", sport: "Soccer", time: "22:00" }
          ].map((rm, idx) => (
            <div
              key={rm.id}
              onClick={() => navigate(`/play/match/${rm.id}`, { state: { match: rm } })}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderBottom: idx < 2 ? "1px solid #e2e8f0" : "none",
                cursor: "pointer",
                backgroundColor: "#fff"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafd")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{rm.title}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{rm.time}</span>
            </div>
          ))}
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

function FootballTeamRow({ 
  name, 
  odds, 
  layOdds, 
  backSize, 
  laySize, 
  position,
  onBet 
}: { 
  name: string; 
  odds: number; 
  layOdds: number; 
  backSize?: string; 
  laySize?: string; 
  position?: number;
  onBet: (type: 'back' | 'lay', odds: number) => void 
}) {
  const hash = (name || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const displayBackSize = backSize || `${((hash % 20) / 10 + 0.5).toFixed(1)}M`;
  const displayLaySize = laySize || `${((hash % 15) / 10 + 0.2).toFixed(1)}M`;
  const hasPos = position !== undefined && position !== 0;

  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#edf4fc", borderBottom: "1px solid #c4d9ea", minHeight: 46 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "6px 12px" }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: "#1e293b", lineHeight: 1.2 }}>{name}</span>
        {hasPos && (
          <span 
            style={{ 
              fontWeight: 800, 
              fontSize: 12, 
              marginTop: 1.5,
              color: position > 0 ? "#00b181" : "#e53935",
              letterSpacing: "0.2px"
            }}
          >
            {position.toLocaleString("en-IN")}
          </span>
        )}
      </div>
      <div 
        onClick={() => onBet('back', odds)} 
        style={{ 
          width: 62, 
          backgroundColor: "#7ec8f8", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          cursor: "pointer", 
          gap: 0, 
          padding: "2px 0",
          borderLeft: "1px solid #c4d9ea",
          transition: "background-color 0.1s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#5bb5f5")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7ec8f8")}
      >
        <span style={{ fontWeight: 800, fontSize: 13.5, color: "#000", lineHeight: 1.1 }}>{odds.toFixed(2)}</span>
        <span style={{ fontSize: 9.5, color: "#333", fontWeight: 600, lineHeight: 1 }}>{displayBackSize}</span>
      </div>
      <div 
        onClick={() => onBet('lay', layOdds)} 
        style={{ 
          width: 62, 
          backgroundColor: "#fca5a5", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          cursor: "pointer", 
          gap: 0, 
          padding: "2px 0",
          borderLeft: "1px solid #c4d9ea",
          transition: "background-color 0.1s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f87171")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fca5a5")}
      >
        <span style={{ fontWeight: 800, fontSize: 13.5, color: "#000", lineHeight: 1.1 }}>{layOdds.toFixed(2)}</span>
        <span style={{ fontSize: 9.5, color: "#333", fontWeight: 600, lineHeight: 1 }}>{displayLaySize}</span>
      </div>
    </div>
  );
}

function GoalsSection({ title, underOdds, underLay, overOdds, overLay, positions, onBet }: any) {
  const goalType = title.split(' ')[1];
  const underName = `Under ${goalType}`;
  const overName = `Over ${goalType}`;

  return (
    <>
      <FootballCombinedSectionHeader title={title} />
      <FootballTeamRow 
        name={underName} 
        odds={underOdds} 
        layOdds={underLay} 
        position={positions?.[underName]}
        onBet={(t, o) => onBet(underName, t, o)} 
      />
      <FootballTeamRow 
        name={overName} 
        odds={overOdds} 
        layOdds={overLay} 
        position={positions?.[overName]}
        onBet={(t, o) => onBet(overName, t, o)} 
      />
    </>
  );
}

function FootballScoreCard({ match }: { match: any }) {
  const formatPKTDate = (timeStr: string | null | undefined): string => {
    if (!timeStr) return 'TBA';
    const s = String(timeStr);
    try {
      const d = (s.includes('T') || s.includes('Z') || /^\d{10,}$/.test(s))
        ? (/^\d{10,}$/.test(s) ? new Date(parseInt(s)) : new Date(s))
        : null;
      if (!d) return s;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        timeZone: 'Asia/Karachi'
      }).toUpperCase() + ' | ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Karachi'
      });
    } catch { return s; }
  };

  return (
    <div className="bg-[#1a1a2e] p-4 text-white flex flex-col items-center">
      <div className="text-[13px] font-bold text-white/80 mb-4">{formatPKTDate(match.match_time)}</div>
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
