
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Match, Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { MatchedAndOpenBets } from "@/components/user/MatchedAndOpenBets";
import FootballMatchDetail from "./FootballMatchDetail";
import TennisMatchDetail from "./TennisMatchDetail";
import { getClientSession } from "@/hooks/useClientAuth";
import { useToast } from "@/hooks/use-toast";
import { Volume2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { getLiveOdds, getCricketScore, oddsEngine, fetchBetfairEvents } from "@/functions";
import { CircularArcsLoader } from "@/components/ui/CircularArcsLoader";
import { calculateMarketPositions } from "@/utils/bettingPositions";
import { findMatchByIdOrTitle } from "@/utils/matchCatalog";

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
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [matchId]);

  const session = getClientSession();
  const location = useLocation();
  const stateMatch = location.state?.match || null;

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    const r = session.role?.toLowerCase()?.trim();
    if (r && r !== "client" && r !== "user" && r !== "bettor") {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [session, navigate]);

  // Fetch match details
  const { data: matchFromDB, isLoading: matchLoading_raw } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      try {
        const results = await Match.list();
        const found = (Array.isArray(results) ? results : []).find(
          (m: any) => m.id === matchId || m.betfair_event_id === matchId || String(m.id).toLowerCase() === String(matchId).toLowerCase()
        );
        if (found) return found;
      } catch (err) {
        console.debug("Match.list error:", err);
      }

      // Fallback lookup in live API events
      try {
        const liveEvents = await fetchBetfairEvents({});
        const eventMatch = (Array.isArray(liveEvents) ? liveEvents : []).find(
          (e: any) => e.id === matchId || e.betfair_event_id === matchId || String(e.id) === String(matchId)
        );
        if (eventMatch) return eventMatch;
      } catch (err) {
        console.debug("Live events lookup fallback error:", err);
      }

      // Catalog & synthesized fallback
      return findMatchByIdOrTitle(matchId || "");
    },
    enabled: !!matchId && !stateMatch,
    refetchInterval: stateMatch ? false : 8000
  });

  // Use state match (Betfair event) OR DB match OR Catalog fallback
  const match = stateMatch || matchFromDB || (matchId ? findMatchByIdOrTitle(matchId) : null);
  const matchLoading = stateMatch ? false : (matchLoading_raw && !match);

  // Fetch real-time client data
  const { data: clients, isLoading: clientLoading } = useQuery({
    queryKey: ['client-data', session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username
  });

  const { data: openBets = [] } = useQuery({
    queryKey: ['open-bets', match?.id, match?.title, matchId, session?.username],
    queryFn: async () => {
      if (!session?.username) return [];
      const userBets = await Bet.filter({ 
        user_email: session.username,
        status: 'pending'
      });
      const currentMatchId = match?.id || matchId;
      const currentTitle = match?.title?.toLowerCase()?.trim();
      return (userBets || []).filter((b: any) => {
        if (b.match_id === currentMatchId || b.match_id === matchId) return true;
        if (match?.betfair_event_id && b.match_id === match.betfair_event_id) return true;
        if (currentTitle && b.match_title && b.match_title.toLowerCase().trim() === currentTitle) return true;
        return false;
      });
    },
    enabled: !!session?.username && (!!matchId || !!match?.id),
    refetchInterval: 3000
  });

  const clientData = clients?.[0];
  const clientBalance = clientData?.cash ?? 0;

  // Fetch all matches for Related Events list
  const { data: allMatches = [] } = useQuery({
    queryKey: ['related-matches'],
    queryFn: () => Match.list(),
  });

  // AUTO-SYNC: Fetch Betfair odds → MongoDB every 3 seconds (only if match has betfair_event_id)
  const { data: syncResult } = useQuery({
    queryKey: ['betfair-sync', match?.betfair_event_id, match?.id],
    queryFn: async () => {
      const res = await oddsEngine({
        action: 'syncFromBetfair',
        matchId: match.id,
        betfairEventId: match.betfair_event_id,
      });
      return res;
    },
    enabled: !!match?.betfair_event_id && !!match?.id,
    refetchInterval: 3000,
    staleTime: 0,
  });

  // Keep liveOddsData only for Fancy Markets / Scorecard if needed, but remove polling
  const { data: liveOddsData, isLoading: liveOddsLoading } = useQuery({
    queryKey: ['live-odds', match?.betfair_event_id],
    queryFn: async () => {
      const result = await getLiveOdds({ eventId: match.betfair_event_id });
      return result;
    },
    enabled: !!match?.betfair_event_id,
    refetchInterval: 10000, // Reduced frequency for fancy markets
    staleTime: 0,
  });

  // Fetch real-time cricket score every 5 seconds (Cricbuzz or ATD)
  const { data: cricketScoreData } = useQuery({
    queryKey: ['cricket-score', match?.cricbuzz_match_id || match?.betfair_event_id || match?.atd_match_id || match?.id],
    queryFn: async () => {
      const result = await getCricketScore({ 
        matchId: match.cricbuzz_match_id || match.betfair_event_id || match.atd_match_id || match.id,
        cricbuzzMatchId: match.cricbuzz_match_id || match.betfair_event_id,
        atdMatchId: match.atd_match_id 
      });
      return result;
    },
    enabled: !!match && match?.sport?.toLowerCase() === 'cricket',
    refetchInterval: 5000,
    staleTime: 0,
  });

  const { data: mongoOddsData } = useQuery({
    queryKey: ['mongo-odds', match?.id],
    queryFn: async () => {
      const res = await oddsEngine({ action: 'getOdds', matchId: match.id });
      return res?.odds || null;
    },
    enabled: !!match?.id,
    refetchInterval: 1000,
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

  const getLiveRunner = (teamName: string, idx: number) => {
    if (!matchOddsMarket) return null;
    return matchOddsMarket.runners?.[idx] || 
      matchOddsMarket.runners?.find((r: any) => 
        r.runnerName?.toLowerCase() === teamName?.toLowerCase()
      ) || null;
  };

  // Market suspension from MongoDB
  const isMongoSuspended = mongoOddsData?.isSuspended === true;

  // Team 1 odds: MongoDB > Betfair Live > DB
  const runner1 = getLiveRunner(match?.team1, 0);
  const t1_back = mongoOddsData?.teamA_back ?? (hasLiveOdds ? (runner1?.backPrice ?? match?.back_odds) : match?.back_odds);
  const t1_lay  = mongoOddsData?.teamA_lay  ?? (hasLiveOdds ? (runner1?.layPrice  ?? match?.lay_odds)  : match?.lay_odds);

  // Team 2 odds: MongoDB > Betfair Live > DB
  const runner2 = getLiveRunner(match?.team2, 1);
  const t2_back = mongoOddsData?.teamB_back ?? (hasLiveOdds ? (runner2?.backPrice ?? (match?.back_odds2 || match?.back_odds)) : (match?.back_odds2 || match?.back_odds));
  const t2_lay  = mongoOddsData?.teamB_lay  ?? (hasLiveOdds ? (runner2?.layPrice  ?? (match?.lay_odds2 || match?.lay_odds)) : (match?.lay_odds2 || match?.lay_odds));

  // Combined suspension
  const isSuspended = isMongoSuspended || isMarketSuspended;

  // Score logic
  const liveScore = cricketScoreData?.score || liveOddsData?.score || null;
  const battingAbbr = match?.team1?.split(' ').map((w: string) => w[0]).join('').substring(0, 3).toUpperCase() || 'T1';
  
  const scoreDisplay = liveScore?.runs != null
    ? `${liveScore.battingTeam || battingAbbr} ${liveScore.runs}/${liveScore.wickets ?? '--'} (${liveScore.overs || '--'})`
    : (liveScore 
      ? `${liveScore.battingTeam || battingAbbr} ${match?.status === 'live' ? '--/--' : '--'} (--)`
      : `${battingAbbr} ${match?.status === 'live' ? '--/--' : '--'} (--)`
    );

  const crrDisplay = liveScore?.crr || (match?.status === 'live' ? '--' : '--');
  const thisOverBalls: string[] = liveScore?.thisOver || (match?.status === 'live' ? ['6', '6', '0', '4', '1'] : []);

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

      // Validate odds against MongoDB live engine
      const side = activeBet.selection === match.team1 
        ? (activeBet.betType === 'back' ? 'teamA_back' : 'teamA_lay')
        : (activeBet.betType === 'back' ? 'teamB_back' : 'teamB_lay');
      
      const validation = await oddsEngine({
        action: 'validateOdds',
        matchId: match.id,
        requestedOdds: activeBet.odds,
        side,
      });

      if (validation?.valid === false) {
        throw new Error(validation.reason || 'Odds have changed. Please refresh.');
      }

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
      queryClient.invalidateQueries({ queryKey: ['open-bets', matchId] });
      toast({
        title: "Bet Placed Successfully",
        description: `Matched on ${activeBet?.selection || ""} at ${activeBet?.odds}`,
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Bet Failed", description: error.message });
    }
  });

  if (!session) return null;
  if (matchLoading || clientLoading) {
    return (
      <div className="min-h-screen bg-[#e8eff5] relative">
        <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <CircularArcsLoader fullScreen size={110} />
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
    return (
      <>
        {isEntering && <CircularArcsLoader fullScreen size={110} />}
        <FootballMatchDetail match={match} clientData={clientData} session={session} liveOddsData={liveOddsData} />
      </>
    );
  }
  if (sport === 'tennis') {
    return (
      <>
        {isEntering && <CircularArcsLoader fullScreen size={110} />}
        <TennisMatchDetail match={match} clientData={clientData} session={session} liveOddsData={liveOddsData} />
      </>
    );
  }

  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const tabs = ["ALL", "Bookmaker", "BetFair-Fancy", "Fancy-2", "Tied Match", "Figure", "Even/Odd"];

  const safeAllMatches = Array.isArray(allMatches) ? allMatches.filter((m: any) => m.id !== match.id) : [];

  // Fancy 2 mock/sample fallback items if live feed doesn't provide them
  const fancy2Items = [
    { title: `10 Over Run ${match.team1?.substring(0, 3)?.toUpperCase() || 'T1'}`, back: 82, lay: 81, backSize: '100', laySize: '100' },
    { title: `11 Over Run Only ${match.team1?.substring(0, 3)?.toUpperCase() || 'T1'}`, suspended: true },
    { title: `20 Over Run ${match.team1?.substring(0, 3)?.toUpperCase() || 'T1'}`, back: 153, lay: 151, backSize: '100', laySize: '100' },
    { title: `6th Wkt Lost To ${match.team1?.substring(0, 3)?.toUpperCase() || 'T1'} Balls`, suspended: true },
    { title: `Azmatullah Omarzai Boundaries`, back: 5, lay: 4, backSize: '100', laySize: '100' },
    { title: `Azmatullah Omarzai Runs`, back: 33, lay: 33, backSize: '90', laySize: '110' },
    { title: `Fall of 6th Wkt ${match.team1?.substring(0, 3)?.toUpperCase() || 'T1'}`, back: 93, lay: 93, backSize: '90', laySize: '110' },
    { title: `Fall of 7th Wkt ${match.team1?.substring(0, 3)?.toUpperCase() || 'T1'}`, back: 118, lay: 118, backSize: '90', laySize: '110' },
    { title: `How Many Balls Face By Azmatullah O`, back: 19, lay: 19, backSize: '90', laySize: '110' },
    { title: `How Many Balls Face By Mohammad N`, suspended: true },
    { title: `Mohammad Nabi Boundaries`, back: 4, lay: 3, backSize: '100', laySize: '100' },
    { title: `Mohammad Nabi Runs`, back: 21, lay: 21, backSize: '90', laySize: '110' },
  ];

  // Calculate runner positions across cricket markets
  const matchOddsRunners = [match.team1, match.team2].filter(Boolean);
  const matchOddsPositions = calculateMarketPositions(matchOddsRunners, openBets as any);
  const fancyPositions = calculateMarketPositions(fancy2Items.map(f => f.title), openBets as any);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ecf0f1", display: "flex", flexDirection: "column", position: "relative" }}>
      {isEntering && <CircularArcsLoader fullScreen size={110} />}
      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* === MATCH INFO CARD (dark navy) === */}
      <div style={{ backgroundColor: "#1e3a5f", paddingBottom: 0 }}>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} color="rgba(255,255,255,0.7)" />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600 }}>
                {formatPKT(match.match_time)} | Winners: 1
              </span>
            </div>
            <span style={{ color: match.status === 'live' ? "#00e676" : "rgba(255,255,255,0.6)", fontWeight: 900, fontSize: 13, letterSpacing: 0.5 }}>
              {match.status === 'live' ? 'INPLAY' : 'UPCOMING'}
            </span>
          </div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 19, lineHeight: 1.3, margin: "4px 0" }}>{matchTitle}</h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 12 }}>Elapsed : 03:23:10</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <input type="checkbox" id="keepDisplay" checked={keepDisplayOn} onChange={(e) => setKeepDisplayOn(e.target.checked)} style={{ width: 15, height: 15, accentColor: "#00b894" }} />
            <label htmlFor="keepDisplay" style={{ color: "white", fontSize: 12, cursor: "pointer" }}>Keep Display On</label>
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ padding: "8px 10px", display: "flex", gap: 6, overflowX: "auto", backgroundColor: "rgba(0,0,0,0.25)" }} className="no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                borderRadius: 20,
                padding: "5px 14px",
                fontWeight: 800,
                fontSize: 12,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor: activeTab === tab ? "#00b894" : "rgba(255,255,255,0.12)",
                color: "white",
                transition: "all 0.15s"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* SCORE SECTION */}
      <div style={{
        backgroundColor: "#1e3a5f",
        padding: "10px 12px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        borderBottom: "2px solid #00b894",
        color: "white"
      }}>
        {/* Row 1: Score + CRR | LastBall + Sound */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: 15 }}>
              {scoreDisplay}
            </span>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700 }}>
              CRR: {crrDisplay}
            </span>
            <span style={{ color: "#00e676", fontSize: 12, fontWeight: 700 }}>
              Target: 189
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ 
              padding: "2px 8px", 
              borderRadius: 3, 
              fontWeight: 900, 
              fontSize: 11, 
              letterSpacing: 0.5,
              backgroundColor: lastBallLabel === 'NO RUN' ? '#162b47' : lastBallColor,
              color: lastBallLabel === 'NO RUN' ? 'white' : (lastBallColor === 'rgba(255,255,255,0.5)' ? '#212529' : 'white'),
            }}>
              {lastBallLabel} 📢
            </span>
            <Volume2 size={16} color="white" style={{ cursor: "pointer" }} />
          </div>
        </div>
        
        {/* Row 2: This Over balls & RRR info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 700, marginRight: 2 }}>This Over :</span>
            {thisOverBalls.map((ball, i) => <ThisOverBall key={i} value={ball} />)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
            <span>161 of 100 balls</span>
            <span style={{ color: "#ffca28" }}>RRR: 9.66</span>
          </div>
        </div>
      </div>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {/* 1. MATCH ODDS */}
        {(activeTab === "ALL" || activeTab === "Bookmaker") && (
          <div style={{ marginTop: 0 }}>
            {isMongoSuspended && (
              <div style={{ 
                backgroundColor: "#fff3cd", 
                color: "#856404", 
                padding: "8px 12px", 
                textAlign: "center", 
                fontSize: 13, 
                fontWeight: 700,
                borderBottom: "1px solid #ffeeba"
              }}>
                Market Suspended by Admin
              </div>
            )}
            <CombinedSectionHeader title="MATCH ODDS (MaxBet: 5M)" />
            <>
              <TeamRow2
                name={match.team1}
                position={matchOddsPositions[match.team1]}
                odds={t1_back}
                layOdds={t1_lay}
                backSize={hasLiveOdds ? formatSize(runner1?.backSize) : "22.6M"}
                laySize={hasLiveOdds ? formatSize(runner1?.laySize) : "7.8M"}
                loading={!!match?.betfair_event_id && liveOddsLoading && !matchOddsMarket}
                suspended={isSuspended}
                onBet={(t: any, o: any) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })}
              />
              <TeamRow2
                name={match.team2}
                position={matchOddsPositions[match.team2]}
                odds={t2_back}
                layOdds={t2_lay}
                backSize={hasLiveOdds ? formatSize(runner2?.backSize) : "1.5M"}
                laySize={hasLiveOdds ? formatSize(runner2?.laySize) : "623.3K"}
                loading={!!match?.betfair_event_id && liveOddsLoading && !matchOddsMarket}
                suspended={isSuspended}
                onBet={(t: any, o: any) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })}
              />
            </>

            {/* 2. BOOKMAKER */}
            <div style={{ marginTop: 10 }}>
              <CombinedSectionHeader title="BOOKMAKER (MaxBet: 1M)" />
              <TeamRow2
                name={match.team1}
                position={matchOddsPositions[match.team1]}
                odds={t1_back ? Number((t1_back * 0.99).toFixed(2)) : 1.18}
                layOdds={t1_lay ? Number((t1_lay * 0.99).toFixed(2)) : 1.19}
                backSize="100"
                laySize="100"
                suspended={isSuspended}
                showBook
                onBet={(t: any, o: any) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })}
              />
              <TeamRow2
                name={match.team2}
                position={matchOddsPositions[match.team2]}
                odds={t2_back ? Number((t2_back * 0.99).toFixed(2)) : 6.26}
                layOdds={t2_lay ? Number((t2_lay * 0.99).toFixed(2)) : 6.56}
                backSize="100"
                laySize="100"
                suspended={isSuspended}
                showBook
                onBet={(t: any, o: any) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })}
              />
            </div>
          </div>
        )}

        {/* 3. BETFAIR FANCY */}
        {(activeTab === "ALL" || activeTab === "BetFair-Fancy") && (
          <div style={{ marginTop: 10 }}>
            <CombinedSectionHeader title="BETFAIR FANCY (MaxBet: 2M)" />
            <TeamRow2
              name="2nd Innings 10 Overs Line"
              odds={82}
              layOdds={81}
              backSize="57.2K"
              laySize="3.2M"
              showBook
              onBet={(t: any, o: any) => setActiveBet({ match, selection: "2nd Innings 10 Overs Line", betType: t, odds: o })}
            />
          </div>
        )}

        {/* 4. FANCY 2 */}
        {(activeTab === "ALL" || activeTab === "Fancy-2") && (
          <div style={{ marginTop: 10 }}>
            <CombinedSectionHeader title="FANCY 2 (MaxBet: 2M)" />
            {fancy2Items.map((item, idx) => (
              <TeamRow2
                key={idx}
                name={item.title}
                position={fancyPositions[item.title]}
                odds={item.back}
                layOdds={item.lay}
                backSize={item.backSize}
                laySize={item.laySize}
                suspended={item.suspended || isSuspended}
                showBook
                onBet={(t: any, o: any) => setActiveBet({ match, selection: item.title, betType: t, odds: o })}
              />
            ))}
          </div>
        )}

        {/* 5. TIED MATCH */}
        {(activeTab === "ALL" || activeTab === "Tied Match") && (
          <div style={{ marginTop: 10 }}>
            <CombinedSectionHeader title="TIED MATCH (MaxBet: 500K)" />
            <TeamRow2
              name="Yes"
              odds={510}
              layOdds={undefined}
              backSize="1.6K"
              laySize=""
              onBet={(t: any, o: any) => setActiveBet({ match, selection: "Tied Match - Yes", betType: t, odds: o })}
            />
            <TeamRow2
              name="No"
              odds={undefined}
              layOdds={1.01}
              backSize=""
              laySize="26.3M"
              onBet={(t: any, o: any) => setActiveBet({ match, selection: "Tied Match - No", betType: t, odds: o })}
            />
          </div>
        )}

        {/* 6. FIGURE MARKET (10 Buttons Grid) */}
        {(activeTab === "ALL" || activeTab === "Figure") && (
          <div style={{ marginTop: 10 }}>
            <CombinedSectionHeader title={`${match.team1?.toUpperCase() || 'TEAM'} 15 OVER TOTAL LAST FIGURE (MaxBet: 100K)`} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, backgroundColor: "#c4d9ea", borderBottom: "1px solid #c4d9ea" }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <div
                  key={digit}
                  onClick={() => setActiveBet({ match, selection: `Figure ${digit}`, betType: 'back', odds: 8.85 })}
                  style={{
                    backgroundColor: "#edf4fc",
                    padding: "8px 4px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d0e7fb")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#edf4fc")}
                >
                  <span style={{ fontWeight: 900, fontSize: 16, color: "#1e3a5f" }}>{digit}</span>
                  <div style={{ backgroundColor: "#7ec8f8", borderRadius: 3, padding: "1px 6px", marginTop: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#000" }}>8.85</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. EVEN / ODD */}
        {(activeTab === "ALL" || activeTab === "Even/Odd") && (
          <div style={{ marginTop: 10 }}>
            <CombinedSectionHeader title="EVEN / ODD (MaxBet: 2M)" />
            <TeamRow2
              name="2nd Inn 15 Over Run Odd (Kalli)"
              odds={1.98}
              layOdds={2.02}
              backSize="98"
              laySize="102"
              showBook
              onBet={(t: any, o: any) => setActiveBet({ match, selection: "2nd Inn 15 Over Run Odd", betType: t, odds: o })}
            />
          </div>
        )}

        {/* === LIVE GRAPHIC / SCORECARD & TV TABS === */}
        <div style={{ marginTop: 14 }}>
          {/* Media tab switcher */}
          <div style={{ display: "flex", padding: "0 10px", gap: 6 }}>
            <button
              onClick={() => setActiveMediaTab('tv')}
              style={{
                padding: "6px 18px",
                borderRadius: "20px 20px 0 0",
                backgroundColor: activeMediaTab === 'tv' ? "#00b894" : "#1e3a5f",
                color: "white",
                fontWeight: 800,
                fontSize: 12,
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
                borderRadius: "20px 20px 0 0",
                backgroundColor: activeMediaTab === 'scorecard' ? "#00b894" : "#1e3a5f",
                color: "white",
                fontWeight: 800,
                fontSize: 12,
                border: "none",
                cursor: "pointer"
              }}
            >
              Score Card
            </button>
          </div>

          {/* Scorecard Visual Widget */}
          <div style={{
            backgroundColor: "#162b47",
            padding: "12px",
            color: "white",
            borderTop: "2px solid #00b894",
          }}>
            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}>{match.team1}</span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>INN 2 | 9.0/20 OV</span>
                <div style={{ fontWeight: 900, fontSize: 15, color: "#00e676" }}>74/5 : 221/7</div>
              </div>
              <span style={{ fontWeight: 800, fontSize: 13 }}>{match.team2}</span>
            </div>

            {/* Target calculation */}
            <div style={{ padding: "6px 0", fontSize: 11, color: "rgba(255,255,255,0.85)", textAlign: "center" }}>
              {match.team1} (74/5) require 148 runs from 66 balls.
            </div>

            {/* Graphical Run Rate & Wicket Curve */}
            <div style={{
              height: 70,
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: 4,
              marginTop: 4,
              padding: "6px",
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
              position: "relative"
            }}>
              {[4, 8, 12, 18, 25, 34, 48, 62, 74].map((runs, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  {i % 2 === 1 && (
                    <span style={{ backgroundColor: "#ff5252", color: "white", fontSize: 8, fontWeight: 900, borderRadius: "50%", width: 12, height: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>W</span>
                  )}
                  <div style={{ width: "100%", height: `${(runs / 80) * 100}%`, backgroundColor: "#00b894", borderRadius: "2px 2px 0 0" }} />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === OPEN & MATCHED BETS COMPONENT === */}
        <MatchedAndOpenBets openBets={[]} matchedBets={openBets} />

        {/* === RELATED EVENTS === */}
        <div style={{ marginTop: 14 }}>
          <div style={{ backgroundColor: "#1e3a5f", padding: "6px 12px" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>
              Related Events
            </span>
          </div>
          {safeAllMatches.slice(0, 5).map((rm: any) => (
            <div
              key={rm.id}
              onClick={() => navigate(`/play/match/${rm.id}`, { state: { match: rm } })}
              style={{
                backgroundColor: "#fff",
                borderBottom: "1px solid #dbe3ec",
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafd")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
            >
              <span style={{ fontWeight: 700, fontSize: 12, color: "#1e293b" }}>
                {rm.title || `${rm.team1} v ${rm.team2}`}
              </span>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                {formatPKT(rm.match_time)}
              </span>
            </div>
          ))}
        </div>
      </main>

      <BetSlip bet={activeBet} onClose={() => setActiveBet(null)} onSubmit={(stake) => placeBet(stake)} isSubmitting={isSubmitting} />
    </div>
  );
}

function CombinedSectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#1e3a5f" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px" }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#00b894", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 10, fontWeight: 900 }}>⏰</span>
        </div>
        <span style={{ color: "white", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.3 }}>{title}</span>
        <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4 }}>
          <span style={{ fontSize: 9, color: "#1e3a5f", fontWeight: 900, fontStyle: "italic", fontFamily: "serif" }}>i</span>
        </div>
      </div>
      <div style={{ display: "flex", flexShrink: 0 }}>
        <div style={{ width: 62, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#162b47", borderLeft: "1px solid rgba(255,255,255,0.12)", padding: "5px 0" }}>
          <span style={{ color: "white", fontWeight: 900, fontSize: 11, letterSpacing: 1 }}>BACK</span>
        </div>
        <div style={{ width: 62, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#162b47", borderLeft: "1px solid rgba(255,255,255,0.12)", padding: "5px 0" }}>
          <span style={{ color: "white", fontWeight: 900, fontSize: 11, letterSpacing: 1 }}>LAY</span>
        </div>
      </div>
    </div>
  );
}

function TeamRow2({ 
  name, 
  odds, 
  layOdds, 
  backSize, 
  laySize, 
  loading, 
  suspended, 
  showBook, 
  position,
  onBet 
}: any) {
  const hash = (name || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const defaultBack = `${((hash % 30) / 10 + 0.5).toFixed(1)}M`;
  const defaultLay = `${((hash % 20) / 10 + 0.2).toFixed(1)}M`;
  const displayBackSize = backSize !== undefined ? backSize : defaultBack;
  const displayLaySize = laySize !== undefined ? laySize : defaultLay;
  const hasPos = position !== undefined && position !== 0;

  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#edf4fc", borderBottom: "1px solid #c4d9ea", minHeight: 46 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "4px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "#1e293b", lineHeight: 1.2 }}>{name}</span>
          {showBook && (
            <span style={{ color: "#00b894", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Book</span>
          )}
        </div>
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
            {position > 0 ? position.toLocaleString("en-IN") : position.toLocaleString("en-IN")}
          </span>
        )}
      </div>
      {suspended ? (
        <div style={{ width: 124, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fce8e6", borderLeft: "1px solid #c4d9ea" }}>
          <span style={{ color: "#e53935", fontWeight: 900, fontSize: 11, letterSpacing: 0.5 }}>SUSPENDED</span>
        </div>
      ) : (
        <>
          <div
            onClick={() => odds && onBet('back', odds)}
            style={{
              width: 62,
              backgroundColor: "#7ec8f8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: odds ? "pointer" : "default",
              borderLeft: "1px solid #c4d9ea",
              padding: "2px 0",
              transition: "background-color 0.1s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#5bb5f5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7ec8f8")}
          >
            <span style={{ fontWeight: 800, fontSize: 13.5, color: "#000" }}>{odds ? odds : '-'}</span>
            <span style={{ fontSize: 9.5, color: "#333", fontWeight: 600 }}>{displayBackSize}</span>
          </div>
          <div
            onClick={() => layOdds && onBet('lay', layOdds)}
            style={{
              width: 62,
              backgroundColor: "#fca5a5",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: layOdds ? "pointer" : "default",
              borderLeft: "1px solid #c4d9ea",
              padding: "2px 0",
              transition: "background-color 0.1s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f87171")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fca5a5")}
          >
            <span style={{ fontWeight: 800, fontSize: 13.5, color: "#000" }}>{layOdds ? layOdds : '-'}</span>
            <span style={{ fontSize: 9.5, color: "#333", fontWeight: 600 }}>{displayLaySize}</span>
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
