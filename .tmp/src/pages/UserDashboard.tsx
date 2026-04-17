import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Match, Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { BettingMatchCard } from "@/components/user/BettingMatchCard";
import { BetSlip } from "@/components/user/BetSlip";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { GameBanners } from "@/components/user/GameBanners";
import { RaceSection } from "@/components/user/RaceSection";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Clock, 
  Ticket, 
  Rocket, 
  Tent, 
  Trophy, 
  Volleyball, 
  Disc,
  Gamepad2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    queryFn: () => Match.list()
  });

  // Fetch real-time client data for balance and credits
  const { data: clients, isLoading: clientLoading } = useQuery({
    queryKey: ['client-data', session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username
  });

  const clientData = clients?.[0];
  const clientBalance = clientData?.cash ?? 0;
  const creditRemaining = clientData?.credit_remaining ?? 0;

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
      toast({
        title: "Bet Placed Successfully!",
        description: "Good luck with your selection.",
      });
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

  if (matchesLoading || clientLoading) {
    return (
      <div className="min-h-screen bg-[#d6e4f0] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1e3a5c] animate-spin" />
      </div>
    );
  }

  const matchesList = matches || [];
  
  const categories = [
    { id: "Inplay", label: "Inplay", icon: Clock, count: matchesList.filter((m: any) => m.status === 'live').length },
    { id: "Cricket", label: "Cricket", icon: Ticket, count: matchesList.filter((m: any) => m.sport?.toLowerCase() === 'cricket').length },
    { id: "Tennis", label: "Tennis", icon: Tent, count: matchesList.filter((m: any) => m.sport?.toLowerCase() === 'tennis').length },
    { id: "Soccer", label: "Soccer", icon: Rocket, count: matchesList.filter((m: any) => m.sport?.toLowerCase() === 'football' || m.sport?.toLowerCase() === 'soccer').length },
  ];

  const filteredMatches = matchesList.filter((m: any) => {
    if (activeFilter === "Inplay") return true; // Show all when Inplay is active per bpexch logic
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

  const getTabBg = (catId: string, isActive: boolean) => {
    if (catId === 'Inplay' && isActive) return 'bg-[#16a085]';
    if (catId === 'Soccer') return 'bg-[#111111]';
    return isActive ? 'bg-[#1e3a5c]' : 'bg-[#254465]';
  };

  return (
    <div className="min-h-screen bg-[#d6e4f0] text-[#1e3a5c]">
      <UserHeader 
        userEmail={session.username} 
        clientBalance={clientBalance}
        creditRemaining={creditRemaining}
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLoadBalance={() => queryClient.invalidateQueries({ queryKey: ['client-data'] })}
      />

      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="flex flex-col">
        {/* Game Banners */}
        <GameBanners />

        {/* Race Sections */}
        <RaceSection title="Horse Race" icon={Trophy} slots={horseRaceSlots} />
        <RaceSection title="Grey Hound" icon={Disc} slots={greyhoundSlots} />

        {/* Sport Category Tabs */}
        <div className="grid grid-cols-4 w-full bg-[#254465]">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 relative transition-all border-r border-white/5",
                  getTabBg(cat.id, isActive)
                )}
              >
                <span className="text-white font-black text-[13px] leading-none mb-0.5">
                  {cat.count}
                </span>
                <Icon className={cn("w-5 h-5 mb-0.5", isActive ? "text-white" : "text-white/60")} />
                <span className={cn("text-[9px] font-bold uppercase tracking-widest", isActive ? "text-white" : "text-white/60")}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Match List grouped by sport */}
        <div className="flex flex-col pb-20">
          {Object.entries(groupedMatches).map(([sport, sportMatches]: [string, any]) => {
            // Pick an icon based on sport name
            let SportIcon = Volleyball;
            if (sport.toLowerCase().includes('cricket')) SportIcon = Trophy;
            if (sport.toLowerCase().includes('football') || sport.toLowerCase().includes('soccer')) SportIcon = Gamepad2;

            return (
              <div key={sport} className="flex flex-col">
                <div className="bg-[#e8f0f5] border-b border-[#ccd9e5] px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SportIcon className="w-5 h-5 text-[#1e3a5c]" />
                    <span className="text-[#1e3a5c] font-bold text-[13px]">{sport}</span>
                  </div>
                  <span className="text-[#1e3a5c]/50 font-bold text-[11px] uppercase tracking-wider">Matched</span>
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
              <div className="w-16 h-16 bg-[#1e3a5c]/5 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-[#1e3a5c]/20" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1e3a5c]/40">No Matches Found</h3>
              <p className="text-xs text-[#1e3a5c]/30 mt-1">There are currently no active matches for this category.</p>
            </div>
          )}
        </div>
      </main>
      
      {/* BetSlip modal overlay */}
      {activeBet && (
        <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none pointer-events-none">
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
