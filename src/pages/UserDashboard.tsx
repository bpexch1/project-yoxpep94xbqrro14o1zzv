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
import { Loader2, AlertTriangle } from "lucide-react";

const SportIcon = ({ sport, color = "white", size = 22 }: { sport: string; color?: string; size?: number }) => {
  const s = String(sport || '').toLowerCase();
  const props = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color,
    strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, style: { display: 'block' }
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
    if (location?.pathname === "/casino") return "Casino";
    return location?.state?.activeFilter || "Inplay";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (location?.pathname === "/casino") {
      setActiveFilter("Casino");
    } else if (location?.state?.activeFilter) {
      setActiveFilter(location.state.activeFilter);
    }
  }, [location?.pathname, location?.state]);

  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);

  // Safe Session Fetching
  const session = (() => {
    try {
      return getClientSession();
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    if (!session || session.role !== 'client') {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);

  // Fetch matches from DB
  const { data: matches } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      try {
        const res = await Match.list();
        return Array.isArray(res) ? res : [];
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 15000,
    retry: false
  });

  // Fetch live Betfair events
  const { data: betfairEvents } = useQuery({
    queryKey: ['betfair-events'],
    queryFn: async () => {
      try {
        const result = await fetchBetfairEvents({});
        return Array.isArray(result) ? result : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 30000,
    retry: false
  });

  // Fetch live ATD Cricket matches
  const { data: atdData } = useQuery({
    queryKey: ['atd-cricket-home'],
    queryFn: async () => {
      try {
        const result = await fetchAtdCricketHome({});
        return (result && typeof result === 'object' && Array.isArray(result.matches)) ? result : { matches: [] };
      } catch (err) {
        return { matches: [] };
      }
    },
    refetchInterval: 30000,
    retry: false
  });

  const healthStatus = getHealthStatusMap ? getHealthStatusMap() : {};

  const safeMatches = Array.isArray(matches) ? matches : [];
  const safeBetfair = Array.isArray(betfairEvents) ? betfairEvents : [];
  const safeAtdMatches = Array.isArray(atdData?.matches) ? atdData.matches : [];

  const { data: clients } = useQuery({
    queryKey: ['client-data', session?.username],
    queryFn: async () => {
      if (!session?.username) return [];
      try {
        const res = await Client.filter({ username: session.username });
        return Array.isArray(res) ? res : [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!session?.username,
  });

  const clientData = Array.isArray(clients) && clients.length > 0 ? clients[0] : null;
  const clientCash = typeof clientData?.cash === "number" ? clientData.cash : (parseFloat(String(clientData?.cash || 0)) || 0);
  const clientBalance = clientCash;

  const { mutate: placeBet, isPending: isSubmitting } = useMutation({
    mutationFn: async (stake: number) => {
      if (!activeBet) throw new Error("No active bet selected.");
      if (!session || !session.username) throw new Error("Session expired.");
      if (!clientData) throw new Error("Client account error.");

      const numericStake = parseFloat(String(stake));
      if (isNaN(numericStake) || numericStake <= 0) throw new Error("Invalid stake.");
      if (numericStake > clientBalance) throw new Error("Insufficient balance.");

      const oddsVal = parseFloat(String(activeBet.odds || 1));
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
      await Client.update(clientData.id, { cash: updatedCash });
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
        description: error?.message || "Could not place bet.",
      });
    }
  });

  const normalizeMatch = (m: any) => {
    if (!m) return null;
    const status = String(m.status || m.api_status || '').toLowerCase();
    const isLive = status === 'live' || status === 'inplay' || status === 'started' || status === '1' || status === '2';
    
    let sport = m.sport || '';
    if (!sport) {
      const title = String(m.title || '').toLowerCase();
      if (title.includes('cricket')) sport = 'Cricket';
      else if (title.includes('soccer') || title.includes('football')) sport = 'Soccer';
      else if (title.includes('tennis')) sport = 'Tennis';
    }

    if (String(sport).toLowerCase() === 'football') sport = 'Soccer';

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
        const t1 = String(atd.team1 || '').toLowerCase();
        const t2 = String(atd.team2 || '').toLowerCase();
        if (!t1 || !t2) return false;
        return String(bf.title || '').toLowerCase().includes(t1) && String(bf.title || '').toLowerCase().includes(t2);
      });
    }),
    ...safeMatches.map(normalizeMatch).filter((m: any) => {
      if (!m) return false;
      const isExternal = String(m.id || '').startsWith('bf-') || String(m.id || '').startsWith('atd-') || String(m.id || '').startsWith('cb-');
      if (isExternal) return false;
      if (!m.betfair_event_id || m.betfair_event_id === 'undefined') return false;
      if (m.status === 'completed' || m.status === 'finished') return false;

      return !safeBetfair.some((bf: any) => bf && (bf.betfair_event_id === m.betfair_event_id || bf.id === m.betfair_event_id));
    })
  ].filter((m: any) => {
    if (!m) return false;
    const sport = String(m.sport || '').toLowerCase();
    return sport === 'cricket' || sport === 'soccer' || sport === 'tennis';
  }).sort((a: any, b: any) => {
    if (a?.status === 'live' && b?.status !== 'live') return -1;
    if (b?.status === 'live' && a?.status !== 'live') return 1;
    return 0;
  });

  const inplayCount = matchesList.filter((m: any) => m?.status === 'live').length;
  const cricketCount = matchesList.filter((m: any) => String(m?.sport || '').toLowerCase() === 'cricket').length;
  const tennisCount = matchesList.filter((m: any) => String(m?.sport || '').toLowerCase() === 'tennis').length;
  const soccerCount = matchesList.filter((m: any) => String(m?.sport || '').toLowerCase() === 'soccer').length;

  const categories = [
    { id: "Inplay", label: "Inplay", count: inplayCount },
    { id: "Cricket", label: "Cricket", count: cricketCount },
    { id: "Tennis", label: "Tennis", count: tennisCount },
    { id: "Soccer", label: "Soccer", count: soccerCount },
  ];

  const filteredMatches = matchesList.filter((m: any) => {
    if (!m) return false;
    const status = String(m.status || '').toLowerCase();
    const isLive = status === 'live' || status === 'inplay';

    if (activeFilter === "Inplay") return isLive;
    
    const sport = String(m.sport || '').toLowerCase();
    const filter = String(activeFilter || '').toLowerCase();
    if (filter === 'soccer') return sport === 'football' || sport === 'soccer';
    return sport === filter;
  });

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

      <div style={{
        backgroundColor: "#254465",
        padding: "7px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        fontSize: 13,
        color: "white",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}>
        <div>
          <span style={{ color: "rgba(255,255,255,0.7)", marginRight: 5 }}>Pts:</span>
          <span style={{ fontWeight: 800, color: "#ffffff" }}>
            {clientCash.toLocaleString("en-IN")}
          </span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)" }}>|</div>
        <div>
          <span style={{ color: "rgba(255,255,255,0.7)", marginRight: 5 }}>Exp:</span>
          <span style={{ fontWeight: 800, color: "#ff6b6b" }}>0</span>
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
        <RaceSection onSelectRace={(race) => console.log(race)} />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          backgroundColor: "#254465",
          borderBottom: "2px solid #1a334d",
          overflow: "hidden",
          boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
        }}>
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
                  minHeight: 62,
                }}
              >
                <span style={{ color: 'white', fontSize: 14, fontWeight: 900, marginBottom: 3, fontStyle: 'italic' }}>
                  {cat.count}
                </span>
                <div style={{ marginBottom: 3 }}>
                   <SportIcon sport={cat.id} color="white" size={20} />
                </div>
                <span style={{ color: "white", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {activeFilter === "Casino" ? (
          <CasinoSection />
        ) : (
          <div className="space-y-2 p-2">
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match: any, idx: number) => (
                <BettingMatchCard 
                  key={match?.id || idx} 
                  match={match} 
                  onSelectBet={handleSelectBet} 
                />
              ))
            ) : (
              <div className="bg-white p-8 text-center text-gray-500 rounded border border-gray-200 mt-2 font-bold text-sm">
                No active events available right now.
              </div>
            )}
          </div>
        )}

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
