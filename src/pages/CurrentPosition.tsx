import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Search, Loader2, RefreshCw } from "lucide-react";
import { Bet as BetEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { cn } from "@/lib/utils";

export default function CurrentPosition() {
  const [matchFilter, setMatchFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  
  const session = getClientSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [session, navigate]);

  const { data: bets, isLoading, refetch } = useQuery({
    queryKey: ["current-position", session?.username, searchTrigger],
    queryFn: async () => {
      if (!session) return [];
      
      const allPending = await BetEntity.query()
        .where('status', 'pending')
        .sort("-created_at")
        .exec();
      
      // In a real scenario, we might want to filter by hierarchy (downline)
      // For this implementation, we follow the logic provided: fetch all pending.
      // If the user is a client, they should only see their own bets.
      if (session.role === 'client') {
        return allPending.filter(b => b.user_email === session.username);
      }
      
      return allPending;
    },
    enabled: !!session,
  });

  const handleRefresh = () => {
    setSearchTrigger(prev => prev + 1);
    refetch();
  };

  const filteredBets = bets?.filter(b => {
    const matchMatch = matchFilter ? b.match_title?.toLowerCase().includes(matchFilter.toLowerCase()) : true;
    const userMatch = usernameFilter ? b.user_email?.toLowerCase().includes(usernameFilter.toLowerCase()) : true;
    return matchMatch && userMatch;
  });

  const totalStake = filteredBets?.reduce((acc, b) => acc + (b.stake || 0), 0) || 0;
  const totalPotentialWin = filteredBets?.reduce((acc, b) => acc + (b.potential_win || 0), 0) || 0;

  return (
    <div className="bg-[#f4f6f7] min-h-screen pb-16">
      <main className="px-0 pt-0 pb-8 max-w-6xl mx-auto font-sans">
        <div className="h-4" />
        
        <div className="mx-2 mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#254465]">Current Position</h1>
            <p className="text-sm text-gray-500">View all active exposures and pending bets</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase font-bold">Total Exposure</div>
            <div className="text-xl font-bold text-[#e74c3c]">Rs. {totalStake.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="mx-2 mb-4">
          <section className="bg-white border border-[#d5d8dc] rounded-none shadow-none">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#d5d8dc] bg-[#ecf0f1]">
              <Filter className="w-4 h-4 fill-[#2c3e50] text-[#2c3e50]" />
              <span className="font-bold text-[#2c3e50] text-sm">Filter Pending Bets</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Match Name</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search match..."
                    value={matchFilter}
                    onChange={(e) => setMatchFilter(e.target.value)}
                    className="w-full border border-[#d5d8dc] rounded pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-[#00b181]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Username</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={usernameFilter}
                    onChange={(e) => setUsernameFilter(e.target.value)}
                    className="w-full border border-[#d5d8dc] rounded pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-[#00b181]"
                  />
                </div>
              </div>
              <button 
                onClick={handleRefresh}
                className="bg-[#00b181] text-white py-2 px-4 rounded text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#4dbd74] transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                Refresh Data
              </button>
            </div>
          </section>
        </div>

        {/* Summary Stats */}
        <div className="mx-2 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white p-3 border border-[#d5d8dc]">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Total Bets</div>
            <div className="text-lg font-bold text-[#254465]">{filteredBets?.length || 0}</div>
          </div>
          <div className="bg-white p-3 border border-[#d5d8dc]">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Total Stake</div>
            <div className="text-lg font-bold text-[#254465]">{totalStake.toLocaleString()}</div>
          </div>
          <div className="bg-white p-3 border border-[#d5d8dc]">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Total Potential Win</div>
            <div className="text-lg font-bold text-[#00b181]">{totalPotentialWin.toLocaleString()}</div>
          </div>
          <div className="bg-white p-3 border border-[#d5d8dc]">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Active Markets</div>
            <div className="text-lg font-bold text-[#254465]">
              {new Set(filteredBets?.map(b => b.match_id)).size}
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="mx-2">
          <section className="bg-white border border-[#d5d8dc] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#254465] text-white uppercase text-[10px] tracking-wider">
                    <th className="border border-[#1a3550] px-3 py-3 text-left font-bold">S.No</th>
                    <th className="border border-[#1a3550] px-3 py-3 text-left font-bold">Date/Time</th>
                    <th className="border border-[#1a3550] px-3 py-3 text-left font-bold">User</th>
                    <th className="border border-[#1a3550] px-3 py-3 text-left font-bold">Match</th>
                    <th className="border border-[#1a3550] px-3 py-3 text-left font-bold">Selection</th>
                    <th className="border border-[#1a3550] px-3 py-3 text-center font-bold">B/L</th>
                    <th className="border border-[#1a3550] px-3 py-3 text-center font-bold">Odds</th>
                    <th className="border border-[#1a3550] px-3 py-3 text-right font-bold">Stake</th>
                    <th className="border border-[#1a3550] px-3 py-3 text-right font-bold">Potential Win</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center bg-white">
                        <Loader2 className="w-8 h-8 animate-spin text-[#00b181] mx-auto" />
                        <p className="mt-2 text-gray-400 font-medium">Loading pending bets...</p>
                      </td>
                    </tr>
                  ) : filteredBets && filteredBets.length > 0 ? (
                    filteredBets.map((b, i) => (
                      <tr key={b.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f8f9fa] hover:bg-emerald-50/30 transition-colors")}>
                        <td className="border border-[#d5d8dc] px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="border border-[#d5d8dc] px-3 py-2 text-gray-600 whitespace-nowrap">
                          {new Date(b.created_at).toLocaleString()}
                        </td>
                        <td className="border border-[#d5d8dc] px-3 py-2 text-[#254465] font-bold">
                          {b.user_email?.split('@')[0]}
                        </td>
                        <td className="border border-[#d5d8dc] px-3 py-2 text-gray-700 font-medium">
                          {b.match_title}
                        </td>
                        <td className="border border-[#d5d8dc] px-3 py-2 text-gray-700">
                          {b.selection}
                        </td>
                        <td className="border border-[#d5d8dc] px-3 py-2 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block min-w-[36px]",
                            b.bet_type === "back" ? "bg-blue-100 text-blue-600 border border-blue-200" : "bg-pink-100 text-pink-600 border border-pink-200"
                          )}>
                            {b.bet_type}
                          </span>
                        </td>
                        <td className="border border-[#d5d8dc] px-3 py-2 text-center font-bold text-gray-600">
                          {b.odds}
                        </td>
                        <td className="border border-[#d5d8dc] px-3 py-2 text-right font-bold text-gray-900">
                          {b.stake?.toLocaleString()}
                        </td>
                        <td className="border border-[#d5d8dc] px-3 py-2 text-right font-bold text-[#00b181]">
                          {b.potential_win?.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center bg-white text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-gray-200" />
                          <p className="italic">No pending bets found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredBets && filteredBets.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#ecf0f1] font-bold text-[#2c3e50]">
                      <td colSpan={7} className="border border-[#d5d8dc] px-3 py-3 text-right uppercase text-[10px] tracking-widest">
                        Total Exposure
                      </td>
                      <td className="border border-[#d5d8dc] px-3 py-3 text-right text-red-600">
                        {totalStake.toLocaleString()}
                      </td>
                      <td className="border border-[#d5d8dc] px-3 py-3 text-right text-[#00b181]">
                        {totalPotentialWin.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
