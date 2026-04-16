import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Search, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Bet as BetEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { cn } from "@/lib/utils";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";

export default function CurrentPosition() {
  const [matchFilter, setMatchFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [isClearingAll, setIsClearingAll] = useState(false);
  
  const session = getClientSession();
  const navigate = useNavigate();
  const { data: downlineUsernames } = useDownlineUsernames(session?.username, session?.role);

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [session, navigate]);

  const { data: bets, isLoading, refetch } = useQuery({
    queryKey: ["current-position", session?.username, searchTrigger, downlineUsernames],
    queryFn: async () => {
      if (!session) return [];
      
      const allPending = await BetEntity.query()
        .where('status', 'pending')
        .sort("-created_at")
        .exec();
      
      // Company role: see all pending bets
      if (downlineUsernames === null) return allPending;

      // Client: see only their own bets
      if (session.role === 'client') {
        return allPending.filter((b: any) => b.user_email === session.username);
      }

      // Others (admin, agent, etc.): see only their downline's bets
      if (!downlineUsernames || downlineUsernames.length === 0) return [];
      return allPending.filter((b: any) => downlineUsernames.includes(b.user_email));
    },
    enabled: !!session && downlineUsernames !== undefined,
  });

  const handleRefresh = () => {
    setSearchTrigger(prev => prev + 1);
    refetch();
  };

  const handleClearAllBets = async () => {
    if (!window.confirm("Are you sure you want to delete ALL bets? This cannot be undone.")) return;
    setIsClearingAll(true);
    try {
      const allBets = await BetEntity.list("-created_at", 1000);
      if (allBets && allBets.length > 0) {
        const ids = allBets.map((b: any) => b.id);
        await BetEntity.batch().delete(ids);
      }
      refetch();
      alert("All bets have been cleared.");
    } catch (err) {
      console.error(err);
      alert("Failed to clear bets.");
    } finally {
      setIsClearingAll(false);
    }
  };

  const filteredBets = bets?.filter(b => {
    const matchMatch = matchFilter ? b.match_title?.toLowerCase().includes(matchFilter.toLowerCase()) : true;
    const userMatch = usernameFilter ? b.user_email?.toLowerCase().includes(usernameFilter.toLowerCase()) : true;
    return matchMatch && userMatch;
  });

  const totalStake = filteredBets?.reduce((acc, b) => acc + (b.stake || 0), 0) || 0;
  const totalPotentialWin = filteredBets?.reduce((acc, b) => acc + (b.potential_win || 0), 0) || 0;

  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  return (
    <div className="bg-[#ececec] min-h-screen pb-16" style={arialFont}>
      <main className="px-2 pt-4 pb-8 max-w-6xl mx-auto">
        
        <div className="mx-1 mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#333]">Current Position</h1>
            <p className="text-[12px] text-gray-500">View active exposures and pending bets</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase font-bold">Total Exposure</div>
            <div className="text-lg font-bold text-[#e74c3c]">Rs. {totalStake.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="mb-4">
          <section className="bg-[#f3f3f3] border border-[#d4d4d4] rounded-[6px] overflow-hidden shadow-none">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#d4d4d4] bg-[#ececec]">
              <Filter className="w-4 h-4 text-[#333]" />
              <span className="font-bold text-[#333] text-sm">Filter Pending Bets</span>
            </div>
            <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Match Name</label>
                <input
                  type="text"
                  placeholder="Search match..."
                  value={matchFilter}
                  onChange={(e) => setMatchFilter(e.target.value)}
                  className="w-full border border-[#cccccc] rounded px-3 h-[36px] text-sm focus:outline-none focus:border-[#12b886]"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Username</label>
                <input
                  type="text"
                  placeholder="Search user..."
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  className="w-full border border-[#cccccc] rounded px-3 h-[36px] text-sm focus:outline-none focus:border-[#12b886]"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleRefresh}
                  className="flex-1 bg-[#12b886] text-white h-[36px] rounded text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0ca678]"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  Refresh
                </button>
                {(session?.role === 'company' || session?.role === 'superadmin') && (
                  <button
                    onClick={handleClearAllBets}
                    disabled={isClearingAll}
                    className="bg-[#e74c3c] text-white h-[36px] px-3 rounded text-sm font-bold flex items-center justify-center hover:bg-red-700 disabled:opacity-60"
                  >
                    {isClearingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Summary Stats */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Total Bets", value: filteredBets?.length || 0, color: "text-[#333]" },
            { label: "Total Stake", value: totalStake.toLocaleString(), color: "text-[#e74c3c]" },
            { label: "Total Win", value: totalPotentialWin.toLocaleString(), color: "text-[#12b886]" },
            { label: "Markets", value: new Set(filteredBets?.map(b => b.match_id)).size, color: "text-[#333]" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#f3f3f3] p-2 border border-[#d4d4d4] rounded-[6px]">
              <div className="text-[9px] text-gray-500 uppercase font-bold">{stat.label}</div>
              <div className={cn("text-[15px] font-bold", stat.color)}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Report Table */}
        <section className="bg-[#f3f3f3] border border-[#d4d4d4] rounded-[6px] overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#e8e8e8] text-[#333] border-b border-[#d0d0d0]">
                  <th className="border-r border-[#d0d0d0] px-2 py-2 text-left font-bold">User</th>
                  <th className="border-r border-[#d0d0d0] px-2 py-2 text-left font-bold">Match</th>
                  <th className="border-r border-[#d0d0d0] px-2 py-2 text-center font-bold">B/L</th>
                  <th className="border-r border-[#d0d0d0] px-2 py-2 text-center font-bold">Odds</th>
                  <th className="px-2 py-2 text-right font-bold">Stake</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center bg-white">
                      <Loader2 className="w-8 h-8 animate-spin text-[#12b886] mx-auto" />
                    </td>
                  </tr>
                ) : filteredBets && filteredBets.length > 0 ? (
                  filteredBets.map((b, i) => (
                    <tr key={b.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]", "border-b border-[#d0d0d0] h-[34px]")}>
                      <td className="border-r border-[#d0d0d0] px-2 py-1 text-[#12b886] font-bold whitespace-nowrap">
                        {b.user_email?.split('@')[0]}
                      </td>
                      <td className="border-r border-[#d0d0d0] px-2 py-1 text-[#333] font-medium truncate max-w-[120px]">
                        {b.match_title}
                      </td>
                      <td className="border-r border-[#d0d0d0] px-2 py-1 text-center font-bold">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-[2px] text-[10px] uppercase inline-block min-w-[32px]",
                          b.bet_type === "back" ? "bg-[#3498db] text-white" : "bg-[#e74c3c] text-white"
                        )}>
                          {b.bet_type}
                        </span>
                      </td>
                      <td className="border-r border-[#d0d0d0] px-2 py-1 text-center font-bold text-[#333]">
                        {b.odds}
                      </td>
                      <td className="px-2 py-1 text-right font-bold text-[#333]">
                        {b.stake?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center bg-white text-gray-500 italic">
                      No pending bets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
