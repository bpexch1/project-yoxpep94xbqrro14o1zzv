import { placeSelectionBet } from "@/services/bettingApi";
import { getCricketScores } from "@/services/cricketScores";
import { getWalletSummary } from "@/lib/walletBalances";
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
import { TennisIcon, CricketIcon, SoccerIcon } from "@/components/icons/ReferenceSportsIcons";
import { SportsBookIcon } from "@/components/icons/CustomIcons";
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
        <path d="M9 1h6M12 1v3M18 4l2 2" /><circle cx="12" cy="14" r="8" />
        <path d="M12 8v6" />
      </svg>
    );
  }

  if (s.includes("sportsbook")) return <SportsBookIcon className="w-full h-full" color={color} />;
  const Icon = s.includes("cricket") ? CricketIcon : s.includes("tennis") ? TennisIcon : SoccerIcon;
  if (/cricket|tennis|soccer|football/.test(s)) return <span style={{ display: "block", width: size, height: size }}><Icon className="w-full h-full" color={color} /></span>;

  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
};


export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isCasinoPath = (path: string) => {
    const p = path.toLowerCase();
    return p.includes("casino") || p.includes("betfair-game") || p.includes("betfairgame");
  };

  const [activeFilter, setActiveFilter] = useState(() => {
    if (isCasinoPath(location.pathname)) return "Casino";
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
    if (isCasinoPath(location.pathname)) {
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

  const safeMatches = Array.isArray(matches) ? matches : [];
  const { data: cricketScores = [], isError: cricketFeedError } = useQuery({
    queryKey: ["cricket-scores"],
    queryFn: getCricketScores,
    refetchInterval: 60000,
    retry: 1,
  });

  // Fetch real-time client data for balance
  const { data: clients } = useQuery({
    queryKey: ["client-data", session?.username],
    queryFn: () => (session?.username ? Client.filter({ username: session.username }) : Promise.resolve([])),
    enabled: !!session?.username,
  });

  const clientData = Array.isArray(clients) && clients.length > 0 ? clients[0] : null;
  const clientCash = typeof clientData?.cash === "number" ? clientData.cash : parseFloat(String(clientData?.cash || 0)) || 0;
  const clientBalance = getWalletSummary(clientData || {}).combinedAvailable;

  // Place bet mutation
  const { mutate: placeBet, isPending: isSubmitting } = useMutation({
    mutationFn: async ({stake, odds}: {stake: number; odds?: number}) => {
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

      await placeSelectionBet({ matchId: activeBet.match.id, eventId: activeBet.match.betfair_event_id,
        selection: activeBet.selection, side: activeBet.betType, stake: numericStake, odds: odds ?? activeBet.odds });
      return { stake: numericStake, selection: activeBet.selection };
    },
    onSuccess: (receipt) => {
      setActiveBet(null);
      queryClient.invalidateQueries({ queryKey: ["client-data", session?.username] });
      queryClient.invalidateQueries();
      toast({
        title: "Bet Placed Successfully",
        description: `Stake: ₹${receipt.stake} on ${receipt.selection}`,
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

    // Counts and section grouping must use the same canonical sport names.
    const sportKey = String(sport).trim().toLowerCase();
    sport = ({ cricket: "Cricket", tennis: "Tennis", football: "Soccer", soccer: "Soccer" } as Record<string, string>)[sportKey] || String(sport).trim();

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
      matched_amount: m.matched_amount || 0,
      match_time: m.match_time || "21:00",
    };
  };

  const matchesList = safeMatches
    .filter(m => m.status !== "completed" && !(String(m.sport).toLowerCase() === "cricket" && m.is_demo))
    .map(normalizeMatch)
    .filter((m: any) => {
      const sport = m.sport?.toLowerCase();
      return sport === "cricket" || sport === "soccer" || sport === "tennis";
    });

  const inplayCount = matchesList.filter(m => m.status === "live").length + cricketScores.filter(m => m.matchStarted).length;
  const cricketCount = matchesList.filter(m => m.sport.toLowerCase() === "cricket").length + cricketScores.length;
  const tennisCount = matchesList.filter(m => m.sport.toLowerCase() === "tennis").length;
  const soccerCount = matchesList.filter(m => m.sport.toLowerCase() === "soccer").length;

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
    { id: "SportsBook", label: "SportsBook", count: matchesList.length + cricketScores.length },
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
      className="reference-user-dashboard min-h-screen text-[#212529] relative"
      style={{
        fontFamily: '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        backgroundColor: "#e5f3fc",
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

      <main className="w-full pb-20">
        {/* Game Banners Row */}
        <GameBanners onFilterChange={(filter) => setActiveFilter(filter)} />

        {/* Horse Race & Greyhound Section */}
        <RaceSection
          onSelectRace={(race) => {
            console.log("Selected race:", race);
          }}
        />

        {/* 4 Sports Navigation Blocks */}
        <div className="reference-sport-tabs"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            width: "100%",
            backgroundColor: "#264561",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {categories.map((cat) => {
            const isActive = activeFilter === cat.id;
            const isGreen = cat.id === "Inplay";
            return (
              <button
                key={cat.id}
                className={cat.id === "SportsBook" ? "reference-desktop-sportsbook" : undefined}
                onClick={() => setActiveFilter(cat.id === "SportsBook" ? "Inplay" : cat.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 4px 6px 4px",
                  backgroundColor: isGreen ? "#00af87" : isActive ? "#000000" : "#254465",
                  border: "none",
                  borderRight: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  height: 76,
                  position: "relative",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Top right count */}
                <div style={{ width: "100%", textAlign: "center", paddingRight: 0 }}>
                  <span
                    style={{
                      color: "#ffffff",
                      fontSize: 18,
                      fontWeight: 400,
                      fontStyle: "italic",
                      lineHeight: 1,
                    }}
                  >
                    {cat.count}
                  </span>
                </div>

                {/* Center icon */}
                <div style={{ margin: "auto 0" }}>
                  <SportIcon sport={cat.id} color="#ffffff" size={28} />
                </div>

                {/* Bottom label */}
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: 400,
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
              const scoreMatches = sport === "Cricket"
                ? cricketScores.filter(m => activeFilter !== "Inplay" || m.matchStarted)
                : [];

              return (
                <div key={sport} className="flex flex-col">
                  {/* Sport Accordion Header */}
                  <div className="reference-sport-heading"
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
                    {sportMatches.length > 0 && <><span style={{ fontSize: 12, fontWeight: 800, color: "#142a45" }}>
                      Matched
                    </span>
                    <div className="reference-odds-heading"><span>1</span><span>X</span><span>2</span></div></>}
                  </div>

                  {/* Provider scores are informational; they never open a betting slip. */}
                  {scoreMatches.map((fixture) => (
                    <div key={fixture.id} className="border-b border-slate-200 px-3 py-3 text-[#142a45]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-sm">{fixture.name}</span>
                        <span className="text-xs font-semibold">{fixture.matchStarted ? "Live score" : "Upcoming"}</span>
                      </div>
                      <div className="text-xs mt-1">{fixture.status}</div>
                      {fixture.score.map((inning, index) => (
                        <div key={index} className="text-xs mt-1">
                          {inning.inning}: {inning.runs ?? "–"}/{inning.wickets ?? "–"} ({inning.overs ?? "–"} ov)
                        </div>
                      ))}
                      <div className="text-xs text-slate-500 mt-1">Scores only · betting unavailable</div>
                    </div>
                  ))}
                  {sport === "Cricket" && cricketFeedError && sportMatches.length === 0 && (
                    <p className="px-3 py-3 text-xs text-slate-600">Cricket score feed is unavailable right now.</p>
                  )}
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

            {filteredMatches.length === 0 && (activeFilter !== "Cricket" && activeFilter !== "Inplay" || (activeFilter === "Cricket" && cricketScores.length === 0 && !cricketFeedError) || (activeFilter === "Inplay" && cricketScores.every(m => !m.matchStarted) && !cricketFeedError)) && (
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
          onSubmit={(stake, odds) => placeBet({stake, odds})}
          isSubmitting={isSubmitting}
          balance={clientBalance}
        />
      )}
    </div>
  );
}
