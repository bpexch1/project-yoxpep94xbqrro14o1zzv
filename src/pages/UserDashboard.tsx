import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Match, Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { BettingMatchCard } from "@/components/user/BettingMatchCard";
import { BetSlip } from "@/components/user/BetSlip";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { GameBanners } from "@/components/user/GameBanners";
import { RaceSection } from "@/components/user/RaceSection";
import { CasinoSection } from "@/components/user/CasinoSection";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy } from "lucide-react";
import { CircularArcsLoader } from "@/components/ui/CircularArcsLoader";

// Crisp SVG Icons matching the screenshots
const SportIcon = ({ sport, color = "white", size = 22 }: { sport: string; color?: string; size?: number }) => {
  const s = sport.toLowerCase();
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { display: "block" },
  };

  if (s.includes("inplay") || s.includes("live")) {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <polyline points="12,7 12,12 15,14" />
      </svg>
    );
  }

  if (s.includes("cricket")) {
    return (
      <svg {...props}>
        <line x1="14" y1="9" x2="14" y2="22" />
        <line x1="17" y1="8" x2="17" y2="21" />
        <line x1="20" y1="9" x2="20" y2="22" />
        <line x1="13.5" y1="9.5" x2="17.5" y2="8.5" />
        <line x1="16.5" y1="8.5" x2="20.5" y2="9.5" />
        <path d="M2 22L14 6" strokeWidth="3" />
        <circle cx="4" cy="18" r="2" fill={color} />
      </svg>
    );
  }

  if (s.includes("tennis")) {
    return (
      <svg {...props}>
        <ellipse cx="12" cy="9" rx="5.5" ry="7" />
        <line x1="6.5" y1="7" x2="17.5" y2="7" />
        <line x1="6" y1="10.5" x2="18" y2="10.5" />
        <line x1="10" y1="2.2" x2="10" y2="15.8" />
        <line x1="14" y1="2.2" x2="14" y2="15.8" />
        <line x1="12" y1="16" x2="12" y2="22" />
        <line x1="10" y1="20" x2="14" y2="20" />
      </svg>
    );
  }

  if (s.includes("soccer") || s.includes("football")) {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9.5" />
        <polygon points="12,5.5 14.5,8 13.5,11 10.5,11 9.5,8" fill={color} stroke={color} strokeWidth="0.5" />
        <line x1="12" y1="2.5" x2="12" y2="5.5" />
        <line x1="19" y1="7.5" x2="14.5" y2="8" />
        <line x1="17" y1="20" x2="13.5" y2="17.5" />
        <line x1="7" y1="20" x2="10.5" y2="17.5" />
        <line x1="5" y1="7.5" x2="9.5" y2="8" />
        <line x1="10.5" y1="11" x2="7" y2="20" />
        <line x1="13.5" y1="11" x2="17" y2="20" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
};

const DEFAULT_SCREENSHOT_MATCHES = [
  // Football
  {
    id: "fb-1",
    sport: "Soccer",
    title: "Roma V Inter",
    team1: "Roma",
    team2: "Inter",
    status: "live",
    match_time: "21:00",
    matched_amount: "14029346",
    odds: 1.95,
  },
  {
    id: "fb-2",
    sport: "Soccer",
    title: "Nottm Forest V Coventry",
    team1: "Nottm Forest",
    team2: "Coventry",
    status: "live",
    match_time: "21:30",
    matched_amount: "14040110",
    odds: 2.1,
  },
  {
    id: "fb-3",
    sport: "Soccer",
    title: "Stuttgart V Dortmund",
    team1: "Stuttgart",
    team2: "Dortmund",
    status: "live",
    match_time: "21:30",
    matched_amount: "8835988",
    odds: 1.88,
  },
  {
    id: "fb-4",
    sport: "Soccer",
    title: "Trabzonspor V Galatasaray",
    team1: "Trabzonspor",
    team2: "Galatasaray",
    status: "live",
    match_time: "22:00",
    matched_amount: "822308",
    odds: 2.25,
  },
  // Cricket
  {
    id: "cr-1",
    sport: "Cricket",
    title: "Afghanistan v India",
    team1: "Afghanistan",
    team2: "India",
    status: "live",
    match_time: "19:30",
    matched_amount: "24198340",
    odds: 1.65,
  },
  {
    id: "cr-2",
    sport: "Cricket",
    title: "England v Sri Lanka",
    team1: "England",
    team2: "Sri Lanka",
    status: "live",
    match_time: "20:00",
    matched_amount: "18340120",
    odds: 1.72,
  },
  {
    id: "cr-3",
    sport: "Cricket",
    title: "Zimbabwe v Australia",
    team1: "Zimbabwe",
    team2: "Australia",
    status: "live",
    match_time: "21:00",
    matched_amount: "11200900",
    odds: 1.5,
  },
  // Tennis
  {
    id: "tn-1",
    sport: "Tennis",
    title: "Bucsa v Bejlek",
    team1: "Bucsa",
    team2: "Bejlek",
    status: "live",
    match_time: "20:30",
    matched_amount: "3420100",
    odds: 1.9,
  },
  {
    id: "tn-2",
    sport: "Tennis",
    title: "Frech v I Jovic",
    team1: "Frech",
    team2: "I Jovic",
    status: "live",
    match_time: "21:15",
    matched_amount: "2890450",
    odds: 2.05,
  },
];

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleRefreshEvent = () => {
      setIsRefreshing(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        setIsRefreshing(false);
      }, 700);
    };

    window.addEventListener("refresh-dashboard", handleRefreshEvent);

    if (location.state?.refresh) {
      handleRefreshEvent();
      // clear the state
      window.history.replaceState({}, document.title);
    }

    return () => {
      window.removeEventListener("refresh-dashboard", handleRefreshEvent);
    };
  }, [location.state]);

  useEffect(() => {
    if (location.pathname === "/casino") {
      setActiveFilter("Casino");
    } else if (location.state?.activeFilter) {
      setActiveFilter(location.state.activeFilter);
    }
  }, [location.pathname, location.state]);

  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: "back" | "lay"; odds: number } | null>(null);

  const session = getClientSession();

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

  // Fetch matches directly from local/persistent DB
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => Match.list(),
    refetchInterval: 10000,
    retry: 2,
  });

  const safeMatches = Array.isArray(matches) && matches.length > 0 ? matches : DEFAULT_SCREENSHOT_MATCHES;

  // Fetch real-time client data for balance
  const { data: clients } = useQuery({
    queryKey: ["client-data", session?.username],
    queryFn: () => (session?.username ? Client.filter({ username: session.username }) : Promise.resolve([])),
    enabled: !!session?.username,
  });

  const clientData = Array.isArray(clients) && clients.length > 0 ? clients[0] : null;
  const clientCash = typeof clientData?.cash === "number" ? clientData.cash : parseFloat(String(clientData?.cash || 0)) || 0;
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
        throw new Error(`Insufficient balance. Current balance is ${clientBalance.toLocaleString("en-IN")}`);
      }

      const oddsVal = typeof activeBet.odds === "number" ? activeBet.odds : parseFloat(String(activeBet.odds || 1));
      const potentialWin = numericStake * oddsVal - numericStake;

      await Bet.create({
        user_email: session.username,
        match_id: activeBet.match?.id || "unknown-match",
        match_title:
          activeBet.match?.title || `${activeBet.match?.team1 || ""} v ${activeBet.match?.team2 || ""}`.trim() || "Match Event",
        selection: activeBet.selection,
        bet_type: activeBet.betType,
        stake: numericStake,
        odds: oddsVal,
        potential_win: potentialWin > 0 ? potentialWin : 0,
        status: "pending",
      });

      const updatedCash = Math.max(0, clientBalance - numericStake);
      await Client.update(clientData.id, {
        cash: updatedCash,
      });
    },
    onSuccess: () => {
      setActiveBet(null);
      queryClient.invalidateQueries({ queryKey: ["client-data", session?.username] });
      queryClient.invalidateQueries({ queryKey: ["bets"] });
      toast({
        title: "Bet Placed Successfully",
        description: `Stake: ₹${activeBet?.stake || ""} on ${activeBet?.selection || ""}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Bet Failed",
        description: error?.message || "Could not place bet. Please try again.",
      });
    },
  });

  const normalizeMatch = (m: any) => {
    const status = String(m.status || m.api_status || "").toLowerCase();
    const isLive = status === "live" || status === "inplay" || status === "started";

    let sport = m.sport || "";
    if (!sport) {
      const title = (m.title || "").toLowerCase();
      if (title.includes("cricket")) sport = "Cricket";
      else if (title.includes("soccer") || title.includes("football")) sport = "Soccer";
      else if (title.includes("tennis")) sport = "Tennis";
    }

    if (sport.toLowerCase() === "football") sport = "Soccer";

    const t1 = m.team1 || (m.title ? m.title.split(/ vs | v /i)[0] : "Team 1");
    const t2 = m.team2 || (m.title ? m.title.split(/ vs | v /i)[1] : "Team 2");
    const title = m.title || `${t1} V ${t2}`;

    const oddsVal = typeof m.odds === "number" ? m.odds : parseFloat(String(m.odds || 1.95)) || 1.95;

    return {
      ...m,
      id: m.id || `m-${Math.random().toString(36).slice(2, 7)}`,
      title,
      team1: t1,
      team2: t2,
      sport: sport || "Soccer",
      status: isLive ? "live" : "upcoming",
      odds: oddsVal,
      matched_amount: m.matched_amount || "14,029,346",
      match_time: m.match_time || "21:00",
    };
  };

  const matchesList = safeMatches
    .map(normalizeMatch)
    .filter((m: any) => {
      const sport = m.sport?.toLowerCase();
      return sport === "cricket" || sport === "soccer" || sport === "tennis";
    });

  const inplayCount = 5;
  const cricketCount = 3;
  const tennisCount = 2;
  const soccerCount = 9;

  if (!session) return null;

  if (matchesLoading && safeMatches.length === 0) {
    return (
      <div className="min-h-screen bg-[#ecf0f1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#173456] animate-spin" />
          <p className="text-xs font-bold text-[#173456]/60 uppercase tracking-widest animate-pulse">
            Loading Markets...
          </p>
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
    if (activeFilter === "Inplay") return true;
    const sport = m.sport?.toLowerCase();
    const filter = activeFilter.toLowerCase();
    if (filter === "soccer") return sport === "football" || sport === "soccer";
    return sport === filter;
  });

  const groupedMatches = filteredMatches.reduce((acc: any, match: any) => {
    const sport = match.sport || "Soccer";
    if (!acc[sport]) acc[sport] = [];
    acc[sport].push(match);
    return acc;
  }, {});

  // Ensure fixed order: Cricket, Soccer/Football, Tennis
  const orderedSports = ["Cricket", "Soccer", "Tennis"].filter(
    (s) => activeFilter === "Inplay" || activeFilter.toLowerCase() === s.toLowerCase()
  );

  const handleSelectBet = (match: any, selection: string, betType: "back" | "lay", odds: number) => {
    setActiveBet({ match, selection, betType, odds });
  };

  return (
    <div
      className="min-h-screen text-[#212529] relative"
      style={{
        fontFamily: '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        backgroundColor: "#e8eff5",
      }}
    >
      {/* Fullscreen Multi-Arc Radar Loader when Dashboard is refreshed */}
      {isRefreshing && <CircularArcsLoader fullScreen size={110} />}

      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onFilterChange={(filter) => {
          setActiveFilter(filter);
          setSidebarOpen(false);
        }}
      />

      <main className="max-w-4xl mx-auto pb-20">
        {/* Game Banners Row */}
        <GameBanners onFilterChange={(filter) => setActiveFilter(filter)} />

        {/* Horse Race & Greyhound Section */}
        <RaceSection
          onSelectRace={(race) => {
            console.log("Selected race:", race);
          }}
        />

        {/* 4 Sports Navigation Blocks */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            width: "100%",
            backgroundColor: "#173456",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {categories.map((cat) => {
            const isActive = activeFilter === cat.id;
            const isGreen = isActive || (activeFilter === "Inplay" && cat.id === "Inplay");
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 4px 6px 4px",
                  backgroundColor: isGreen ? "#00a676" : "#173456",
                  border: "none",
                  borderRight: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  height: 64,
                  position: "relative",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Top right count */}
                <div style={{ width: "100%", textAlign: "right", paddingRight: 4 }}>
                  <span
                    style={{
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 900,
                      fontStyle: "italic",
                      lineHeight: 1,
                    }}
                  >
                    {cat.count}
                  </span>
                </div>

                {/* Center icon */}
                <div style={{ margin: "auto 0" }}>
                  <SportIcon sport={cat.id} color="#ffffff" size={22} />
                </div>

                {/* Bottom label */}
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        {activeFilter === "Casino" || activeFilter === "Horse Race" || activeFilter === "Greyhound" ? (
          <CasinoSection title={activeFilter === "Casino" ? "Premium Casino" : `${activeFilter} Feed`} />
        ) : (
          <div className="flex flex-col bg-white">
            {orderedSports.map((sport) => {
              const sportMatches = groupedMatches[sport] || [];

              return (
                <div key={sport} className="flex flex-col">
                  {/* Sport Accordion Header */}
                  <div
                    style={{
                      backgroundColor: "#e2e8f0",
                      borderBottom: "1px solid #cbd5e1",
                      padding: "6px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <SportIcon sport={sport} color="#1e3a5f" size={17} />
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: "#142a45" }}>
                        {sport === "Soccer" ? "Football" : sport}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#142a45" }}>
                      Matched
                    </span>
                  </div>

                  {/* Matches List */}
                  {sportMatches.map((m: any) => (
                    <BettingMatchCard
                      key={m.id}
                      match={m}
                      onSelectBet={handleSelectBet}
                      onSelectOdds={handleSelectBet}
                      setActiveBet={setActiveBet}
                    />
                  ))}
                </div>
              );
            })}

            {filteredMatches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white m-3 rounded border border-gray-200">
                <Trophy className="w-12 h-12 text-[#173456]/30 mb-3" />
                <p className="text-sm font-bold text-[#173456] uppercase tracking-wide">
                  {activeFilter} Matches
                </p>
                <p className="text-xs text-gray-600 mt-1 font-semibold">
                  No {activeFilter} matches scheduled right now.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bet Placement Slip */}
      {activeBet && (
        <BetSlip
          activeBet={activeBet}
          onClose={() => setActiveBet(null)}
          onSubmit={(stake) => placeBet(stake)}
          isSubmitting={isSubmitting}
          balance={clientBalance}
        />
      )}
    </div>
  );
}
