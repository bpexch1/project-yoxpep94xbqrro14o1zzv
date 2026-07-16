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
import { Loader as Loader2, Trophy } from "lucide-react";

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
    return (
      <svg {...props}>
        <line x1="14" y1="9" x2="14" y2="22"/>
        <line x1="17" y1="8" x2="17" y2="21"/>
        <line x1="20" y1="9" x2="20" y2="22"/>
        <line x1="13.5" y1="9.5" x2="17.5" y2="8.5"/>
        <line x1="16.5" y1="8.5" x2="20.5" y2="9.5"/>
        <path d="M2 22L14 6" strokeWidth="3.5"/>
        <path d="M2 22L4 20" strokeWidth="2"/>
      </svg>
    );
  }

  if (s.includes('tennis')) {
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

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => Match.list(),
    refetchInterval: 15000,
    retry: 2
  });

  const { data: betfairEvents, isLoading: betfairLoading } = useQuery({
    queryKey: ['betfair-events'],
    queryFn: async () => {
      try {
        return await fetchBetfairEvents({});
      } catch (err) {
        console.debug("Failed to fetch betfair events:", err);
        return [];
      }
    },
    refetchInterval: 60000,
    retry: 1
  });

  const { data: atdData, isLoading: atdLoading } = useQuery({
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
        console.debug("Background bulk sync skipped or failed:", err);
        return { success: false, error: "Failed to fetch" };
      }
    },
    enabled: matchesWithBetfair.length > 0 && !!betfairEvents,
    refetchInterval: 15000,
    retry: false,
    staleTime: 5000,
    gcTime: 0,
  });

  const { data: clients } = useQuery({
    queryKey: ['client-data', session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username
  });

  const clientData = clients?.[0];
  const clientBalance = clientData?.cash ?? 0;

  const { mutate: placeBet, isPending: isSubmitting } = useMutation({
    mutationFn: async (stake: number) => {
      if (!activeBet || !session || !clientData) return;

      if (stake > clientBalance) {
        throw new Error("Insufficient balance");
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

  const normalizeMatch = (m: any) => {
    const status = String(m.status || m.api_status || '').toLowerCase();
    const isLive = status === 'live' || status === 'inplay' || status === 'started' || status === '1' || status === '2';
    
    let sport = m.sport || '';
    if (!sport) {
      const title = (m.title || '').toLowerCase();
      if (title.includes('cricket')) sport = 'Cricket';
      else if (title.includes('soccer') || title.includes('football')) sport = 'Soccer';
      else if (title.includes('tennis')) sport = 'Tennis';
    }

    if (sport.toLowerCase() === 'football') sport = 'Soccer';

    return {
      ...m,
      sport: sport || 'Others',
      status: isLive ? 'live' : 'upcoming'
    };
  };

  const now = new Date();
  const matchesList = [
    ...(betfairEvents || []).map(normalizeMatch),
    ...(atdData?.matches || []).map(normalizeMatch).filter((atd: any) => {
      return !(betfairEvents || []).some((bf: any) => {
        const t1 = atd.team1?.toLowerCase() || '';
        const t2 = atd.team2?.toLowerCase() || '';
        if (!t1 || !t2) return false;
        return bf.title.toLowerCase().includes(t1) && bf.title.toLowerCase().includes(t2);
      });
    }),
    ...(matches || []).map(normalizeMatch).filter((m: any) => {
      const isExternal = String(m.id).startsWith('bf-') || String(m.id).startsWith('atd-');
      if (isExternal) return false;

      if (!m.betfair_event_id || m.betfair_event_id === 'undefined' || m.betfair_event_id === '') return false;

      if (m.status === 'completed' || m.status === 'finished') return false;

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

      const isDuplicate = (betfairEvents || []).some((bf: any) => 
        bf.betfair_event_id === m.betfair_event_id || bf.id === m.betfair_event_id
      );
      if (isDuplicate) return false;

      return true;
    })
  ].filter((m: any) => {
    const sport = m.sport?.toLowerCase();
    return sport === 'cricket' || sport === 'soccer' || sport === 'tennis';
  }).sort((a: any, b: any) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    
    const timeA = a.match_time ? new Date(a.match_time).getTime() : 0;
    const timeB = b.match_time ? new Date(b.match_time).getTime() : 0;
    return timeA - timeB;
  });
  
  const inplayCount = matchesList.filter((m: any) => m.status === 'live').length;
  const cricketCount = matchesList.filter((m: any) => m.sport?.toLowerCase() === 'cricket').length;
  const tennisCount = matchesList.filter((m: any) => m.sport?.toLowerCase() === 'tennis').length;
  const soccerCount = matchesList.filter((m: any) => m.sport?.toLowerCase() === 'football' || m.sport?.toLowerCase() === 'soccer').length;

  useEffect(() => {
    if (activeFilter === "Inplay") {
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
        <GameBanners onFilterChange={setActiveFilter} />

        {/* Sport Tabs */}
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
                <span style={{ color: 'white', fontSize: 14, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
                  {cat.count}
                </span>
                <div style={{ marginBottom: 4 }}>
                  <SportIcon sport={cat.id} color="white" size={22} />
                </div>
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
                    ? 'There are no real matches currently in play.'
                    : `We couldn't find any real ${activeFilter} matches from our live feeds right now.`}
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
