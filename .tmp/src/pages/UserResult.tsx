
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Bet } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { ChevronLeft, Loader2, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function UserResult() {
  const navigate = useNavigate();
  const session = getClientSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: bets, isLoading: betsLoading } = useQuery({
    queryKey: ["user-results", session?.username],
    queryFn: () => Bet.filter({ user_email: session?.username }),
    enabled: !!session?.username,
  });

  if (!session) {
    navigate("/login");
    return null;
  }

  const settledBets = (bets || [])
    .filter(bet => bet.status === "won" || bet.status === "lost")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-[#d6e4f0] text-[#1e3a5c]">
      <UserHeader
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="max-w-4xl mx-auto px-3 py-4 pb-12">
        <button
          onClick={() => navigate("/play")}
          className="flex items-center gap-1 text-[#1e3a5c] mb-4 hover:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#1e3a5c] rounded-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">Game Results</h1>
        </div>

        {betsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1e3a5c] animate-spin" />
          </div>
        ) : settledBets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No settled games</h3>
            <p className="text-gray-500 text-sm mt-1">Results for your completed bets will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settledBets.map((bet) => (
              <div key={bet.id} className="bg-white rounded-2xl shadow-sm border border-white/60 overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-1.5 w-full ${bet.status === 'won' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                        {format(new Date(bet.created_at), "MMM dd, yyyy")}
                      </span>
                      <h3 className="text-base font-black text-[#1e3a5c] leading-tight">{bet.match_title}</h3>
                    </div>
                    {bet.status === 'won' ? (
                      <div className="flex flex-col items-end">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase mt-1 tracking-widest">Winner</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <XCircle className="w-6 h-6 text-rose-500" />
                        <span className="text-[10px] font-bold text-rose-600 uppercase mt-1 tracking-widest">Settled</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Your Choice</p>
                      <p className="text-sm font-bold text-[#1e3a5c]">{bet.selection}</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase mt-0.5">{bet.bet_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Win/Loss</p>
                      <p className={`text-lg font-black ${bet.status === 'won' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {bet.status === 'won' ? '+' : '-'}₹{bet.status === 'won' ? (bet.potential_win - bet.stake).toLocaleString("en-IN") : bet.stake.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500 font-semibold px-1">
                    <span>Stake: ₹{bet.stake.toLocaleString("en-IN")}</span>
                    <span>Odds: {bet.odds}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
