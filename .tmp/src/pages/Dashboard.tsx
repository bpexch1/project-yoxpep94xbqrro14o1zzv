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
    <div style={{ minHeight: "100vh", background: "#f0f0f0", fontFamily: "Roboto, system-ui, sans-serif" }}>
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "16px 12px 80px" }}>
        
        {/* Search Users Card */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #d0d0d0", boxShadow: "0 1px 3px rgba(0,0,0,.08)", marginBottom: 16, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#ecf0f1", borderBottom: "1px solid #d0d0d0" }}>
            <Filter style={{ width: 16, height: 16, fill: "#000", color: "#000", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>Search-Users</span>
          </div>
          {/* Body */}
          <div style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, height: 40, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 12px", fontSize: 14, outline: "none", background: "#fff" }}
              />
              <button
                onClick={handleSearch}
                style={{ height: 40, padding: "0 18px", background: "#1a9e71", color: "#fff", border: "none", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Search style={{ width: 15, height: 15 }} /> Search
              </button>
            </div>
          </div>
        </div>

        {/* Sport Highlights Card */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #d0d0d0", boxShadow: "0 1px 3px rgba(0,0,0,.08)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#ecf0f1", borderBottom: "1px solid #d0d0d0" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#212529", flex: 1 }}>Sport Highlights</span>
            <button
              onClick={handleRefresh}
              style={{ background: "#1a9e71", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Refresh
            </button>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
                <Loader2 style={{ width: 32, height: 32, color: "#16a085", margin: "0 auto" }} className="animate-spin" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#7f8c8d", fontSize: 14 }}>
                No matches found.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries(groupedMatches).map(([sport, sportMatches]) => (
                    <Fragment key={sport}>
                      <tr style={{ background: "#fff" }}>
                        <td style={{ border: "1px solid #d5d8dc", padding: "10px 12px", fontWeight: 700, color: "#212529", fontSize: 14 }}>
                          {sport}
                        </td>
                        <td style={{ border: "1px solid #d5d8dc", padding: "10px 12px", fontWeight: 700, color: "#212529", fontSize: 14, width: 120, textAlign: "right" }}>
                          Amount
                        </td>
                      </tr>
                      {sportMatches.map((match, idx) => {
                        const amount = calculateAmount(match.id);
                        return (
                          <tr
                            key={match.id}
                            style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}
                          >
                            <td style={{ border: "1px solid #d5d8dc", padding: "10px 12px", fontSize: 14 }}>
                              <span
                                style={{ color: "#1a9e71", cursor: "pointer", textDecoration: "none" }}
                                className="hover:underline"
                              >
                                {match.title} / Match Odds
                              </span>
                              {match.status === 'live' && (
                                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#1a9e71", marginLeft: 8 }} />
                              )}
                            </td>
                            <td style={{ border: "1px solid #d5d8dc", padding: "10px 12px", fontSize: 14, fontWeight: 500, color: "#212529", textAlign: "right" }}>
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
        </div>

      </main>
    </div>
  );
}
