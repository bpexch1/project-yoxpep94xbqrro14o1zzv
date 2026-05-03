























import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Match, Bet, Client } from "@/entities";
import { fetchBetfairEvents, oddsEngine, fetchAtdCricketHome } from "@/functions";
import { UserHeader } from "@/components/user/UserHeader";
import { BettingMatchCard } from "@/components/user/BettingMatchCard";
import { BetSlip } from "@/components/user/BetSlip";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { GameBanners } from "@/components/user/GameBanners";
import { CasinoSection } from "@/components/user/CasinoSection";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Trophy, 
} from "lucide-react";

const SportIcon = ({ sport, color = "white", size = 22 }: { sport: string, color?: string, size?: number }) => {
  const s = sport.toLowerCase();
  const props = {
    width: size, height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { display: 'block' }
  };

  if (s.includes('inplay') || s.includes('live')) {
    // Stopwatch icon
    return (
      <svg {...props}>
        <circle cx="12" cy="14" r="8"/>
        <path d="M10 3h4"/>
        <path d="M12 3v3"/>
        <polyline points="12,10 12,14 15,16"/>
      </svg>
    );
  }
  
  if (s.includes('cricket')) {
    // Cricket bat + wicket stumps (3 stumps + 2 bails + diagonal bat)
    return (
      <svg {...props}>
        {/* 3 wicket stumps */}
        <line x1="14" y1="9" x2="14" y2="22"/>
        <line x1="17" y1="8" x2="17" y2="21"/>
        <line x1="20" y1="9" x2="20" y2="22"/>
        {/* Bails on top of stumps */}
        <line x1="13.5" y1="9.5" x2="17.5" y2="8.5"/>
        <line x1="16.5" y1="8.5" x2="20.5" y2="9.5"/>
        {/* Cricket bat - diagonal, wider blade at bottom-left */}
        <path d="M2 22L14 6" strokeWidth="3.5"/>
        <path d="M2 22L4 20" strokeWidth="2"/>
      </svg>
    );
  }

  if (s.includes('tennis')) {
    // Tennis racket — oval head with string lines, handle
    return (
      <svg {...props}>
        <ellipse cx="12" cy="9" rx="5.5" ry="7"/>
        <line x1="6.5" y1="7" x2="17.5" y2="7"/>
        <line x1="6" y1="10.5" x2="18" y2="10.5"/>
        <line x1="10" y1="2.2" x2="10" y2="15.8"/>
        <line x1="14" y1="2.2" x2="14" y2="15.8"/>
        <line x1="12" y1="16" x2="12" y2="22"/>
        <line x1="10" y1="20" x2="14" y2="20"/>
      </svg>
    );
  }

  if (s.includes('soccer') || s.includes('football')) {
    // Soccer ball — circle with pentagon patches
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9.5"/>
        <polygon points="12,5.5 14.5,8 13.5,11 10.5,11 9.5,8" fill={color} stroke={color} strokeWidth="0.5"/>
        <line x1="12" y1="2.5" x2="12" y2="5.5"/>
        <line x1="19" y1="7.5" x2="14.5" y2="8"/>
        <line x1="17" y1="20" x2="13.5" y2="17.5"/>
        <line x1="7" y1="20" x2="10.5" y2="17.5"/>
        <line x1="5" y1="7.5" x2="9.5" y2="8"/>
        <line x1="10.5" y1="11" x2="7" y2="20"/>
        <line x1="13.5" y1="11" x2="17" y2="20"/>
        <line x1="9.5" y1="8" x2="5" y2="7.5"/>
        <line x1="14.5" y1="8" x2="19" y2="7.5"/>
      </svg>
    );
  }

  // Default circle
  return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState(() => {
    if (location.pathname === "/casino") return "Casino";
    return location.state?.activeFilter || "Inplay";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === "/casino") {
      setActiveFilter("Casino");
    } else if (location.state?.activeFilter) {
      setActiveFilter(location.state.activeFilter);
    }
  }, [location.pathname, location.state]);
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);

  const session = getClientSession();

  useEffect(() => {
    if (!session || session.role !== 'client') {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);

  // Fetch matches from DB
  const { data: matches, isLoading: matchesLoading, isError: matchesError } = useQuery({
    queryKey: ['matches'],
    queryFn: () => Match.list(),
    refetchInterval: 15000, // Refresh list every 15 seconds
    retry: 2
  });

  // Fetch live Betfair events from API
  const { data: betfairEvents, isLoading: betfairLoading, isError: betfairError } = useQuery({
    queryKey: ['betfair-events'],
    queryFn: async () => {
      try {
        return await fetchBetfairEvents({});
      } catch (err) {
        console.debug("Failed to fetch betfair events:", err);
        return [];
      }
    },
    refetchInterval: 60000, // Refresh every 60 seconds
    retry: 1
  });

  // Fetch live ATD Cricket matches from API
  const { data: atdData, isLoading: atdLoading, isError: atdError } = useQuery({
    queryKey: ['atd-cricket-home'],
    queryFn: async () => {
      try {
        return await fetchAtdCricketHome({});
      } catch (err) {
        console.debug("Failed to fetch atd cricket:", err);
        return { matches: [] };
      }
    },
    refetchInterval: 60000,
    retry: 1
  });

  // Auto-sync Betfair odds for all visible matches every 15 seconds
  const matchesWithBetfair = (matches || []).filter((m: any) => 
    m.betfair_event_id && 
    !String(m.id).startsWith('atd-') && 
    m.betfair_event_id !== 'undefined' && 
    m.betfair_event_id !== ''
  );

  useQuery({
    queryKey: ['betfair-bulk-sync', matchesWithBetfair.map((m: any) => m.id).join(',')],
    queryFn: async () => {
      if (matchesWithBetfair.length === 0) return { success: true, skipped: true };
      try {
        // Only sync up to 10 matches to avoid large payloads/timeout
        const syncMatches = matchesWithBetfair.slice(0, 10).map((m: any) => ({
          matchId: m.id,
          betfairEventId: m.betfair_event_id
        }));

        await oddsEngine({
          action: 'syncAllFromBetfair',
          matches: syncMatches
        });
        return { success: true };
      } catch (err) {
        // Silent failure for background sync - do not log as error to avoid user-facing error messages
        console.debug("Background bulk sync skipped or failed:", err);
        return { success: false, error: "Failed to fetch" };
      }
    },
    // Only sync if we have matches to sync AND we have some betfair events loaded
    // to avoid hammering Betfair/MongoDB unnecessarily
    enabled: matchesWithBetfair.length > 0 && !!betfairEvents,
    refetchInterval: 15000,  // every 15 seconds
    retry: false,            // do not retry background sync on failure
    staleTime: 5000,
    gcTime: 0,               // don't keep this data in cache
  });

  // Fetch real-time client data for balance and credits
  const { data: clients, isLoading: clientLoading } = useQuery({
    queryKey: ['client-data', session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username
  });

  const clientData = clients?.[0];
  const clientBalance = clientData?.cash ?? 0;

  // Place bet mutation
  const { mutate: placeBet, isPending: isSubmitting } = useMutation({
    mutationFn: async (stake: number) => {
      if (!activeBet || !session || !clientData) return;

      if (stake > clientBalance) {
        throw new Error("Insufficient balance");
      }

      const potentialWin = (stake * activeBet.odds) - stake;

      // Create bet record
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

      // Deduct from client balance
      await Client.update(clientData.id, {
        cash: clientBalance - stake
      });
    },
    onSuccess: () => {
      setActiveBet(null);
      queryClient.invalidateQueries({ queryKey: ['client-data'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Bet Failed",
        description: error.message || "Could not place bet. Please try again.",
      });
    }
  });

  // Helper to normalize match data for UI
  const normalizeMatch = (m: any) => {
    const status = String(m.status || m.api_status || '').toLowerCase();
    const isLive = status === 'live' || status === 'inplay' || status === 'started' || status === '1' || status === '2';
    
    // Guess sport if missing
    let sport = m.sport || '';
    if (!sport) {
      const title = (m.title || '').toLowerCase();
      if (title.includes('cricket')) sport = 'Cricket';
      else if (title.includes('soccer') || title.includes('football')) sport = 'Soccer';
      else if (title.includes('tennis')) sport = 'Tennis';
    }

    // Normalize sport names
    if (sport.toLowerCase() === 'football') sport = 'Soccer';

    return {
      ...m,
      sport: sport || 'Others',
      status: isLive ? 'live' : 'upcoming'
    };
  };

  // Filter the match list to only show real matches:
  // 1. Matches directly from Betfair API
  // 2. Matches from AllThingsDev Cricket API
  // 3. DB matches that have a betfair_event_id OR are manually created cricket matches
  const now = new Date();
  const matchesList = [
    ...(betfairEvents || []).map(normalizeMatch),
    ...(atdData?.matches || []).map(normalizeMatch).filter((atd: any) => {
      // Don't duplicate if already in Betfair (check by title keyword overlap)
      return !(betfairEvents || []).some((bf: any) => {
        const t1 = atd.team1?.toLowerCase() || '';
        const t2 = atd.team2?.toLowerCase() || '';
        if (!t1 || !t2) return false;
        return bf.title.toLowerCase().includes(t1) && bf.title.toLowerCase().includes(t2);
      });
    }),
    ...(matches || []).map(normalizeMatch).filter((m: any) => {
      // Only include DB matches that have a real betfair_event_id (admin linked to real event)
      // This ensures we only show matches that the user explicitly wants to track via feed
      
      const isExternal = String(m.id).startsWith('bf-') || String(m.id).startsWith('atd-');
      if (isExternal) return false; // Already coming from API sources above

      // Exclude matches that don't have a linked feed ID - these are likely the "fake" matches
      if (!m.betfair_event_id || m.betfair_event_id === 'undefined' || m.betfair_event_id === '') return false;

      // Exclude completed or stale matches
      if (m.status === 'completed' || m.status === 'finished') return false;

      // If it has a match_time, exclude if it's more than 6 hours old and not live
      if (m.match_time && m.status !== 'live') {
        try {
          const matchDate = new Date(m.match_time);
          if (isNaN(matchDate.getTime())) return true;
          const diffHours = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
          if (diffHours > 6) return false;
        } catch {
          // skip
        }
      }

      // Check if we already have it from Betfair API to avoid duplicates
      const isDuplicate = (betfairEvents || []).some((bf: any) => 
        bf.betfair_event_id === m.betfair_event_id || bf.id === m.betfair_event_id
      );
      if (isDuplicate) return false;

      return true;
    })
  ].filter((m: any) => {
    // Final filter: only real sports the user wants
    const sport = m.sport?.toLowerCase();
    return sport === 'cricket' || sport === 'soccer' || sport === 'tennis';
  }).sort((a: any, b: any) => {
    // Live first, then upcoming
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    
    // Then sort by time if available
    const timeA = a.match_time ? new Date(a.match_time).getTime() : 0;
    const timeB = b.match_time ? new Date(b.match_time).getTime() : 0;
    return timeA - timeB;
  });
  
  const inplayCount = matchesList.filter((m: any) => m.status === 'live').length;
  const cricketCount = matchesList.filter((m: any) => m.sport?.toLowerCase() === 'cricket').length;
  const tennisCount = matchesList.filter((m: any) => m.sport?.toLowerCase() === 'tennis').length;
  const soccerCount = matchesList.filter((m: any) => m.sport?.toLowerCase() === 'football' || m.sport?.toLowerCase() === 'soccer').length;

  // Auto-switch away from Inplay if it's empty but other sports have matches
  useEffect(() => {
    if (activeFilter === "Inplay") {
      // If we have data from at least one source and inplay is 0, but others exist, switch.
      // We wait for primary API calls to finish or fail before deciding to switch.
      const isLoadingSources = matchesLoading || betfairLoading || atdLoading;
      if (inplayCount === 0 && !isLoadingSources) {
        if (cricketCount > 0) setActiveFilter("Cricket");
        else if (soccerCount > 0) setActiveFilter("Soccer");
        else if (tennisCount > 0) setActiveFilter("Tennis");
      }
    }
  }, [inplayCount, cricketCount, soccerCount, tennisCount, matchesLoading, betfairLoading, atdLoading, activeFilter]);

  if (!session) return null;

  const isInitialLoading = (matchesLoading && !matches) || (betfairLoading && !betfairEvents) || (atdLoading && !atdData);

  if (isInitialLoading && matchesList.length === 0) {
    return (
      <div className="min-h-screen bg-[#ecf0f1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#254465] animate-spin" />
          <p className="text-xs font-bold text-[#254465]/60 uppercase tracking-widest animate-pulse">Loading Live Markets...</p>
        </div>
      </div>
    );
  }

  const categories = [
    { id: "Inplay", label: "Inplay", count: inplayCount },
    { id: "Cricket", label: "Cricket", count: cricketCount },
    { id: "Tennis", label: "Tennis", count: tennisCount },
    { id: "Soccer", label: "Soccer", count: soccerCount },
  ];

  const filteredMatches = matchesList.filter((m: any) => {
    const status = String(m.status || '').toLowerCase();
    const isLive = status === 'live' || status === 'inplay';

    if (activeFilter === "Inplay") return isLive;
    
    const sport = m.sport?.toLowerCase();
    const filter = activeFilter.toLowerCase();
    if (filter === 'soccer') return sport === 'football' || sport === 'soccer';
    return sport === filter;
  });

  const displayMatches = filteredMatches;

  const groupedMatches = displayMatches.reduce((acc: any, match: any) => {
    const sport = match.sport || 'Others';
    if (!acc[sport]) acc[sport] = [];
    acc[sport].push(match);
    return acc;
  }, {});

  const handleSelectBet = (match: any, selection: string, betType: 'back' | 'lay', odds: number) => {
    setActiveBet({ match, selection, betType, odds });
  };

  return (
    <div className="min-h-screen text-[#212529]" style={{ 
      fontFamily: '"Roboto Condensed", HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif',
      backgroundColor: '#edf2f7'
    }}>
      <UserHeader 
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Account Info Bar */}
      <div
        style={{
          backgroundColor: "#254465",
          padding: "7px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          fontSize: 13,
          color: "white",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span>Credit: <strong>{clientData?.credit_received ?? 0}</strong></span>
        <span>Balance: <strong>{clientBalance.toLocaleString('en-IN')}</strong></span>
        <span>Liable: <strong>0</strong></span>
        <span>Active Bets: <strong>*</strong></span>
      </div>

      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onFilterChange={setActiveFilter}
      />
      
      <main className="flex flex-col">
        {/* Game Banners */}
        <GameBanners onFilterChange={setActiveFilter} />

        {/* Bottom Tabs - Inline Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", width: "100%" }}>
          {categories.map((cat) => {
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 4px",
                  backgroundColor: isActive ? "#00b181" : "#254465",
                  border: "none",
                  borderRight: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  minHeight: 62,
                }}
              >
                {/* Count number at top */}
                <span style={{ 
                  color: 'white', 
                  fontSize: 14, 
                  fontWeight: 900, 
                  lineHeight: 1, 
                  marginBottom: 4 
                }}>
                  {cat.count}
                </span>
                
                {/* Sport icon */}
                <div style={{ marginBottom: 4 }}>
                   <SportIcon sport={cat.id} color="white" size={22} />
                </div>

                {/* Label */}
                <span style={{
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  opacity: isActive ? 1 : 0.85,
                  textTransform: 'uppercase'
                }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        {activeFilter === "Casino" || activeFilter === "Horse Race" || activeFilter === "Greyhound" ? (
          <CasinoSection title={activeFilter === "Casino" ? "Premium Casino" : `${activeFilter} Feed`} />
        ) : (
          <div className="flex flex-col">
            {Object.entries(groupedMatches).map(([sport, sportMatches]: [string, any]) => {
              const liveMatches = sportMatches.filter((m: any) => m.status === 'live');
              const upcomingMatches = sportMatches.filter((m: any) => m.status !== 'live');

              return (
                <div key={sport} className="flex flex-col">
                  {/* Sport section header */}
                  <div
                    style={{
                      backgroundColor: "#e8eef4",
                      borderBottom: "1px solid #ccd9e5",
                      padding: "5px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display:'inline-block', verticalAlign:'middle' }}>
                        <SportIcon sport={sport} color="#444" size={16} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#212529" }}>{sport}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>Matched</span>
                  </div>
                  
                  <div className="flex flex-col">
                    {/* Live Section */}
                    {liveMatches.length > 0 && (
                      <>
                        {activeFilter !== "Inplay" && (
                          <div className="bg-[#f8fafc] px-3 py-1.5 flex items-center gap-2 border-b border-[#e2e8f0]">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase text-red-700 tracking-widest">Live Now</span>
                          </div>
                        )}
                        {liveMatches.map((match: any) => (
                          <BettingMatchCard 
                            key={match.id} 
                            match={match} 
                            onSelectBet={handleSelectBet} 
                            mongoOdds={null}
                          />
                        ))}
                      </>
                    )}

                    {/* Upcoming Section */}
                    {upcomingMatches.length > 0 && (
                      <>
                        <div className="bg-[#f8fafc] px-3 py-1.5 flex items-center gap-2 border-b border-[#e2e8f0]">
                          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Upcoming Matches</span>
                        </div>
                        {upcomingMatches.map((match: any) => (
                          <BettingMatchCard 
                            key={match.id} 
                            match={match} 
                            onSelectBet={handleSelectBet} 
                            mongoOdds={null}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {filteredMatches.length === 0 && !betfairLoading && !matchesLoading && !atdLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white mx-4 my-6 rounded-xl border border-[#ccd9e5] shadow-sm">
                <div className="w-16 h-16 bg-[#254465]/5 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-[#254465]/20" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#254465]/60">
                  {activeFilter === 'Inplay' ? 'No Live Matches' : `No Real ${activeFilter} Matches Found`}
                </h3>
                <p className="text-xs text-[#254465]/40 mt-2 max-w-[200px] mx-auto leading-relaxed">
                  {activeFilter === 'Inplay' 
                    ? 'There are no real matches currently in play. All fake data has been removed for your security.'
                    : `We couldn't find any real ${activeFilter} matches from our live feeds right now. Please check back later.`}
                </p>
                
                <div className="flex flex-col gap-3 mt-8 w-full max-w-[220px]">
                  {activeFilter === 'Inplay' && (cricketCount > 0 || soccerCount > 0 || tennisCount > 0) && (
                    <button 
                      onClick={() => {
                        if (cricketCount > 0) setActiveFilter("Cricket");
                        else if (soccerCount > 0) setActiveFilter("Soccer");
                        else setActiveFilter("Tennis");
                      }}
                      className="px-6 py-3 bg-[#00b181] text-white text-[11px] font-black rounded-lg shadow-md uppercase tracking-wider active:scale-95 transition-transform"
                    >
                      View Upcoming Matches
                    </button>
                  )}
                  
                  <button 
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['matches'] });
                      queryClient.invalidateQueries({ queryKey: ['betfair-events'] });
                      queryClient.invalidateQueries({ queryKey: ['atd-cricket-home'] });
                    }}
                    className="px-6 py-3 bg-[#254465] text-white text-[11px] font-black rounded-lg shadow-md uppercase tracking-wider active:scale-95 transition-transform"
                  >
                    Refresh List
                  </button>
                </div>
              </div>
            )}

            {filteredMatches.length === 0 && (betfairLoading || matchesLoading || atdLoading) && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Loader2 className="w-8 h-8 text-[#00b181] animate-spin mb-4" />
                <p className="text-xs font-bold text-[#254465]/60 uppercase tracking-widest">Finding Live Matches...</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* BetSlip modal overlay */}
      {activeBet && (
        <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none pointer-events-none">
          <div className="pointer-events-auto">
            <BetSlip 
              bet={activeBet} 
              onClose={() => setActiveBet(null)} 
              onSubmit={(stake) => placeBet(stake)} 
              isSubmitting={isSubmitting} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
