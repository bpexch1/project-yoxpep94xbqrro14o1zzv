
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { ChevronLeft, Loader2, History, Filter } from "lucide-react";
import { format } from "date-fns";

export default function UserBetHistory() {
  const navigate = useNavigate();
  const session = getClientSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: bets, isLoading: betsLoading } = useQuery({
    queryKey: ["user-bets", session?.username],
    queryFn: () => Bet.filter({ user_email: session?.username }),
    enabled: !!session?.username,
  });

  const { data: clientData } = useQuery({
    queryKey: ["client-profile", session?.username],
    queryFn: async () => {
      const clients = await Client.filter({ username: session?.username });
      return clients?.[0];
    },
    enabled: !!session?.username,
  });

  if (!session) {
    navigate("/login");
    return null;
  }

  const filteredBets = (bets || []).filter(bet => {
    if (statusFilter === "all") return true;
    return bet.status === statusFilter;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "won": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "lost": return "text-rose-600 bg-rose-50 border-rose-100";
      case "pending": return "text-amber-600 bg-amber-50 border-amber-100";
      case "cancelled": return "text-gray-600 bg-gray-50 border-gray-100";
      default: return "text-blue-600 bg-blue-50 border-blue-100";
    }
  };

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

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1e3a5c] rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Bet History</h1>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-200">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none cursor-pointer"
            >
              <option value="all">All Bets</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {betsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1e3a5c] animate-spin" />
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No bets found</h3>
            <p className="text-gray-500 text-sm mt-1">You haven't placed any bets yet.</p>
            <button 
              onClick={() => navigate("/play")}
              className="mt-6 px-6 py-2 bg-[#1e3a5c] text-white rounded-lg text-sm font-bold"
            >
              Start Betting
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBets.map((bet) => (
              <div key={bet.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-white/60">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {format(new Date(bet.created_at), "MMM dd, yyyy • hh:mm a")}
                    </span>
                    <h3 className="text-sm font-bold text-[#1e3a5c]">{bet.match_title}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(bet.status)}`}>
                    {bet.status || "pending"}
                  </span>
                </div>
                
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Selection</p>
                    <p className="text-sm font-bold text-[#1e3a5c]">{bet.selection}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Type</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${bet.bet_type === 'back' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {bet.bet_type?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Odds</p>
                    <p className="text-sm font-bold text-[#1e3a5c]">{bet.odds}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Stake</p>
                    <p className="text-sm font-bold text-[#1e3a5c]">₹{bet.stake?.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {bet.status !== 'pending' && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">P/L Amount</span>
                    <span className={`text-sm font-bold ${bet.status === 'won' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {bet.status === 'won' ? '+' : '-'}{bet.status === 'won' ? (bet.potential_win - bet.stake).toLocaleString("en-IN") : bet.stake.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
