import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Match, Bet, Client } from "@/entities";
import { fetchBetfairEvents } from "@/functions";
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

  // Fetch live Betfair events
  const { data: betfairEvents, isLoading: betfairLoading } = useQuery({
    queryKey: ['betfair-events'],
    queryFn: () => fetchBetfairEvents({}),
    refetchInterval: 30000, // Refresh every 30 seconds
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

  if ((matchesLoading && !matches) || clientLoading) {
    return (
      <div className="min-h-screen bg-[#e6f2fc] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#254465] animate-spin" />
      </div>
    );
  }

  const matchesList = [
    ...(betfairEvents || []),
    ...(matches || []).filter((m: any) => 
      !(betfairEvents || []).some((bf: any) => bf.title === (m.title || `${m.team1} v ${m.team2}`))
    )
  ];
  
  const categories = [
    { id: "Inplay", label: "Inplay", iconClass: "svg-live-betting", count: matchesList.filter((m: any) => m.status === 'live').length },
    { id: "Cricket", label: "Cricket", iconClass: "svg-cricket", count: matchesList.filter((m: any) => m.sport?.toLowerCase() === 'cricket').length },
    { id: "Tennis", label: "Tennis", iconClass: "svg-tennis", count: matchesList.filter((m: any) => m.sport?.toLowerCase() === 'tennis').length },
    { id: "Soccer", label: "Soccer", iconClass: "svg-soccer", count: matchesList.filter((m: any) => m.sport?.toLowerCase() === 'football' || m.sport?.toLowerCase() === 'soccer').length },
  ];

  const filteredMatches = matchesList.filter((m: any) => {
    if (activeFilter === "Inplay") return true; // Show all when Inplay is active
    const sport = m.sport?.toLowerCase();
    const filter = activeFilter.toLowerCase();
    if (filter === 'soccer') return sport === 'football' || sport === 'soccer';
    return sport === filter;
  });

  const groupedMatches = filteredMatches.reduce((acc: any, match: any) => {
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
          padding: "9px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          fontSize: 15,
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
        <RaceSection title="Horse Race" iconClass="svg-horse" slots={horseRaceSlots} />
        <RaceSection title="Grey Hound" iconClass="svg-greyhound-racing" slots={greyhoundSlots} />

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
                  minHeight: 70,
                }}
              >
                {/* Count number - italic top */}
                <span style={{
                  color: "white",
                  fontStyle: "italic",
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: 1,
                  marginBottom: 4,
                  opacity: 0.9,
                }}>{cat.count}</span>

                {/* Sport icon - white colored using filter */}
                <span
                  className={cat.iconClass}
                  style={{
                    filter: "brightness(0) invert(1)",
                    marginBottom: 3,
                    display: "inline-block",
                  }}
                />

                {/* Label */}
                <span style={{
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  opacity: isActive ? 1 : 0.8,
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
                      padding: "7px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={sportIconClass} />
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>{sport}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>Matched</span>
                  </div>
                  <div className="flex flex-col">
                    {sportMatches.map((match: any) => (
                      <BettingMatchCard 
                        key={match.id} 
                        match={match} 
                        onSelectBet={handleSelectBet} 
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {filteredMatches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 bg-[#254465]/5 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-[#254465]/20" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#254465]/40">No Matches Found</h3>
                <p className="text-xs text-[#254465]/30 mt-1">There are currently no active matches for this category.</p>
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
