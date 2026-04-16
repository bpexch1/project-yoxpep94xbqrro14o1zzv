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

  // Protected route check
  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [navigate, session]);

  const { data: matches, isLoading: isLoadingMatches, refetch: refetchMatches } = useQuery({
    queryKey: ["matches"],
    queryFn: () => MatchEntity.list("-created_at"),
  });

  const { data: bets, isLoading: isLoadingBets, refetch: refetchBets } = useQuery({
    queryKey: ["bets", session?.username, downlineUsernames],
    queryFn: async () => {
      if (!session) return [];
      // Company role: see all
      if (downlineUsernames === null) {
        return BetEntity.list();
      }
      // Others: only their downline's bets
      if (!downlineUsernames || downlineUsernames.length === 0) return [];
      // Filter bets by downline usernames
      const allBets = await BetEntity.list();
      return allBets.filter((b: any) => downlineUsernames.includes(b.user_email));
    },
    enabled: !!session && downlineUsernames !== undefined,
  });

  const handleRefresh = () => {
    refetchMatches();
    refetchBets();
  };

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
  };

  const calculateAmount = (matchId: string) => {
    if (!bets) return 0;
    return bets
      .filter((bet: any) => bet.match_id === matchId)
      .reduce((sum: number, bet: any) => sum + (Number(bet.stake) || 0), 0);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const filteredMatches = matches?.filter((match: any) => 
    match.title?.toLowerCase().includes(appliedSearch.toLowerCase())
  ) || [];

  // Group matches by sport
  const sports = ["Cricket", "Football", "Tennis", "Soccer"];
  const groupedMatches = sports.reduce((acc, sport) => {
    const sportMatches = filteredMatches.filter(
      (m: any) => m.sport?.toLowerCase() === sport.toLowerCase()
    );
    if (sportMatches.length > 0) {
      acc[sport] = sportMatches;
    }
    return acc;
  }, {} as Record<string, any[]>);

  // Add any other sports not in the main list
  filteredMatches.forEach((m: any) => {
    const sportName = m.sport ? m.sport.charAt(0).toUpperCase() + m.sport.slice(1).toLowerCase() : "Other";
    if (!sports.some(s => s.toLowerCase() === sportName.toLowerCase()) && sportName !== "Other") {
      if (!groupedMatches[sportName]) groupedMatches[sportName] = [];
      groupedMatches[sportName].push(m);
    }
  });

  const isLoading = isLoadingMatches || isLoadingBets;

  return (
    <div className="bg-[#f0f2f5] pb-16 min-h-screen">
      <main className="px-0 pt-0 pb-8 max-w-4xl mx-auto">
        
        {/* Search Users Section */}
        <section className="bg-white border border-[#d5d8dc] rounded-none shadow-none mb-3">
          <div className="bg-[#e8e8e8] px-3 py-2 border-b border-[#d5d8dc] flex items-center gap-2">
            <Filter className="w-4 h-4 fill-[#333333] text-[#333333]" />
            <span className="font-bold text-[#2c3e50] text-sm">Search-Users</span>
          </div>
          <div className="p-4 pb-8 flex gap-2">
            <input
              type="text"
              placeholder="Username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-[#ced4da] rounded px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:border-[#16a085] text-[#2c3e50] bg-white"
            />
            <button
              onClick={handleSearch}
              className="bg-[#1a9e71] text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 hover:bg-[#158c61] transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </div>
        </section>

        {/* Sport Highlights Card */}
        <section className="bg-white border border-[#d5d8dc] rounded-none shadow-none">
          <div className="bg-[#e8e8e8] px-3 py-2 border-b border-[#d5d8dc] flex items-center gap-3">
            <span className="font-bold text-[#2c3e50] text-sm">Sport Highlights</span>
            <button
              onClick={handleRefresh}
              className="bg-[#1a9e71] text-white text-xs px-3 py-0.5 rounded hover:bg-[#158c61] transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto mt-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#16a085] animate-spin" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="py-8 text-center text-[#7f8c8d] text-sm border border-[#d5d8dc]">
                No matches found.
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {Object.entries(groupedMatches).map(([sport, sportMatches]) => (
                    <Fragment key={sport}>
                      <tr>
                        <td className="border border-[#d5d8dc] px-3 py-2 font-bold text-[#2c3e50] bg-white text-sm">
                          {sport}
                        </td>
                        <td className="border border-[#d5d8dc] px-3 py-2 font-bold text-[#2c3e50] bg-white w-32 text-sm">
                          Amount
                        </td>
                      </tr>
                      {sportMatches.map((match, idx) => {
                        const amount = calculateAmount(match.id);
                        return (
                          <tr
                            key={match.id}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}
                          >
                            <td className="border border-[#d5d8dc] px-3 py-2">
                              <span
                                className="text-[#1a9e71] text-sm font-normal cursor-pointer hover:underline"
                              >
                                {match.title} / Match Odds
                              </span>
                              {match.status === 'live' && (
                                <>
                                  <br />
                                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a9e71] mt-1" />
                                </>
                              )}
                            </td>
                            <td className="border border-[#d5d8dc] px-3 py-2 text-[#2c3e50] text-sm font-medium">
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
