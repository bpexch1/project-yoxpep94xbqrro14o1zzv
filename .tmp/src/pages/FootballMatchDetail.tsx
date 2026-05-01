import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { BetSlip } from "@/components/user/BetSlip";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Volume2 } from "lucide-react";

interface FootballMatchDetailProps {
  match: any;
  clientData: any;
  session: any;
}

export default function FootballMatchDetail({ match, clientData, session }: FootballMatchDetailProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeBet, setActiveBet] = useState<{ match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keepDisplayOn, setKeepDisplayOn] = useState(true);

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
      toast({ title: "Bet Placed", description: "Your bet has been recorded successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Bet Failed", description: error.message });
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
            <span className="text-[11px] text-white/60">3 hours ago | May 01 6:00 pm | Winners: 1</span>
          </div>
          <span className="text-[#00b181] font-black text-sm tracking-wider">INPLAY</span>
        </div>
        <h1 className="font-black text-xl leading-tight my-1.5">{matchTitle}</h1>
        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-[13px]">Remaining : 00:42:15</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <input type="checkbox" checked={keepDisplayOn} onChange={(e) => setKeepDisplayOn(e.target.checked)} className="w-4 h-4 accent-blue-500" />
          <span className="text-[13px]">Keep Display On</span>
        </div>
      </div>

      <div className="bg-[#254465] p-2.5 flex gap-2 overflow-x-auto no-scrollbar">
        {["ALL", "Others"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-1.5 font-bold text-[13px] border-2 border-white/20 transition-colors ${activeTab === tab ? "bg-[#00b181] text-white" : "text-white"}`}>
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        <FootballCombinedSectionHeader title="MATCH ODDS (MaxBet: 1M)" />
        <FootballTeamRow name={match.team1} odds={match.back_odds || 2.1} layOdds={match.lay_odds || 2.12} onBet={(t, o) => setActiveBet({ match, selection: match.team1, betType: t, odds: o })} />
        <FootballTeamRow name={match.team2} odds={match.back_odds2 || 3.4} layOdds={match.lay_odds2 || 3.45} onBet={(t, o) => setActiveBet({ match, selection: match.team2, betType: t, odds: o })} />
        <FootballTeamRow name="The Draw" odds={3.85} layOdds={3.9} onBet={(t, o) => setActiveBet({ match, selection: "The Draw", betType: t, odds: o })} />

        <div className="bg-white p-3 border-y border-gray-200">
          <span className="text-red-600 font-black text-sm">LIVE VIDEO AVAILABLE</span>
        </div>

        <GoalsSection title="OVER/UNDER 0.5 GOALS (MaxBet: 250K)" underOdds={13} underLay={14.5} overOdds={1.07} overLay={1.09} onBet={(s, t, o) => setActiveBet({ match, selection: s, betType: t, odds: o })} />
        <GoalsSection title="OVER/UNDER 1.5 GOALS (MaxBet: 250K)" underOdds={3.85} underLay={3.95} overOdds={1.34} overLay={1.35} onBet={(s, t, o) => setActiveBet({ match, selection: s, betType: t, odds: o })} />
        <GoalsSection title="OVER/UNDER 2.5 GOALS (MaxBet: 250K)" underOdds={1.98} underLay={1.99} overOdds={2.0} overLay={2.04} onBet={(s, t, o) => setActiveBet({ match, selection: s, betType: t, odds: o })} />

        <div className="mt-0">
          <div className="flex border-b border-[#dde4ea]">
            <button className="flex-1 py-2.5 bg-[#00b181] text-white font-bold text-[15px]">Tv</button>
            <button className="flex-1 py-2.5 bg-[#00b181] text-white font-bold text-[15px]">Score Card</button>
          </div>
          <FootballScoreCard match={match} />
        </div>
      </main>

      <BetSlip bet={activeBet} onClose={() => setActiveBet(null)} onSubmit={(stake) => placeBet(stake)} isSubmitting={isSubmitting} />
    </div>
  );
}

function FootballCombinedSectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-stretch bg-[#254465]">
      <div className="flex-1 flex items-center gap-2 px-2.5 py-2">
        <div className="w-5.5 h-5.5 rounded-full bg-[#00b181] flex items-center justify-center shrink-0">
          <span className="text-white text-[11px] font-black">$</span>
        </div>
        <span className="text-white font-black text-[13px] uppercase">{title}</span>
      </div>
      <div className="flex shrink-0">
        <div className="w-[50px] flex items-center justify-center bg-[#3d5a7a]">
          <span className="text-white font-black text-[13px] tracking-widest">BACK</span>
        </div>
        <div className="w-[50px] flex items-center justify-center bg-[#3d5a7a] border-l border-white/15">
          <span className="text-white font-black text-[13px] tracking-widest">LAY</span>
        </div>
      </div>
    </div>
  );
}

function FootballTeamRow({ name, odds, layOdds, onBet }: { name: string; odds: number; layOdds: number; onBet: (type: 'back' | 'lay', odds: number) => void }) {
  const backSize = `${(Math.random() * 500 + 100).toFixed(1)}K`;
  const laySize = `${(Math.random() * 800 + 200).toFixed(1)}K`;
  return (
    <div className="flex items-stretch bg-[#dce8f3] border-b border-[#c4d9ea] min-h-[60px]">
      <div className="flex-1 flex items-center px-3.5 py-2">
        <span className="font-bold text-base text-[#212529]">{name}</span>
      </div>
      <div onClick={() => onBet('back', odds)} className="w-[50px] bg-[#72bbef] flex flex-col items-center justify-center cursor-pointer">
        <span className="font-black text-[20px] text-[#212529] leading-none">{odds.toFixed(2)}</span>
        <span className="text-[11px] text-[#212529]/70 mt-1">{backSize}</span>
      </div>
      <div onClick={() => onBet('lay', layOdds)} className="w-[50px] bg-[#faa9ba] flex flex-col items-center justify-center cursor-pointer border-l border-white/30">
        <span className="font-black text-[20px] text-[#212529] leading-none">{layOdds.toFixed(2)}</span>
        <span className="text-[11px] text-[#212529]/70 mt-1">{laySize}</span>
      </div>
    </div>
  );
}

function GoalsSection({ title, underOdds, underLay, overOdds, overLay, onBet }: any) {
  return (
    <>
      <FootballCombinedSectionHeader title={title} />
      <FootballTeamRow name={`Under ${title.split(' ')[1]}`} odds={underOdds} layOdds={underLay} onBet={(t, o) => onBet(`Under ${title.split(' ')[1]}`, t, o)} />
      <FootballTeamRow name={`Over ${title.split(' ')[1]}`} odds={overOdds} layOdds={overLay} onBet={(t, o) => onBet(`Over ${title.split(' ')[1]}`, t, o)} />
    </>
  );
}

function FootballScoreCard({ match }: { match: any }) {
  return (
    <div className="bg-[#1a1a2e] p-4 text-white flex flex-col items-center">
      <div className="text-[13px] font-bold text-white/80 mb-4">01 MAY | 18:00</div>
      <div className="flex justify-between items-center w-full max-w-sm mb-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">⚽</span>
          <span className="font-bold text-sm uppercase">{match.team1 || 'Team A'}</span>
          <span className="text-[11px] text-white/50">MAN</span>
        </div>
        <div className="flex gap-4">
          {[ 
            { val: '00', label: 'DAYS' },
            { val: '18', label: 'HRS' },
            { val: '42', label: 'MINS' },
            { val: '15', label: 'SECS' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-white/10 rounded border border-white/5 flex items-center justify-center font-bold text-lg">{item.val}</div>
              <span className="text-[9px] text-white/40 font-bold">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">⚽</span>
          <span className="font-bold text-sm uppercase">{match.team2 || 'Team B'}</span>
          <span className="text-[11px] text-white/50">MON</span>
        </div>
      </div>
      <div className="w-full max-w-md h-32 bg-green-900/40 rounded-lg border border-white/10 relative overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border border-white/20 rounded-full" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] text-white/40">2x45 min</div>
      </div>
      <div className="w-full max-w-md bg-white/5 p-2 rounded flex justify-between text-[11px] text-white/60">
        <span>Referee: M. Oliver</span>
        <span>Manager: P. Guardiola / J. Klopp</span>
      </div>
    </div>
  );
}
