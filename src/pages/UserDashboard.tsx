import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { User, Match, Bet } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { BettingMatchCard } from "@/components/user/BettingMatchCard";
import { BetSlip } from "@/components/user/BetSlip";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, History, LayoutDashboard, Search } from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedBet, setSelectedBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const u = await User.me();
        setCurrentUser(u);
      } catch (error) {
        navigate("/");
      }
    }
    checkAuth();
  }, [navigate]);

  const { data: matches, isLoading: loadingMatches } = useQuery({
    queryKey: ["matches"],
    queryFn: () => Match.list("-created_at"),
  });

  const { data: myBets, isLoading: loadingBets } = useQuery({
    queryKey: ["my-bets", currentUser?.email],
    queryFn: () => currentUser ? Bet.filter({ user_email: currentUser.email }, "-created_at") : Promise.resolve([]),
    enabled: !!currentUser,
  });

  const handleSelectBet = (match: any, selection: string, betType: 'back' | 'lay', odds: number) => {
    setSelectedBet({ match, selection, betType, odds });
  };

  const handlePlaceBet = async (stake: number) => {
    if (!selectedBet || !currentUser) return;
    setIsSubmitting(true);
    try {
      const potentialWin = (stake * selectedBet.odds) - stake;
      await Bet.create({
        user_email: currentUser.email,
        match_id: selectedBet.match.id,
        match_title: selectedBet.match.title,
        selection: selectedBet.selection,
        bet_type: selectedBet.betType,
        stake: stake,
        odds: selectedBet.odds,
        potential_win: potentialWin,
        status: "pending",
      });
      
      queryClient.invalidateQueries({ queryKey: ["my-bets"] });
      toast({
        title: "Bet Placed Successfully!",
        description: `Rs. ${stake} placed on ${selectedBet.selection} @ ${selectedBet.odds}`,
      });
      setSelectedBet(null);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Failed to place bet",
        description: "Please check your balance and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMatches = matches?.filter(m => {
    if (activeFilter === "All") return true;
    return m.sport?.toLowerCase() === activeFilter.toLowerCase();
  });

  if (!currentUser) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white selection:bg-amber-500/30">
      <UserHeader 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
        userEmail={currentUser.email} 
      />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Tabs defaultValue="matches" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-[#0d1526] border border-[#1e2d47] p-1">
              <TabsTrigger value="matches" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Live Matches
              </TabsTrigger>
              <TabsTrigger value="my-bets" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold flex items-center gap-2">
                <History className="w-4 h-4" />
                My Bets
              </TabsTrigger>
            </TabsList>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500 bg-[#0d1526] px-4 py-2 rounded-lg border border-[#1e2d47]">
              <Search className="w-3 h-3" />
              SEARCH MATCHES...
            </div>
          </div>

          <TabsContent value="matches" className="mt-0">
            {loadingMatches ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-64 bg-[#111827] animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredMatches?.length === 0 ? (
              <div className="text-center py-20 bg-[#111827] rounded-3xl border border-[#1e2d47]">
                <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400">No active matches found</h3>
                <p className="text-gray-600">Please check back later or try a different filter</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredMatches?.map(match => (
                  <BettingMatchCard 
                    key={match.id} 
                    match={match} 
                    onSelectBet={handleSelectBet} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-bets" className="mt-0">
            {loadingBets ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-[#111827] animate-pulse rounded-xl" />
                ))}
              </div>
            ) : myBets?.length === 0 ? (
              <div className="text-center py-20 bg-[#111827] rounded-3xl border border-[#1e2d47]">
                <History className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400">No bets placed yet</h3>
                <p className="text-gray-600">Start exploring live matches to place your first bet!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBets?.map((bet: any) => (
                  <div 
                    key={bet.id} 
                    className="bg-[#111827] border border-[#1e2d47] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{bet.match_title}</span>
                        <div className={cn(
                          "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                          bet.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                          bet.status === 'won' ? "bg-green-500/10 text-green-500" :
                          bet.status === 'lost' ? "bg-red-500/10 text-red-500" :
                          "bg-gray-500/10 text-gray-500"
                        )}>
                          {bet.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{bet.selection}</span>
                        <div className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-black uppercase",
                          bet.bet_type === 'back' ? "bg-blue-500 text-white" : "bg-pink-500 text-white"
                        )}>
                          {bet.bet_type}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:flex items-center gap-6 text-center sm:text-right">
                      <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Stake</div>
                        <div className="text-white font-black">Rs. {bet.stake}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Odds</div>
                        <div className="text-amber-400 font-black">{bet.odds?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Profit</div>
                        <div className="text-green-400 font-black">Rs. {bet.potential_win?.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Overlay for BetSlip when active */}
      <AnimatePresence>
        {selectedBet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBet(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          />
        )}
      </AnimatePresence>

      <BetSlip 
        bet={selectedBet} 
        onClose={() => setSelectedBet(null)} 
        onSubmit={handlePlaceBet}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
