import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Match, Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { getClientSession } from "@/hooks/useClientAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Info, Volume2, Clock, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keepDisplayOn, setKeepDisplayOn] = useState(true);

  const session = getClientSession();

  useEffect(() => {
    if (!session || session.role !== 'client') {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);

  // Fetch match details
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const results = await Match.list();
      return results.find((m: any) => m.id === matchId);
    },
    enabled: !!matchId
  });

  // Fetch real-time client data
  const { data: clients, isLoading: clientLoading } = useQuery({
    queryKey: ['client-data', session?.username],
    queryFn: () => Client.filter({ username: session?.username }),
    enabled: !!session?.username
  });

  const { data: openBets = [] } = useQuery({
    queryKey: ['open-bets', matchId, session?.username],
    queryFn: () => Bet.filter({ 
      user_email: session?.username,
      match_id: matchId,
      status: 'pending'
    }),
    enabled: !!session?.username && !!matchId,
    refetchInterval: 5000 // refresh every 5s
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
      toast({
        title: "Bet Placed Successfully!",
        description: "Good luck with your selection.",
      });
      setActiveBet(null);
      queryClient.invalidateQueries({ queryKey: ['client-data'] });
      queryClient.invalidateQueries({ queryKey: ['open-bets'] });
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

  if (matchLoading || clientLoading) {
    return (
      <div className="min-h-screen bg-[#d6e4f0] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1e3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#d6e4f0] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-[#1e3a5c] mb-2">Match Not Found</h2>
        <button 
          onClick={() => navigate('/play')}
          className="text-[#16a085] font-bold underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const tabs = ["ALL", "Bookmaker", "BetFair-Fancy", "Fancy-2"];

  const fancyBets = [
    { name: "1st Innings 6 Overs Line", backOdds: 46, layOdds: 45, backSize: "5.8M", laySize: "1.5M", label: "Book" },
  ];

  const fancy2Bets = [
    { name: "6 Over Run PZ", backOdds: 46, layOdds: 45, backSize: "100", laySize: "100", label: "Book" },
    { name: "1st Wkt Lost To PZ Balls", backOdds: 22, layOdds: 22, backSize: "90", laySize: "110", label: "Book" },
  ];

  return (
    <div className="min-h-screen bg-[#d6e4f0] text-[#1e3a5c] flex flex-col">
      <UserHeader 
        userEmail={session.username} 
        clientBalance={clientBalance}
        creditRemaining={creditRemaining}
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Back Button Bar */}
      <div className="bg-[#254465] px-3 py-2.5 flex items-center gap-3 sticky top-[88px] z-40 md:top-[112px]">
        <button 
          onClick={() => navigate('/play')}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-bold text-[15px] truncate">{matchTitle}</span>
      </div>

      <main className="flex flex-col flex-1 overflow-y-auto pb-24">
        {/* Match Info Card */}
        <div className="bg-white p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>30 minutes ago | Mar 25 2024 | Winners: 1</span>
            </div>
            {match.status === 'live' && (
              <span className="bg-[#16a085] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                INPLAY
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-black text-[#1e3a5c] leading-tight">
            {matchTitle}
          </h1>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[11px] font-bold uppercase">Elapsed: 00:00:00</span>
            <button 
              onClick={() => setKeepDisplayOn(!keepDisplayOn)}
              className="flex items-center gap-1.5 text-[#1e3a5c] text-[12px] font-bold"
            >
              {keepDisplayOn ? <CheckSquare className="w-4 h-4 text-[#16a085]" /> : <Square className="w-4 h-4" />}
              <span>Keep Display On</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-[#1e3a5c] overflow-x-auto no-scrollbar border-t border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-3 text-[13px] font-bold whitespace-nowrap transition-colors border-r border-white/5",
                activeTab === tab ? "bg-[#16a085] text-white" : "text-white/70 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Live Score Bar */}
        <div className="bg-[#254465] px-4 py-2.5 flex flex-col gap-1 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-white font-black text-[13px] tracking-wide">
              PZ 1/0 (1) <span className="text-white/50 ml-2">CRR: 1.00</span>
            </span>
            <span className="text-[#16a085] font-black text-[13px]">OVER</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-[11px] font-medium truncate">
              This Over : 1 0 0 0 0 - This Over : 1
            </span>
            <Volume2 className="w-4 h-4 text-white/40" />
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-px">
          {(activeTab === "ALL" || activeTab === "Bookmaker") && (
            <>
              {/* MATCH ODDS */}
              <div className="mt-2">
                <SectionHeader title="MATCH ODDS (MaxBet: 5M)" />
                <OddsColumnHeaders />
                <div className="flex flex-col bg-white">
                  <TeamRow 
                    name={match.team1} 
                    odds={match.back_odds} 
                    layOdds={match.lay_odds}
                    onBet={(type, o) => setActiveBet({ match, selection: match.team1, betType: type, odds: o })}
                  />
                  <TeamRow 
                    name={match.team2} 
                    odds={match.back_odds2 || match.back_odds} 
                    layOdds={match.lay_odds2 || match.lay_odds}
                    onBet={(type, o) => setActiveBet({ match, selection: match.team2, betType: type, odds: o })}
                  />
                </div>
              </div>

              {/* BOOKMAKER */}
              <div className="mt-2">
                <SectionHeader title="BOOKMAKER (MaxBet: 1M)" />
                <OddsColumnHeaders />
                <div className="flex flex-col bg-white">
                  <TeamRow 
                    name={match.team1} 
                    odds={Math.round((match.back_odds || 1.9) * 10) / 10} 
                    layOdds={Math.round((match.lay_odds || 2.0) * 10) / 10}
                    onBet={(type, o) => setActiveBet({ match, selection: match.team1, betType: type, odds: o })}
                  />
                  <TeamRow 
                    name={match.team2} 
                    odds={Math.round(((match.back_odds2 || match.back_odds || 2.1)) * 10) / 10} 
                    layOdds={Math.round(((match.lay_odds2 || match.lay_odds || 2.2)) * 10) / 10}
                    onBet={(type, o) => setActiveBet({ match, selection: match.team2, betType: type, odds: o })}
                  />
                </div>
              </div>
            </>
          )}

          {(activeTab === "ALL" || activeTab === "BetFair-Fancy") && (
            <div className="mt-2">
              <SectionHeader title="BETFAIR FANCY (MaxBet: 2M)" />
              <OddsColumnHeaders />
              <div className="flex flex-col bg-white">
                {fancyBets.map((fancy, idx) => (
                  <FancyRow 
                    key={idx} 
                    {...fancy} 
                    onBet={(type, o) => setActiveBet({ match, selection: fancy.name, betType: type, odds: o })}
                  />
                ))}
              </div>
            </div>
          )}

          {(activeTab === "ALL" || activeTab === "Fancy-2") && (
            <div className="mt-2">
              <SectionHeader title="FANCY 2 (MaxBet: 2M)" />
              <OddsColumnHeaders />
              <div className="flex flex-col bg-white">
                {fancy2Bets.map((fancy, idx) => (
                  <FancyRow 
                    key={idx} 
                    {...fancy} 
                    onBet={(type, o) => setActiveBet({ match, selection: fancy.name, betType: type, odds: o })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* OPEN BETS SECTION */}
          <div className="mt-2">
            {/* Section Header */}
            <div className="bg-[#1e3a5c] text-white flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#e67e22] flex items-center justify-center">
                  <span className="text-white text-[9px] font-black">!</span>
                </div>
                <span className="text-[13px] font-black uppercase tracking-wide">
                  OPEN BETS ({openBets.length})
                </span>
              </div>
            </div>

            {/* Bets List */}
            <div className="bg-white">
              {openBets.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-[13px] font-semibold">
                  No open bets for this match
                </div>
              ) : (
                openBets.map((bet: any) => (
                  <div key={bet.id} className="flex items-center border-b border-[#eef2f5] last:border-0 px-3 py-3 gap-3">
                    {/* Back/Lay badge */}
                    <div className={cn(
                      "w-10 h-7 rounded flex items-center justify-center text-[10px] font-black text-white shrink-0",
                      bet.bet_type === 'back' ? "bg-[#72bbef]" : "bg-[#faa9ba]"
                    )}>
                      {bet.bet_type === 'back' ? 'BACK' : 'LAY'}
                    </div>

                    {/* Selection name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#1e3a5c] truncate">{bet.selection}</p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        Odds: <span className="text-[#1e3a5c] font-black">{bet.odds}</span>
                      </p>
                    </div>

                    {/* Stake & P/L */}
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-black text-[#1e3a5c]">
                        Rs. {bet.stake?.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] font-bold text-[#16a085]">
                        Win: {bet.potential_win?.toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* BetSlip component (handles its own overlay) */}
      <BetSlip 
        bet={activeBet} 
        onClose={() => setActiveBet(null)} 
        onSubmit={(stake) => placeBet(stake)} 
        isSubmitting={isSubmitting} 
      />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#1e3a5c] text-white flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-[#16a085] flex items-center justify-center">
          <span className="text-white text-[9px] font-black">$</span>
        </div>
        <span className="text-[13px] font-black uppercase tracking-wide">{title}</span>
      </div>
      <div className="w-6 h-6 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 cursor-pointer transition-colors">
        <Info className="w-3.5 h-3.5 text-white/70" />
      </div>
    </div>
  );
}

function OddsColumnHeaders() {
  return (
    <div className="flex bg-[#e8f0f5] border-b border-[#ccd9e5]">
      <div className="flex-1" />
      <div className="w-[90px] bg-[#254465] text-white text-[11px] font-black text-center py-1.5 border-r border-white/5">BACK</div>
      <div className="w-[90px] bg-[#254465] text-white text-[11px] font-black text-center py-1.5">LAY</div>
    </div>
  );
}

interface TeamRowProps {
  name: string;
  odds: number;
  layOdds: number;
  onBet: (type: 'back' | 'lay', odds: number) => void;
}

function TeamRow({ name, odds, layOdds, onBet }: TeamRowProps) {
  return (
    <div className="flex items-center border-b border-[#ccd9e5] last:border-0 h-[64px]">
      <div className="flex-1 px-3">
        <span className="text-[14px] font-black text-[#1e3a5c] uppercase">{name}</span>
      </div>
      <div 
        onClick={() => onBet('back', odds)}
        className="w-[90px] h-full bg-[#72bbef] flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all border-r border-white/20"
      >
        <span className="text-[17px] font-black text-[#1e3a5c] leading-none">{(odds || 1.5).toFixed(2)}</span>
        <span className="text-[10px] font-bold text-[#1e3a5c]/60 mt-0.5">{(Math.random() * 100).toFixed(0)}</span>
      </div>
      <div 
        onClick={() => onBet('lay', layOdds)}
        className="w-[90px] h-full bg-[#faa9ba] flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all"
      >
        <span className="text-[17px] font-black text-[#1e3a5c] leading-none">{(layOdds || 1.5).toFixed(2)}</span>
        <span className="text-[10px] font-bold text-[#1e3a5c]/60 mt-0.5">{(Math.random() * 100).toFixed(0)}</span>
      </div>
    </div>
  );
}

interface FancyRowProps {
  name: string;
  backOdds: number;
  layOdds: number;
  backSize: string;
  laySize: string;
  label: string;
  onBet: (type: 'back' | 'lay', odds: number) => void;
}

function FancyRow({ name, backOdds, layOdds, backSize, laySize, label, onBet }: FancyRowProps) {
  return (
    <div className="flex items-center border-b border-[#ccd9e5] last:border-0 h-[64px]">
      <div className="flex-1 px-3 flex flex-col justify-center">
        <span className="text-[13px] font-bold text-[#1e3a5c]">{name}</span>
        <span className="text-[#16a085] font-black text-[11px] uppercase cursor-pointer hover:underline mt-0.5">
          {label}
        </span>
      </div>
      <div 
        onClick={() => onBet('back', backOdds)}
        className="w-[90px] h-full bg-[#72bbef] flex flex-col items-center justify-center border-r border-white/20 cursor-pointer hover:brightness-95 transition-all"
      >
        <span className="text-[17px] font-black text-[#1e3a5c] leading-none">{backOdds}</span>
        <span className="text-[10px] font-bold text-[#1e3a5c]/60 mt-0.5">{backSize}</span>
      </div>
      <div 
        onClick={() => onBet('lay', layOdds)}
        className="w-[90px] h-full bg-[#faa9ba] flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all"
      >
        <span className="text-[17px] font-black text-[#1e3a5c] leading-none">{layOdds}</span>
        <span className="text-[10px] font-bold text-[#1e3a5c]/60 mt-0.5">{laySize}</span>
      </div>
    </div>
  );
}
