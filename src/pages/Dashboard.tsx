import { useState, useEffect, Fragment } from "react";
import { Filter, Search, Loader2 } from "lucide-react";
import { Match as MatchEntity, Bet as BetEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { useNavigate } from "react-router-dom";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const navigate = useNavigate();

  const session = getClientSession();
  const { data: downlineUsernames } = useDownlineUsernames(session?.username, session?.role);

  useEffect(() => {
    if (!session) navigate("/login");
  }, [navigate, session]);

  const { data: matches, isLoading: isLoadingMatches, refetch: refetchMatches } = useQuery({
    queryKey: ["matches"],
    queryFn: () => MatchEntity.list("-created_at"),
  });

  const { data: bets, isLoading: isLoadingBets, refetch: refetchBets } = useQuery({
    queryKey: ["bets", session?.username, downlineUsernames],
    queryFn: async () => {
      if (!session) return [];
      if (downlineUsernames === null) return BetEntity.list();
      if (!downlineUsernames || downlineUsernames.length === 0) return [];
      const allBets = await BetEntity.list();
      return allBets.filter((b: any) => downlineUsernames.includes(b.user_email));
    },
    enabled: !!session && downlineUsernames !== undefined,
  });

  const handleRefresh = () => { refetchMatches(); refetchBets(); };
  const handleSearch = () => setAppliedSearch(searchQuery);

  const calculateAmount = (matchId: string) => {
    if (!bets) return 0;
    return bets.filter((bet: any) => bet.match_id === matchId)
               .reduce((sum: number, bet: any) => sum + (Number(bet.stake) || 0), 0);
  };

  const formatAmount = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);

  const filteredMatches = matches?.filter((match: any) =>
    match.title?.toLowerCase().includes(appliedSearch.toLowerCase())
  ) || [];

  const sports = ["Cricket", "Football", "Tennis", "Soccer"];
  const groupedMatches = sports.reduce((acc, sport) => {
    const sportMatches = filteredMatches.filter((m: any) => m.sport?.toLowerCase() === sport.toLowerCase());
    if (sportMatches.length > 0) acc[sport] = sportMatches;
    return acc;
  }, {} as Record<string, any[]>);

  filteredMatches.forEach((m: any) => {
    const sportName = m.sport ? m.sport.charAt(0).toUpperCase() + m.sport.slice(1).toLowerCase() : "Other";
    if (!sports.some(s => s.toLowerCase() === sportName.toLowerCase()) && sportName !== "Other") {
      if (!groupedMatches[sportName]) groupedMatches[sportName] = [];
      groupedMatches[sportName].push(m);
    }
  });

  const isLoading = isLoadingMatches || isLoadingBets;
  const arialFont = { fontFamily: "Arial, Helvetica, sans-serif" };

  return (
    <div className="bg-[#ececec] pb-16 min-h-screen" style={arialFont}>
      <main className="px-3 pt-3 pb-8 max-w-4xl mx-auto">

        {/* Search Users Section */}
        <section className="bg-[#f3f3f3] border border-[#d4d4d4] rounded-[6px] shadow-none mb-3 overflow-hidden">
          <div className="bg-[#ececec] px-3 py-2 border-b border-[#d4d4d4] flex items-center gap-2">
            <Filter className="w-4 h-4 fill-[#333] text-[#333]" />
            <span className="font-bold text-[#333] text-sm">Search-Users</span>
          </div>
          <div className="p-3 pb-6 flex gap-2">
            <input
              type="text"
              placeholder="Username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-[#cccccc] rounded px-3 h-[40px] text-sm placeholder-gray-400 focus:outline-none focus:border-[#12b886] text-[#333] bg-white"
            />
            <button
              onClick={handleSearch}
              className="bg-[#12b886] text-white px-4 h-[40px] rounded text-sm font-bold flex items-center gap-1.5 hover:bg-[#0ca678] transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </div>
        </section>

        {/* Sport Highlights Card */}
        <section className="bg-[#f3f3f3] border border-[#d4d4d4] rounded-[6px] shadow-none overflow-hidden">
          <div className="bg-[#ececec] px-3 py-2 border-b border-[#d4d4d4] flex items-center gap-3">
            <span className="font-bold text-[#333] text-sm">Sport Highlights</span>
            <button
              onClick={handleRefresh}
              className="bg-[#12b886] text-white text-[11px] px-3 h-6 rounded font-bold hover:bg-[#0ca678] transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#12b886] animate-spin" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="py-8 text-center text-[#7f8c8d] text-sm">
                No matches found.
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {Object.entries(groupedMatches).map(([sport, sportMatches]) => (
                    <Fragment key={sport}>
                      <tr className="bg-[#e8e8e8]">
                        <td className="border border-[#d0d0d0] px-3 py-2 font-bold text-[#333] text-[12px]">{sport}</td>
                        <td className="border border-[#d0d0d0] px-3 py-2 font-bold text-[#333] w-32 text-[12px] text-right">Amount</td>
                      </tr>
                      {sportMatches.map((match, idx) => {
                        const amount = calculateAmount(match.id);
                        return (
                          <tr key={match.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}>
                            <td className="border border-[#d0d0d0] px-3 py-2">
                              <span className="text-[#12b886] text-sm font-bold cursor-pointer hover:underline">
                                {match.title} / Match Odds
                              </span>
                              {match.status === 'live' && (
                                <span className="inline-block w-2 h-2 rounded-full bg-[#12b886] ml-2" />
                              )}
                            </td>
                            <td className="border border-[#d0d0d0] px-3 py-2 text-[#333] text-sm font-bold text-right">
                              {formatAmount(amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
