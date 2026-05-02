import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Match, Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import FootballMatchDetail from "./FootballMatchDetail";
import TennisMatchDetail from "./TennisMatchDetail";
import { getClientSession } from "@/hooks/useClientAuth";
import { useToast } from "@/hooks/use-toast";
import { Volume2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { getLiveOdds, getCricketScore } from "@/functions";

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keepDisplayOn, setKeepDisplayOn] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState<'tv'|'scorecard'>('tv');

  const session = getClientSession();
  const location = useLocation();
  const stateMatch = location.state?.match || null;

  useEffect(() => {
    if (!session || session.role !== 'client') {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);

  // Fetch match details
  const { data: matchFromDB, isLoading: matchLoading_raw } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const results = await Match.list();
      return results.find((m: any) => m.id === matchId);
    },
    enabled: !!matchId && !stateMatch,
    refetchInterval: stateMatch ? false : 4000
  });

  // Use state match (Betfair event) OR DB match
  const match = stateMatch || matchFromDB;
  const matchLoading = stateMatch ? false : matchLoading_raw;

  // Fetch real-time client data
  const { data: clients, isLoading: clientLoading } = useQuery({
    queryKey: ['client-data', session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username
  });

  const { data: openBets = [] } = useQuery({
    queryKey: ['open-bets', matchId, session?.username],
    queryFn: () => Bet.filter({ 
      user_email: session?.username,
      match_id: matchId,
      status: 'pending'
    }),
    enabled: !!session?.username && !!matchId,
    refetchInterval: 5000
  });

  const clientData = clients?.[0];
  const clientBalance = clientData?.cash ?? 0;

  // Fetch live odds from Betfair/OrbitExch every 1 second
  const { data: liveOddsData, isLoading: liveOddsLoading } = useQuery({
    queryKey: ['live-odds', match?.betfair_event_id],
    queryFn: async () => {
      const result = await getLiveOdds({ eventId: match.betfair_event_id });
      return result;
    },
    enabled: !!match?.betfair_event_id,
    refetchInterval: 1000,
    staleTime: 0,
  });

  // Fetch real-time cricket score from Cricbuzz every 5 seconds
  const { data: cricketScoreData } = useQuery({
    queryKey: ['cricket-score', match?.cricbuzz_match_id],
    queryFn: async () => {
      const result = await getCricketScore({ matchId: match.cricbuzz_match_id });
      return result;
    },
    enabled: !!match?.cricbuzz_match_id && match?.sport?.toLowerCase() === 'cricket',
    refetchInterval: 5000,
    staleTime: 0,
  });

  // Extract Match Odds market
  const matchOddsMarket = liveOddsData?.markets?.find((m: any) =>
    m.marketName?.toLowerCase().includes('match odds') || m.marketName?.toLowerCase().includes('match_odds')
  ) || liveOddsData?.markets?.[0];

  const fancyMarkets = liveOddsData?.markets?.filter((m: any) => 
    !m.marketName?.toLowerCase().includes('match odds') && 
    !m.marketName?.toLowerCase().includes('match_odds')
  ) || [];

  const isMarketSuspended = matchOddsMarket?.status === 'SUSPENDED' || matchOddsMarket?.status === 'CLOSED';
  const hasLiveOdds = !!match?.betfair_event_id && !!matchOddsMarket;

  // Score logic
  const liveScore = cricketScoreData?.score || liveOddsData?.score || null;
  const battingAbbr = match.team1?.split(' ').map((w: string) => w[0]).join('').substring(0, 3).toUpperCase() || 'T1';
  
  const scoreDisplay = liveScore?.runs != null
    ? `${liveScore.battingTeam || battingAbbr} ${liveScore.runs}/${liveScore.wickets ?? '--'} (${liveScore.overs || '--'})`
    : (liveScore 
      ? `${liveScore.battingTeam || battingAbbr} ${match.status === 'live' ? '--/--' : '--'} (--)`
      : `${battingAbbr} ${match.status === 'live' ? '--/--' : '--'} (--)`
    );

  const crrDisplay = liveScore?.crr || (match.status === 'live' ? '--' : '--');
  const thisOverBalls: string[] = liveScore?.thisOver || (match.status === 'live' ? ['6', '6', '0', '4', '1'] : []);

  // Last ball label and color
  const lastBall = liveScore?.lastBall || (thisOverBalls.length > 0 ? thisOverBalls[thisOverBalls.length - 1] : null);
  const getLastBallLabel = (ball: string | null) => {
    if (!ball) return 'NO RUN';
    const b = String(ball);
    if (b === '6') return 'SIX';
    if (b === '4') return 'FOUR';
    if (b === 'W' || b === 'w') return 'WICKET';
    if (b.includes('w')) return 'WIDE';
    if (b === '0') return 'NO RUN';
    return `${b} RUN${b !== '1' ? 'S' : ''}`;
  };
  const lastBallLabel = getLastBallLabel(lastBall);
  const lastBallColor = lastBallLabel === 'SIX' ? '#00e676' 
    : lastBallLabel === 'FOUR' ? '#ffca28'
    : lastBallLabel === 'WICKET' ? '#ff5252'
    : lastBallLabel === 'WIDE' ? '#ff9800'
    : 'rgba(255,255,255,0.5)';

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
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Karachi'
        });
      }
      return s.length > 5 ? s.substring(0, 5) : s;
    } catch { return s; }
  };

  // Place bet mutation
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
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Bet Failed", description: error.message });
    }
  });

  if (!session) return null;
  if (matchLoading || clientLoading) {
    return (
      <div className="min-h-screen bg-[#ecf0f1] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#254465] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!match) {
    return (
      <div className="min-h-screen bg-[#ecf0f1] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-[#254465] mb-2">Match Not Found</h2>
        <button onClick={() => navigate('/play')} className="text-[#16a085] font-bold underline">Back to Dashboard</button>
      </div>
    );
  }

  // Detect sport and render correct page
  const sport = match?.sport?.toLowerCase() || '';
  if (sport === 'football' || sport === 'soccer') {
    return <FootballMatchDetail match={match} clientData={clientData} session={session} liveOddsData={liveOddsData} />;
  }
  if (sport === 'tennis') {
    return <TennisMatchDetail match={match} clientData={clientData} session={session} liveOddsData={liveOddsData} />;
  }

  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const tabs = ["ALL", "Bookmaker", "BetFair-Fancy", "Fancy-2"];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ecf0f1", display: "flex", flexDirection: "column" }}>
      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* === MATCH INFO CARD (dark navy) === */}
      <div style={{ backgroundColor: "#254465", paddingBottom: 0 }}>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} color="rgba(255,255,255,0.6)" />
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                Starts at: {formatPKT(match.match_time)} | Winners: 1
              </span>
            </div>
            <span style={{ color: match.status === 'live' ? "#00b181" : "rgba(255,255,255,0.5)", fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>
              {match.status === 'live' ? 'INPLAY' : match.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED'}
            </span>
          </div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 20, lineHeight: 1.3, margin: "6px 0" }}>{matchTitle}</h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Elapsed : 00:19:42</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <input type="checkbox" checked={keepDisplayOn} onChange={(e) => setKeepDisplayOn(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
            <span style={{ color: "white", fontSize: 13 }}>Keep Display On</span>
          </div>
        </div>

        <div style={{ padding: "10px 12px", display: "flex", gap: 8, overflowX: "auto", backgroundColor: "rgba(0,0,0,0.2)" }} className="no-scrollbar">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ borderRadius: 50, padding: "6px 16px", fontWeight: 700, fontSize: 13, border: "2px solid rgba(255,255,255,0.2)", cursor: "pointer", whiteSpace: "nowrap", backgroundColor: activeTab === tab ? "#00b181" : "transparent", color: "white", transition: "background-color 0.2s" }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* SCORE SECTION — shows below tabs, above match odds */}
      <div style={{
        backgroundColor: "#ecf0f1",
        padding: "8px 12px",
        borderBottom: "2px solid #00b181"
      }}>
        {/* Row 1: Score + CRR | LastBall + Sound */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#212529", fontWeight: 900, fontSize: 15 }}>
              {scoreDisplay}
            </span>
            <span style={{ color: "#6c757d", fontSize: 13, fontWeight: 700 }}>
              CRR: {crrDisplay}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Last ball indicator */}
            <span style={{ 
              padding: "2px 10px", 
              borderRadius: 4, 
              fontWeight: 900, 
              fontSize: 12, 
              letterSpacing: 0.5,
              backgroundColor: lastBallLabel === 'NO RUN' ? '#254465' : lastBallColor,
              color: lastBallLabel === 'NO RUN' ? 'white' : (lastBallColor === 'rgba(255,255,255,0.5)' ? '#212529' : 'white'),
            }}>
              {lastBallLabel}
            </span>
            <Volume2 size={16} color="#6c757d" style={{ cursor: "pointer" }} />
          </div>
        </div>
        
        {/* Row 2: This Over balls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <span style={{ color: "#6c757d", fontSize: 12, fontWeight: 700, marginRight: 2 }}>This Over :</span>
          {thisOverBalls.map((ball, i) => <ThisOverBall key={i} value={ball} />)}
        </div>
      </div>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        {(activeTab === "ALL" || activeTab === "Bookmaker") && (
          <div style={{ marginTop: 0 }}>
            <CombinedSectionHeader title="MATCH ODDS (MaxBet: 5M)" />
            {(() => {
              const runner1 = getLiveRunner(match.team1, 0);
              const runner2 = getLiveRunner(match.team2, 1);
              return (
                <>
                  <TeamRow2
                    name={match.team1}
                    odds={hasLiveOdds ? (runner1?.backPrice ?? match.back_odds) : match.back_odds}
                    layOdds={hasLiveOdds ? (runner1?.layPrice ?? match.lay_odds) : match.lay_odds}
                    backSize={hasLiveOdds ? formatSize(runner1?.backSize) : undefined}
                    laySize={hasLiveOdds ? formatSize(runner1?.laySize) : undefined}
                    loading={!!match?.betfair_event_id && liveOddsLoading && !matchOddsMarket}
                    suspended={isMarketSuspended}
                    onBet={(t, o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })}
                  />
                  <TeamRow2
                    name={match.team2}
                    odds={hasLiveOdds ? (runner2?.backPrice ?? (match.back_odds2 || match.back_odds)) : (match.back_odds2 || match.back_odds)}
                    layOdds={hasLiveOdds ? (runner2?.layPrice ?? (match.lay_odds2 || match.lay_odds)) : (match.lay_odds2 || match.lay_odds)}
                    backSize={hasLiveOdds ? formatSize(runner2?.backSize) : undefined}
                    laySize={hasLiveOdds ? formatSize(runner2?.laySize) : undefined}
                    loading={!!match?.betfair_event_id && liveOddsLoading && !matchOddsMarket}
                    suspended={isMarketSuspended}
                    onBet={(t, o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })}
                  />
                </>
              );
            })()}

            {/* Bookmaker section (ALL or Bookmaker) */}
            <div style={{ marginTop: 15 }}>
              <CombinedSectionHeader title="BOOKMAKER (MaxBet: 1M)" />
              <TeamRow2
                name={match.team1}
                odds={(hasLiveOdds ? (getLiveRunner(match.team1, 0)?.backPrice ?? match.back_odds) : match.back_odds) * 0.99}
                layOdds={(hasLiveOdds ? (getLiveRunner(match.team1, 0)?.layPrice ?? match.lay_odds) : match.lay_odds) * 0.99}
                onBet={(t, o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })}
              />
              <TeamRow2
                name={match.team2}
                odds={(hasLiveOdds ? (getLiveRunner(match.team2, 1)?.backPrice ?? (match.back_odds2 || match.back_odds)) : (match.back_odds2 || match.back_odds)) * 0.99}
                layOdds={(hasLiveOdds ? (getLiveRunner(match.team2, 1)?.layPrice ?? (match.lay_odds2 || match.lay_odds)) : (match.lay_odds2 || match.lay_odds)) * 0.99}
                onBet={(t, o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })}
              />
            </div>
          </div>
        )}

        {(activeTab === "ALL" || activeTab === "BetFair-Fancy" || activeTab === "Fancy-2") && (
          <div style={{ marginTop: 15 }}>
            {fancyMarkets.length > 0 ? (
              fancyMarkets.map((market: any) => (
                <div key={market.marketId} style={{ marginBottom: 15 }}>
                  <CombinedSectionHeader title={market.marketName || 'FANCY MARKET'} />
                  {market.runners?.map((runner: any) => (
                    <TeamRow2
                      key={runner.selectionId}
                      name={runner.runnerName}
                      odds={runner.backPrice}
                      layOdds={runner.layPrice}
                      backSize={formatSize(runner.backSize)}
                      laySize={formatSize(runner.laySize)}
                      suspended={market.status === 'SUSPENDED' || market.status === 'CLOSED'}
                      onBet={(t, o) => setActiveBet({ match, selection: runner.runnerName, betType: t, odds: o })}
                    />
                  ))}
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                No Fancy markets available for this match.
              </div>
            )}
          </div>
        )}
      </main>

      <BetSlip bet={activeBet} onClose={() => setActiveBet(null)} onSubmit={(stake) => placeBet(stake)} isSubmitting={isSubmitting} />
    </div>
  );
}

function CombinedSectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#254465" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "5px 10px" }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#00b181", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 11, fontWeight: 900 }}>$</span>
        </div>
        <span style={{ color: "white", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.3 }}>{title}</span>
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

function TeamRow2({ name, odds, layOdds, backSize, laySize, loading, suspended, onBet }: any) {
  const displayBackSize = backSize || `${(Math.random() * 3 + 0.5).toFixed(1)}M`;
  const displayLaySize = laySize || `${(Math.random() * 2 + 0.2).toFixed(1)}M`;
  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#edf4fc", borderBottom: "1px solid #c4d9ea", minHeight: 44 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "6px 12px" }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#212529" }}>{name}</span>
      </div>
      {suspended ? (
        <div style={{ width: 120, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f0e0e0" }}>
          <span style={{ color: "#dc3545", fontWeight: 900, fontSize: 11 }}>SUSPENDED</span>
        </div>
      ) : (
        <>
          <div onClick={() => onBet('back', odds)} style={{ width: 60, backgroundColor: "#a5d9fe", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", borderLeft: "1px solid #c4d9ea" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{odds?.toFixed(2)}</span>
            <span style={{ fontSize: 9, color: "#666" }}>{displayBackSize}</span>
          </div>
          <div onClick={() => onBet('lay', layOdds)} style={{ width: 60, backgroundColor: "#f8d0ce", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", borderLeft: "1px solid #c4d9ea" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{layOdds?.toFixed(2)}</span>
            <span style={{ fontSize: 9, color: "#666" }}>{displayLaySize}</span>
          </div>
        </>
      )}
    </div>
  );
}

function ThisOverBall({ value }: { value: string }) {
  const v = String(value);
  const bg = v === '6' ? '#00e676' 
    : v === '4' ? '#ffca28' 
    : v === 'W' || v === 'w' || v === 'Wd' ? '#ff5252' 
    : v.includes('w') ? '#ff9800'
    : '#fff';
  const textColor = (v === '6' || v === '4' || v === '0' || !isNaN(Number(v))) ? '#212529' : 'white';
  const borderColor = (v === '0' || !isNaN(Number(v))) ? '#dee2e6' : 'transparent';
  
  return (
    <div style={{ 
      minWidth: 22, height: 22, borderRadius: '50%', 
      backgroundColor: bg, color: textColor, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      fontSize: 9, fontWeight: 900, border: `1px solid ${borderColor}`,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      {v}
    </div>
  );
}
