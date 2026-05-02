import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Match, Bet, Client } from "@/entities";
import { fetchBetfairEvents, oddsEngine } from "@/functions";
import { UserHeader } from "@/components/user/UserHeader";
import { BettingMatchCard } from "@/components/user/BettingMatchCard";
import { BetSlip } from "@/components/user/BetSlip";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { GameBanners } from "@/components/user/GameBanners";
import { RaceSection } from "@/components/user/RaceSection";
import { CasinoSection } from "@/components/user/CasinoSection";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Trophy, 
} from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("Inplay");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);

  const session = getClientSession();

  // Fetch all MongoDB live odds
  const { data: allMongoOdds } = useQuery({
    queryKey: ['mongo-odds-dashboard'],
    queryFn: async () => {
      const res = await oddsEngine({ action: 'getAllOdds' });
      const map: Record<string, any> = {};
      (res?.odds || []).forEach((o: any) => { map[o.matchId] = o; });
      return map;
    },
    refetchInterval: 2000,
    staleTime: 0,
  });

  useEffect(() => {
    if (!session || session.role !== 'client') {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);

  // Fetch matches
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => Match.list(),
    refetchInterval: 5000 // Refresh odds every 5 seconds
  });

  // Auto-sync Betfair odds for all visible matches every 10 seconds
  const matchesWithBetfair = (matches || []).filter((m: any) => m.betfair_event_id);

  useQuery({
    queryKey: ['betfair-bulk-sync', matchesWithBetfair.map((m: any) => m.id).join(',')],
    queryFn: async () => {
      if (matchesWithBetfair.length === 0) return null;
      await oddsEngine({
        action: 'syncAllFromBetfair',
        matches: matchesWithBetfair.slice(0, 10).map((m: any) => ({
          matchId: m.id,
          betfairEventId: m.betfair_event_id
        }))
      });
      return true;
    },
    enabled: matchesWithBetfair.length > 0,
    refetchInterval: 10000,  // every 10 seconds
    staleTime: 0,
  });

  // Fetch live Betfair events
  const { data: betfairEvents, isLoading: betfairLoading } = useQuery({
    queryKey: ['betfair-events'],
    queryFn: () => fetchBetfairEvents({}),
    refetchInterval: 60000, // Refresh every 60 seconds
    retry: 1
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

  if (!session) return null;

  if (matchesLoading && !matches) {
    return (
      <div className="min-h-screen bg-[#ecf0f1] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#254465] animate-spin" />
      </div>
    );
  }

  const matchesList = [
    ...(betfairEvents || []),
    ...(matches || []).filter((m: any) => 
      !(betfairEvents || []).some((bf: any) => bf.title === (m.title || `${m.team1} v ${m.team2}`))
    )
  ].sort((a: any, b: any) => {
    // Live first, then upcoming
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    return 0;
  });
  
  const categories = [
    { id: "Inplay", label: "Inplay", emoji: "⏱️", count: matchesList.filter((m: any) => m.status === 'live').length },
    { id: "Cricket", label: "Cricket", emoji: "🏏", count: matchesList.filter((m: any) => m.sport?.toLowerCase() === 'cricket').length },
    { id: "Tennis", label: "Tennis", emoji: "🎾", count: matchesList.filter((m: any) => m.sport?.toLowerCase() === 'tennis').length },
    { id: "Soccer", label: "Soccer", emoji: "⚽", count: matchesList.filter((m: any) => m.sport?.toLowerCase() === 'football' || m.sport?.toLowerCase() === 'soccer').length },
  ];

  const filteredMatches = matchesList.filter((m: any) => {
    if (activeFilter === "Inplay") return true; // Show all when Inplay is active
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

  const horseRaceSlots = [
    {time:"11:55 PM", venue:"Philadelphia (US)"}, 
    {time:"12:00 AM", venue:"Newcastle (GB)"}, 
    {time:"12:14 AM", venue:"Will Rogers Downs (US)"}, 
    {time:"12:30 AM", venue:"Ascot (AU)"}, 
    {time:"2:30 PM", venue:"Ascot (AU)"}, 
    {time:"2:33 PM", venue:"Globe Derby (AU)"}, 
    {time:"2:36 PM", venue:"Mildura (AU)"}, 
    {time:"2:40 PM", venue:"Randwick (AU)"}
  ];

  const greyhoundSlots = [
    {time:"11:56 PM", venue:"Yarmouth (GB)"}, 
    {time:"11:58 PM", venue:"Harlow (GB)"}, 
    {time:"12:01 AM", venue:"Nottingham (GB)"}, 
    {time:"2:31 PM", venue:"The Gardens (AU)"}, 
    {time:"2:34 PM", venue:"The Meadows (AU)"}, 
    {time:"2:39 PM", venue:"Ballarat (AU)"}, 
    {time:"2:42 PM", venue:"Cannington (AU)"}, 
    {time:"2:45 PM", venue:"Dapto (AU)"}
  ];

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
      />
      
      <main className="flex flex-col">
        {/* Game Banners */}
        <GameBanners />

        {/* Race Sections */}
        <RaceSection title="Horse Race" iconType="horse" slots={horseRaceSlots} />
        <RaceSection title="Grey Hound" iconType="greyhound" slots={greyhoundSlots} />

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
                  padding: "6px 4px",
                  backgroundColor: isActive ? "#00b181" : "#254465",
                  border: "none",
                  borderRight: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  minHeight: 62,
                }}
              >
                {/* Icon + red badge wrapper */}
                <div style={{ position: "relative", display: "inline-flex", marginBottom: 3 }}>
                  {/* Sport icon (emoji) */}
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{cat.emoji}</span>
                  {/* Red badge count */}
                  {cat.count > 0 && (
                    <span style={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      backgroundColor: "#dc3545",
                      color: "white",
                      fontSize: 8,
                      fontWeight: 700,
                      borderRadius: "50%",
                      minWidth: 14,
                      height: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 2px",
                      lineHeight: 1,
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}>{cat.count}</span>
                  )}
                </div>
                {/* Label */}
                <span style={{
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  opacity: isActive ? 1 : 0.85,
                }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        {activeFilter === "Casino" ? (
          <CasinoSection />
        ) : (
          <div className="flex flex-col">
            {Object.entries(groupedMatches).map(([sport, sportMatches]: [string, any]) => {
              const sportIconClass = sport.toLowerCase().includes('cricket') ? 'svg-cricket' 
                                   : sport.toLowerCase().includes('football') || sport.toLowerCase().includes('soccer') ? 'svg-soccer' 
                                   : sport.toLowerCase().includes('tennis') ? 'svg-tennis' 
                                   : sport.toLowerCase().includes('horse') ? 'svg-horse'
                                   : 'svg-az-sport';

              return (
                <div key={sport} className="flex flex-col">
                  {/* Sport section header */}
                  <div
                    style={{
                      backgroundColor: "#e8eef4",
                      borderBottom: "1px solid #ccd9e5",
                      padding: "5px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={sportIconClass} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#212529" }}>{sport}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>Matched</span>
                  </div>
                  <div className="flex flex-col">
                    {sportMatches.map((match: any) => (
                      <BettingMatchCard 
                        key={match.id} 
                        match={match} 
                        onSelectBet={handleSelectBet} 
                        mongoOdds={allMongoOdds?.[match.id] || null}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {filteredMatches.length === 0 && !betfairLoading && !matchesLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 bg-[#254465]/5 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-[#254465]/20" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#254465]/40">No Matches Available</h3>
                <p className="text-xs text-[#254465]/30 mt-1">
                  {activeFilter === 'Inplay' 
                    ? 'No live or upcoming matches right now. Live matches will appear here automatically.'
                    : `No ${activeFilter} matches available right now.`}
                </p>
              </div>
            )}

            {filteredMatches.length === 0 && (betfairLoading || matchesLoading) && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Loader2 className="w-8 h-8 text-[#254465]/40 animate-spin mb-4" />
                <p className="text-xs text-[#254465]/40">Fetching live matches...</p>
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
