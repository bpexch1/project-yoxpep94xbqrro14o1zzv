import { useState, useEffect, Fragment } from "react";
import { Header } from "@/components/layout/Header";
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
    <div className="min-h-screen bg-[#ECEFF1] pb-16">
      <Header />
      
      <main className="px-2 pt-2 pb-8 max-w-[480px] mx-auto">
        {/* Search Users Section */}
        <section className="bg-white border border-[#E0E0E0] rounded-none shadow-none mb-2">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E0E0E0]">
            <Filter className="w-4 h-4 fill-black text-black" />
            <span className="font-bold text-black text-sm uppercase">Search-Users</span>
          </div>
          <div className="p-4 flex gap-2">
            <input
              type="text"
              placeholder="Username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-[#26A69A]"
            />
            <button 
              onClick={handleSearch}
              className="bg-[#43A047] text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-1.5 hover:bg-[#388E3C] transition-colors shadow-sm"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </section>

        {/* Sport Highlights Card */}
        <section className="bg-white border border-[#E0E0E0] rounded-none shadow-none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E0E0E0]">
            <span className="font-bold text-black text-sm uppercase">Sport Highlights</span>
            <button 
              onClick={handleRefresh}
              className="bg-[#26A69A] text-white text-xs px-3 py-1 rounded hover:bg-[#219387] transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#26A69A] animate-spin" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No matches found.
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {Object.entries(groupedMatches).map(([sport, sportMatches]) => (
                    <Fragment key={sport}>
                      {/* Sport Sub-header */}
                      <tr className="bg-white border-b border-[#E0E0E0]">
                        <td className="px-4 py-2 font-bold text-black border-r border-[#E0E0E0]">{sport}</td>
                        <td className="px-4 py-2 font-bold text-black text-right w-32">Amount</td>
                      </tr>
                      
                      {/* Match Rows */}
                      {sportMatches.map((match, idx) => {
                        const amount = calculateAmount(match.id);
                        return (
                          <tr 
                            key={match.id} 
                            className={`${idx % 2 === 1 ? 'bg-[#F5F5F5]' : 'bg-white'} border-b border-[#E0E0E0]`}
                          >
                            <td className="px-4 py-2 border-r border-[#E0E0E0]">
                              <a 
                                href="#" 
                                onClick={(e) => e.preventDefault()}
                                className="text-[#26A69A] font-medium hover:underline"
                              >
                                {match.title} / Match Odds
                              </a>
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-black">
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
