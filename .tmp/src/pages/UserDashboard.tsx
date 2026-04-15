import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Match, Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { BettingMatchCard } from "@/components/user/BettingMatchCard";
import { BetSlip } from "@/components/user/BetSlip";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("All");
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

  // Fetch real-time client data for balance
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
        match_title: activeBet.match.title,
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
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  const filteredMatches = (matches || []).filter((m: any) => {
    if (activeFilter === "All") return true;
    return m.sport?.toLowerCase() === activeFilter.toLowerCase();
  });

  const liveMatches = filteredMatches.filter((m: any) => m.status === 'live');
  const upcomingMatches = filteredMatches.filter((m: any) => m.status === 'upcoming');

  const handleSelectBet = (match: any, selection: string, betType: 'back' | 'lay', odds: number) => {
    setActiveBet({ match, selection, betType, odds });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <UserHeader 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
        userEmail={session.username} 
        clientBalance={clientBalance}
      />
      
      <main className="container mx-auto px-4 py-6">
        {/* Live Matches section */}
        {liveMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-amber-400 font-black text-lg uppercase tracking-wider">
                Live Matches
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveMatches.map((match: any) => (
                <BettingMatchCard 
                  key={match.id} 
                  match={match} 
                  onSelectBet={handleSelectBet} 
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Upcoming Matches section */}
        <div>
          <h2 className="text-gray-400 font-black text-lg uppercase tracking-wider mb-4">
            📅 Upcoming Events
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match: any) => (
              <BettingMatchCard 
                key={match.id} 
                match={match} 
                onSelectBet={handleSelectBet} 
              />
            ))}
          </div>
        </div>
        
        {/* Empty state if no matches */}
        {filteredMatches.length === 0 && (
          <div className="text-center py-20 bg-[#111827] border border-[#1e2d47] rounded-2xl">
            <p className="text-gray-500 font-bold uppercase tracking-widest">
              No matches available in {activeFilter}
            </p>
          </div>
        )}
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
