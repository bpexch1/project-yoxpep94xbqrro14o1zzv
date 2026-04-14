import { useState, useEffect, Fragment } from "react";
import { Filter, Search, Loader2 } from "lucide-react";
import { Match as MatchEntity, Bet as BetEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const navigate = useNavigate();

  // Protected route check
  useEffect(() => {
    const session = getClientSession();
    if (!session) {
      navigate("/login");
    }
  }, [navigate]);

  const { data: matches, isLoading: isLoadingMatches, refetch: refetchMatches } = useQuery({
    queryKey: ["matches"],
    queryFn: () => MatchEntity.list("-created_at"),
  });

  const { data: bets, isLoading: isLoadingBets, refetch: refetchBets } = useQuery({
    queryKey: ["bets"],
    queryFn: () => BetEntity.list(),
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
    <div className="bg-[#f4f6f7] pb-16 min-h-screen">
      <main className="px-2 pt-2 pb-8 max-w-5xl mx-auto">
        {/* Search Users Section */}
        <section className="bg-white border border-[#d5d8dc] rounded-none shadow-none mb-2">
          <div className="bg-[#ecf0f1] px-4 py-3 border-b border-[#d5d8dc] flex items-center gap-2">
            <Filter className="w-4 h-4 fill-[#2c3e50] text-[#2c3e50]" />
            <span className="font-bold text-[#2c3e50] text-sm uppercase">Search-Users</span>
          </div>
          <div className="p-4 pb-6 flex gap-2">
            <input
              type="text"
              placeholder="Username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-[#d5d8dc] rounded px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-[#16a085] text-[#2c3e50] bg-white"
            />
            <button 
              onClick={handleSearch}
              className="bg-[#16a085] text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-1.5 hover:bg-[#138d75] transition-colors shadow-sm"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </section>

        {/* Sport Highlights Card */}
        <section className="bg-white border border-[#d5d8dc] rounded-none shadow-none">
          <div className="bg-[#ecf0f1] px-4 py-3 border-b border-[#d5d8dc] flex items-center justify-between">
            <span className="font-bold text-[#2c3e50] text-sm uppercase">Sport Highlights</span>
            <button 
              onClick={handleRefresh}
              className="bg-[#16a085] text-white text-xs px-3 py-1 rounded hover:bg-[#138d75] transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#16a085] animate-spin" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="py-8 text-center text-[#7f8c8d] text-sm border border-[#bdc3c7]">
                No matches found.
              </div>
            ) : (
              <table className="w-full text-sm border-collapse border border-[#bdc3c7]">
                <tbody>
                  {Object.entries(groupedMatches).map(([sport, sportMatches]) => (
                    <Fragment key={sport}>
                      {/* Sport Sub-header */}
                      <tr>
                        <td className="border border-[#bdc3c7] px-4 py-2 font-bold text-[#2c3e50] bg-white">{sport}</td>
                        <td className="border border-[#bdc3c7] px-4 py-2 font-bold text-[#2c3e50] bg-white text-right w-32">Amount</td>
                      </tr>
                      
                      {/* Match Rows */}
                      {sportMatches.map((match, idx) => {
                        const amount = calculateAmount(match.id);
                        return (
                          <tr 
                            key={match.id} 
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f2f2]'}
                          >
                            <td className="border border-[#bdc3c7] px-4 py-2">
                              <span 
                                className="text-[#16a085] font-medium cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  // Potential navigation here
                                }}
                              >
                                {match.title} / Match Odds
                              </span>
                              {match.status === 'live' && (
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#16a085] ml-1 align-middle" />
                              )}
                            </td>
                            <td className="border border-[#bdc3c7] px-4 py-2 text-right text-[#2c3e50] font-medium">
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
