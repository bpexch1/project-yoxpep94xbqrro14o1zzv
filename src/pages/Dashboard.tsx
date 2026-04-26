import { useQuery } from "@tanstack/react-query";
import { Client, Bet } from "@/entities";
import { Users, TrendingUp, TrendingDown, Clock, Search, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClientSession } from "@/hooks/useClientAuth";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const session = getClientSession();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ["dashboard-clients"],
    queryFn: () => Client.list("-created_at"),
  });

  const { data: recentBets, isLoading: isBetsLoading } = useQuery({
    queryKey: ["dashboard-recent-bets"],
    queryFn: () => Bet.list("-created_at", 10),
  });

  const stats = [
    { label: "Total Users", value: clients?.filter(c => c.role !== 'company').length || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Bets", value: recentBets?.filter(b => b.status === 'pending').length || 0, icon: Clock, color: "text-[#3DCCC8]", bg: "bg-[#3DCCC8]/10" },
    { label: "Settled Today", value: 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending P/L", value: "₹ 0", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
  ];

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) navigate(`/accounts?search=${searchQuery}`);
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-[#e9ecef]" style={{ fontFamily: "Roboto, sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[#212529] mb-2">Welcome Back, {session?.username}</h1>
          <p className="text-[#6c757d]">Here's what's happening in your exchange today.</p>
        </header>

        {/* Quick Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-[#dee2e6] mb-8">
          <form onSubmit={handleUserSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Quickly find a user by username..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border border-[#ced4da] rounded px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:border-[#3DCCC8] text-[#2c3e50] bg-white"
              />
            </div>
            <button 
              type="submit"
              className="bg-[#3DCCC8] text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 hover:bg-[#2db8b4] transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-[#dee2e6] flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#6c757d] uppercase mb-1">{stat.label}</p>
                <p className="text-xl font-black text-[#212529]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-[#dee2e6] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#dee2e6] flex items-center justify-between">
              <h2 className="font-bold text-[#212529]">Recent Bets</h2>
              <button 
                onClick={() => navigate("/reports/book-detail")}
                className="bg-[#3DCCC8] text-white text-xs px-3 py-0.5 rounded hover:bg-[#2db8b4] transition-colors"
              >
                View All
              </button>
            </div>
            <div className="p-0">
              {isBetsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-[#3DCCC8] animate-spin" />
                  <p className="text-xs font-bold text-[#6c757d] mt-2 uppercase">Loading Activity...</p>
                </div>
              ) : recentBets && recentBets.length > 0 ? (
                <div className="divide-y divide-[#f1f1f1]">
                  {recentBets.map((bet: any) => (
                    <div key={bet.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                      <div>
                        <p className="text-sm font-bold text-[#212529]">{bet.match_title}</p>
                        <p className="text-[11px] text-[#6c757d]">User: <span className="font-bold">{bet.user_email}</span> • {new Date(bet.created_at).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-black", bet.type === 'back' ? "text-blue-600" : "text-pink-600")}>
                          {bet.type === 'back' ? 'BACK' : 'LAY'} • {bet.stake}
                        </p>
                        <p className="text-[10px] text-[#6c757d] uppercase font-bold">{bet.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-sm font-bold text-[#6c757d] uppercase">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* User Status */}
          <div className="bg-white rounded-lg shadow-sm border border-[#dee2e6] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#dee2e6] flex items-center justify-between">
              <h2 className="font-bold text-[#212529]">Top Users</h2>
              <span 
                onClick={() => navigate("/accounts")}
                className="text-[#3DCCC8] text-sm font-normal cursor-pointer hover:underline"
              >
                Manage All
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-[#e9ecef]">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3DCCC8] mt-1" />
                <div>
                  <h3 className="text-sm font-bold text-[#212529] mb-1">Exchange Status: Normal</h3>
                  <p className="text-xs text-[#6c757d]">All systems are operational. Real-time odds and settlements are running normally across all sports markets.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
