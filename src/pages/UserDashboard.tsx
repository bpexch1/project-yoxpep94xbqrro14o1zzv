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
import { RaceSection } from "@/components/user/RaceSection";
import { CasinoSection } from "@/components/user/CasinoSection";
import { useToast } from "@/hooks/use-toast";
import { getHealthStatusMap } from "@/lib/apiManager";
import { 
  Loader2, 
  AlertTriangle,
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

  // Fetch matches from DB
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => Match.list(),
    refetchInterval: 15000,
    retry: 2
  });

  // Fetch live Betfair events from API (with automatic fallback)
  const { data: betfairEvents, isLoading: betfairLoading } = useQuery({
    queryKey: ['betfair-events'],
    queryFn: async () => {
      try {
        const result = await fetchBetfairEvents({});
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.debug("Failed to fetch betfair events:", err);
        return [];
      }
    },
    refetchInterval: 30000,
    retry: 1
  });

  // Fetch live ATD Cricket matches from API
  const { data: atdData, isLoading: atdLoading } = useQuery({
    queryKey: ['atd-cricket-home'],
    queryFn: async () => {
      try {
        const result = await fetchAtdCricketHome({});
        return (result && typeof result === 'object' && Array.isArray(result.matches)) ? result : { matches: [] };
      } catch (err) {
        console.debug("Failed to fetch atd cricket:", err);
        return { matches: [] };
      }
    },
    refetchInterval: 30000,
    retry: 1
  });

  // Real-time API Health status for banner notifications
  const healthStatus = getHealthStatusMap();

  const safeMatches = Array.isArray(matches) ? matches : [];
  const safeBetfair = Array.isArray(betfairEvents) ? betfairEvents : [];
  const safeAtdMatches = Array.isArray(atdData?.matches) ? atdData.matches : [];

  // Auto-sync Betfair odds for matches
  const matchesWithBetfair = safeMatches.filter((m: any) => 
    m && m.betfair_event_id && 
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
        return { success: false, error: "Failed to fetch" };
      }
    },
    enabled: matchesWithBetfair.length > 0 && !!betfairEvents,
    refetchInterval: 15000,
    retry: false,
    staleTime: 5000,
    gcTime: 0,
  });

  // Fetch real-time client data for balance and credits
  const { data: clients } = useQuery({
    queryKey: ['client-data', session?.username],
    queryFn: () => (session?.username ? Client.filter({ username: session.username }) : Promise.resolve([])),
    enabled: !!session?.username,
  });

  const clientData = Array.isArray(clients) && clients.length > 0 ? clients[0] : null;
  const clientCash = typeof clientData?.cash === "number" ? clientData.cash : (parseFloat(String(clientData?.cash || 0)) || 0);
  const clientBalance = clientCash;

  // Place bet mutation
  const { mutate: placeBet, isPending: isSubmitting } = useMutation({
    mutationFn: async (stake: number) => {
      if (!activeBet) {
        throw new Error("No active bet selected. Please select odds first.");
      }
      if (!session || !session.username) {
        throw new Error("User session not found. Please log in again.");
      }
      if (!clientData) {
        throw new Error("Client account data is not loaded. Please wait or refresh the page.");
      }

      const numericStake = typeof stake === "number" ? stake : parseFloat(String(stake));
      if (isNaN(numericStake) || numericStake <= 0) {
        throw new Error("Please enter a valid positive stake amount.");
      }

      if (numericStake > clientBalance) {
        throw new Error(`Insufficient balance. Current balance is ${clientBalance.toLocaleString('en-IN')}`);
      }

      const oddsVal = typeof activeBet.odds === "number" ? activeBet.odds : parseFloat(String(activeBet.odds || 1));
      const potentialWin = (numericStake * oddsVal) - numericStake;

      await Bet.create({
        user_email: session.username,
        match_id: activeBet.match?.id || "unknown-match",
        match_title: activeBet.match?.title || `${activeBet.match?.team1 || ''} v ${activeBet.match?.team2 || ''}`.trim() || "Match Event",
        selection: activeBet.selection,
        bet_type: activeBet.betType,
        stake: numericStake,
        odds: oddsVal,
        potential_win: potentialWin > 0 ? potentialWin : 0,
        status: 'pending'
      });

      const updatedCash = Math.max(0, clientBalance - numericStake);
      await Client.update(clientData.id, {
        cash: updatedCash
      });
    },
    onSuccess: () => {
      setActiveBet(null);
      queryClient.invalidateQueries({ queryKey: ['client-data', session?.username] });
      queryClient.invalidateQueries({ queryKey: ['bets'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Bet Failed",
        description: error?.message || "Could not place bet. Please try again.",
      });
    }
  });

  const normalizeMatch = (m: any) => {
    if (!m) return null;
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

  const matchesList = [
    ...safeBetfair.map(normalizeMatch),
    ...safeAtdMatches.map(normalizeMatch).filter((atd: any) => {
      if (!atd) return false;
      return !safeBetfair.some((bf: any) => {
        if (!bf) return false;
        const t1 = atd.team1?.toLowerCase() || '';
        const t2 = atd.team2?.toLowerCase() || '';
        if (!t1 || !t2) return false;
        return bf.title?.toLowerCase().includes(t1) && bf.title?.toLowerCase().includes(t2);
      });
    }),
    ...safeMatches.map(normalizeMatch).filter((m: any) => {
      if (!m) return false;
      const isExternal = String(m.id).startsWith('bf-') || String(m.id).startsWith('atd-') || String(m.id).startsWith('cb-') || String(m.id).startsWith('sportapi-');
      if (isExternal) return false;

      if (!m.betfair_event_id || m.betfair_event_id === 'undefined' || m.betfair_event_id === '') return false;
      if (m.status === 'completed' || m.status === 'finished') return false;

      const isDuplicate = safeBetfair.some((bf: any) => 
        bf && (bf.betfair_event_id === m.betfair_event_id || bf.id === m.betfair_event_id)
      );
      if (isDuplicate) return false;

      return true;
    })
  ].filter((m: any) => {
    if (!m) return false;
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

  if (!session) return null;

  const isInitialLoading = matchesLoading || betfairLoading || atdLoading;

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

  const handleSelectBet = (match: any, selection: string, betType: 'back' | 'lay', odds: number) => {
    setActiveBet({ match, selection, betType, odds });
  };

  const getActiveTabApiStatusNotice = () => {
    if (activeFilter === "Cricket" && (healthStatus.cricket?.statusType === "quota_exceeded" || healthStatus.cricket?.statusCode === 429)) {
      return "Cricket feed unavailable - API quota exceeded";
    }
    if (activeFilter === "Soccer" && (healthStatus.football?.statusType === "subscription_required" || healthStatus.football?.statusCode === 403)) {
      return "Football feed unavailable - API subscription required";
    }
    if (activeFilter === "Tennis" && (healthStatus.tennis?.statusType === "subscription_required" || healthStatus.tennis?.statusCode === 403)) {
      return "Tennis feed unavailable - API subscription required";
    }
    if (activeFilter === "Inplay") {
      const issues = [];
      if (healthStatus.cricket?.statusType === "quota_exceeded" || healthStatus.cricket?.statusCode === 429) {
        issues.push("Cricket feed unavailable - API quota exceeded");
      }
      if (healthStatus.football?.statusType === "subscription_required" || healthStatus.football?.statusCode === 403 || healthStatus.tennis?.statusType === "subscription_required" || healthStatus.tennis?.statusCode === 403) {
        issues.push("Football/Tennis feed unavailable - API subscription required");
      }
      if (issues.length > 0) {
        return issues.join(" • ");
      }
    }
    return null;
  };

  const currentApiNotice = getActiveTabApiStatusNotice();

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
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div>
          <span style={{ color: "rgba(255,255,255,0.7)", marginRight: 5 }}>Pts:</span>
          <span style={{ fontWeight: 800, color: "#ffffff" }}>
            {clientCash.toLocaleString("en-IN")}
          </span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)" }}>|</div>
        <div>
          <span style={{ color: "rgba(255,255,255,0.7)", marginRight: 5 }}>Exp:</span>
          <span style={{ fontWeight: 800, color: "#ff6b6b" }}>
            0
          </span>
        </div>
      </div>

      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeFilter={activeFilter}
        onSelectFilter={(filter) => {
          setActiveFilter(filter);
          setSidebarOpen(false);
        }}
      />

      <main className="max-w-4xl mx-auto pb-20">
        <GameBanners />

        <RaceSection 
          onSelectRace={(race) => {
            console.log("Selected race:", race);
          }}
        />

        {currentApiNotice && (
          <div 
            style={{ 
              backgroundColor: "#fff3cd", 
              border: "1px solid #ffeeba", 
              color: "#856404", 
              padding: "6px 12px", 
              fontSize: "12px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} color="#856404" />
              <span>{currentApiNotice}</span>
            </div>
          </div>
        )}

        {/* Navigation Categories */}
        <div 
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            backgroundColor: "#254465",
            borderBottom: "2px solid #1a334d",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
          }}
        >
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
                  padding: "6px 2px",
                  backgroundColor: isActive ? "#15283c" : "transparent",
                  border: "none",
                  borderRight: "1px solid rgba(255,255,255,0.12)",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  minHeight: 62,
                  position: "relative",
                }}
              >
                <span style={{ 
                  color: 'white', 
                  fontSize: 14, 
                  fontWeight: 900, 
                  lineHeight: 1, 
                  marginBottom: 3,
                  fontStyle: 'italic'
                }}>
                  {cat.count}
                </span>
                
                <div style={{ marginBottom: 3 }}>
                   <SportIcon sport={cat.id} color="white" size={20} />
                </div>

                <span style={{
                  color: "white",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase"
                }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Matches / Casino Section Content */}
        {activeFilter === "Casino" ? (
          <CasinoSection />
        ) : (
          <div className="space-y-2 p-2">
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match: any, idx: number) => (
                <BettingMatchCard 
                  key={match.id || idx} 
                  match={match} 
                  onSelectBet={handleSelectBet} 
                />
              ))
            ) : (
              <div className="bg-white p-8 text-center text-gray-500 rounded border border-gray-200 mt-2">
                No active matches available for {activeFilter}.
              </div>
            )}
          </div>
        )}

        {/* Active Bet Slip */}
        {activeBet && (
          <BetSlip 
            activeBet={activeBet}
            onClose={() => setActiveBet(null)}
            onSubmit={(stake) => placeBet(stake)}
            isSubmitting={isSubmitting}
            userBalance={clientBalance}
          />
        )}
      </main>
    </div>
  );
}