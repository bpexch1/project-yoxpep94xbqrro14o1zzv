
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { Bet, Client } from "@/entities";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { ChevronLeft, Loader2, BarChart3, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function UserProfitLoss() {
  const navigate = useNavigate();
  const session = getClientSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: bets, isLoading: betsLoading } = useQuery({
    queryKey: ["user-pl-data", session?.username],
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

  const settledBets = (bets || []).filter(bet => bet.status === "won" || bet.status === "lost");
  
  const totalWon = settledBets
    .filter(b => b.status === "won")
    .reduce((acc, b) => acc + (b.potential_win - b.stake), 0);
    
  const totalLost = settledBets
    .filter(b => b.status === "lost")
    .reduce((acc, b) => acc + b.stake, 0);
    
  const netPL = totalWon - totalLost;

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
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">Profit & Loss Analysis</h1>
        </div>

        {betsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1e3a5c] animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <TrendingUp className="w-16 h-16" />
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Profits</p>
                <p className="text-2xl font-black text-emerald-600">₹{totalWon.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-emerald-500 font-bold mt-2">FROM {settledBets.filter(b => b.status === 'won').length} WINNING BETS</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <TrendingDown className="w-16 h-16" />
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Losses</p>
                <p className="text-2xl font-black text-rose-600">₹{totalLost.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-rose-500 font-bold mt-2">FROM {settledBets.filter(b => b.status === 'lost').length} LOST BETS</p>
              </div>

              <div className={`rounded-2xl p-6 shadow-lg relative overflow-hidden ${netPL >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet className="w-16 h-16" />
                </div>
                <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mb-1">Net Performance</p>
                <p className="text-2xl font-black">₹{netPL.toLocaleString("en-IN")}</p>
                <p className="text-[10px] opacity-80 font-bold mt-2">CURRENT LIFETIME P/L</p>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-white/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Match-wise Breakdown</h2>
                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">Settled Only</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Match Name</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Stake</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Result</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Net P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {settledBets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm italic">
                          No performance data available yet.
                        </td>
                      </tr>
                    ) : (
                      settledBets.map((bet) => (
                        <tr key={bet.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-[#1e3a5c] line-clamp-1">{bet.match_title}</p>
                            <p className="text-[9px] text-gray-400 uppercase font-bold mt-0.5">{bet.selection}</p>
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-semibold text-gray-500">
                            ₹{bet.stake.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${bet.status === 'won' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {bet.status}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-black ${bet.status === 'won' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {bet.status === 'won' ? '+' : '-'}₹{bet.status === 'won' ? (bet.potential_win - bet.stake).toLocaleString("en-IN") : bet.stake.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
