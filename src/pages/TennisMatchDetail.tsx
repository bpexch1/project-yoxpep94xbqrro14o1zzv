import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock } from "lucide-react";

interface TennisMatchDetailProps {
  match: any;
  clientData: any;
  session: any;
}

export default function TennisMatchDetail({ match, clientData, session }: TennisMatchDetailProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const clientBalance = clientData?.cash ?? 0;

  const { mutate: placeBet, isPending: isSubmitting } = useMutation({
    mutationFn: async (stake: number) => {
      if (!activeBet || !session || !clientData) return;
      if (stake > clientBalance) throw new Error("Insufficient balance");
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
      await Client.update(clientData.id, { cash: clientBalance - stake });
    },
    onSuccess: () => {
      setActiveBet(null);
      queryClient.invalidateQueries({ queryKey: ['client-data'] });
      queryClient.invalidateQueries({ queryKey: ['open-bets'] });
      toast({ title: "Bet Placed" });
    }
  });

  const matchTitle = match.title || `${match.team1} v ${match.team2}`;

  return (
    <div className="min-h-screen bg-[#e6f2fc] flex flex-col">
      <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="bg-[#254465] p-3 text-white">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/play')}><ArrowLeft size={20} /></button>
            <Clock size={14} className="text-white/60" />
            <span className="text-[11px] text-white/60">1 hour ago | Live Now</span>
          </div>
          <span className="text-[#00b181] font-black text-sm uppercase">Live</span>
        </div>
        <h1 className="font-black text-xl leading-tight my-1.5">{matchTitle}</h1>
      </div>

      <div className="bg-[#254465] p-2.5 flex gap-2">
        {["ALL", "Others"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-1.5 font-bold text-[13px] border-2 border-white/20 ${activeTab === tab ? "bg-[#00b181] text-white" : "text-white"}`}>
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        <TennisMarketHeader title="MATCH ODDS (MaxBet: 5M)" />
        <TennisPlayerRow name={match.team1} odds={match.back_odds || 1.85} layOdds={match.lay_odds || 1.87} onBet={(t, o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })} />
        <TennisPlayerRow name={match.team2} odds={match.back_odds2 || 1.95} layOdds={match.lay_odds2 || 1.98} onBet={(t, o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })} />

        <TennisMarketHeader title="MATCH WINNER" />
        <TennisPlayerRow name={match.team1} odds={1.82} layOdds={1.84} onBet={(t, o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })} />
        <TennisPlayerRow name={match.team2} odds={1.92} layOdds={1.94} onBet={(t, o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })} />

        <TennisMarketHeader title="SET BETTING" />
        <TennisPlayerRow name={`2-0 ${match.team1}`} odds={2.5} layOdds={2.6} onBet={(t, o) => setActiveBet({ match, selection: `2-0 ${match.team1}`, betType: t, odds: o })} />
        <TennisPlayerRow name={`2-0 ${match.team2}`} odds={2.8} layOdds={2.9} onBet={(t, o) => setActiveBet({ match, selection: `2-0 ${match.team2}`, betType: t, odds: o })} />
        <TennisPlayerRow name={`2-1 ${match.team1}`} odds={3.2} layOdds={3.4} onBet={(t, o) => setActiveBet({ match, selection: `2-1 ${match.team1}`, betType: t, odds: o })} />
        <TennisPlayerRow name={`2-1 ${match.team2}`} odds={3.5} layOdds={3.7} onBet={(t, o) => setActiveBet({ match, selection: `2-1 ${match.team2}`, betType: t, odds: o })} />

        <TennisScoreBoard match={match} />
      </main>

      <BetSlip bet={activeBet} onClose={() => setActiveBet(null)} onSubmit={(stake) => placeBet(stake)} isSubmitting={isSubmitting} />
    </div>
  );
}

function TennisMarketHeader({ title }: { title: string }) {
  return (
    <div className="flex items-stretch bg-[#254465]">
      <div className="flex-1 flex items-center gap-2 px-2.5 py-2">
        <div className="w-5.5 h-5.5 rounded-full bg-[#00b181] flex items-center justify-center shrink-0"><span className="text-white text-[11px] font-black">$</span></div>
        <span className="text-white font-black text-[13px] uppercase">{title}</span>
      </div>
      <div className="flex shrink-0">
        <div className="w-[50px] flex items-center justify-center bg-[#3d5a7a] border-l border-white/15"><span className="text-white font-black text-[13px]">BACK</span></div>
        <div className="w-[50px] flex items-center justify-center bg-[#3d5a7a] border-l border-white/15"><span className="text-white font-black text-[13px]">LAY</span></div>
      </div>
    </div>
  );
}

function TennisPlayerRow({ name, odds, layOdds, onBet }: { name: string; odds: number; layOdds: number; onBet: (type: 'back' | 'lay', odds: number) => void }) {
  return (
    <div className="flex items-stretch bg-[#dce8f3] border-b border-[#c4d9ea] min-h-[55px]">
      <div className="flex-1 flex items-center px-3.5 py-2"><span className="font-bold text-sm text-[#212529]">{name}</span></div>
      <div onClick={() => onBet('back', odds)} className="w-[50px] bg-[#72bbef] flex flex-col items-center justify-center cursor-pointer border-l border-white/30">
        <span className="font-black text-[20px] text-[#212529] leading-none">{odds.toFixed(2)}</span>
        <span className="text-[11px] text-[#212529]/70 mt-1">200K</span>
      </div>
      <div onClick={() => onBet('lay', layOdds)} className="w-[50px] bg-[#faa9ba] flex flex-col items-center justify-center cursor-pointer border-l border-white/30">
        <span className="font-black text-[20px] text-[#212529] leading-none">{layOdds.toFixed(2)}</span>
        <span className="text-[11px] text-[#212529]/70 mt-1">150K</span>
      </div>
    </div>
  );
}

function TennisScoreBoard({ match }: { match: any }) {
  return (
    <div className="bg-[#1a1a2e] p-4 text-white">
      <div className="max-w-md mx-auto bg-black/20 rounded p-4">
        <div className="grid grid-cols-[1fr_40px_40px_40px] gap-2 items-center border-b border-white/10 pb-2 mb-2">
          <span className="font-bold text-sm truncate flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            {match.team1}
          </span>
          <span className="text-center font-bold">1</span>
          <span className="text-center font-bold">6</span>
          <span className="text-center font-bold text-yellow-400">40</span>
        </div>
        <div className="grid grid-cols-[1fr_40px_40px_40px] gap-2 items-center">
          <span className="font-bold text-sm truncate px-4">{match.team2}</span>
          <span className="text-center font-bold">0</span>
          <span className="text-center font-bold">4</span>
          <span className="text-center font-bold">15</span>
        </div>
      </div>
    </div>
  );
}
