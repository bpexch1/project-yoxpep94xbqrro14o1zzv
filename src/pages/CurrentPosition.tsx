import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Bet as BetEntity, Match as MatchEntity, Client as ClientEntity } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getClientSession } from "@/hooks/useClientAuth";
import { useDownlineUsernames } from "@/hooks/useDownlineUsernames";
import { UserHeader } from "@/components/user/UserHeader";
import { DashboardSidebar } from "@/components/user/DashboardSidebar";
import { calculateMarketPositions } from "@/utils/bettingPositions";
import { findMatchByIdOrTitle, detectSportFromText } from "@/utils/matchCatalog";
import { 
  Filter, Search, RefreshCw, X, ChevronRight, 
  Activity, ArrowUpDown, Clock, CheckCircle2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedMarketDetail {
  sport: string;
  matchId: string;
  matchTitle: string;
  marketName: string;
  displayTitle: string;
  amount: number;
  bets: any[];
  positions: Record<string, number>;
}

export default function CurrentPosition() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const session = getClientSession();
  const navigate = useNavigate();
  const { username: paramUsername } = useParams();
  const [searchParams] = useSearchParams();
  const queryUser = searchParams.get("user") || paramUsername || "";

  const [searchUsername, setSearchUsername] = useState(queryUser);
  const [selectedUserFilter, setSelectedUserFilter] = useState(queryUser);
  const [selectedMarketModal, setSelectedMarketModal] = useState<SelectedMarketDetail | null>(null);

  const { data: downlineUsernames } = useDownlineUsernames(session?.username, session?.role);

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [session, navigate]);

  const isBettorUser = session?.role === "client" || session?.role === "user" || session?.role === "bettor";
  const isCompanyOrAdmin = session?.role === "company" || session?.role === "superadmin" || session?.role === "admin" || session?.role === "supermaster" || session?.role === "master";

  // Fetch all db matches
  const { data: dbMatches = [], refetch: refetchMatches } = useQuery({
    queryKey: ["db-matches-current-position"],
    queryFn: async () => {
      try {
        const list = await MatchEntity.list();
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });

  // Fetch pending bets
  const { data: bets = [], isLoading, isFetching, refetch: refetchBets } = useQuery({
    queryKey: ["current-position-bets", session?.username, downlineUsernames, selectedUserFilter],
    queryFn: async () => {
      if (!session) return [];

      let allPending = await BetEntity.query()
        .where("status", "pending")
        .sort("-created_at")
        .exec();

      if (!Array.isArray(allPending)) allPending = [];

      // If user selected a specific client filter
      if (selectedUserFilter && selectedUserFilter.trim()) {
        const target = selectedUserFilter.trim().toLowerCase();
        return allPending.filter((b: any) => 
          (b.user_email && b.user_email.toLowerCase() === target) ||
          (b.client_username && b.client_username.toLowerCase() === target)
        );
      }

      if (session.role === "company" || session.role === "superadmin" || downlineUsernames === null) {
        return allPending;
      }

      if (isBettorUser) {
        return allPending.filter((b: any) => b.user_email === session.username || b.client_username === session.username);
      }

      if (!downlineUsernames || downlineUsernames.length === 0) return [];
      return allPending.filter((b: any) => 
        downlineUsernames.includes(b.user_email) || downlineUsernames.includes(b.client_username)
      );
    },
    enabled: !!session,
    refetchInterval: 3000,
  });

  const handleRefreshAll = () => {
    refetchBets();
    refetchMatches();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedUserFilter(searchUsername.trim());
  };

  // Group bets by sport and market
  const marketsBySport = useMemo(() => {
    const sportsMap: Record<string, any[]> = {
      Cricket: [],
      Soccer: [],
      Tennis: [],
      Casino: [],
    };

    bets.forEach((bet: any) => {
      const matchTitle = bet.match_title || bet.event_name || "Match Event";
      const resolvedMatch = findMatchByIdOrTitle(bet.match_id || matchTitle, dbMatches);
      
      let sport = resolvedMatch.sport || detectSportFromText(matchTitle);
      if (bet.sport) {
        sport = bet.sport === "Football" ? "Soccer" : bet.sport;
      }

      const matchId = resolvedMatch.id || bet.match_id || "unknown";
      const marketName = bet.market_name || (bet.selection?.toLowerCase().includes("over") || bet.selection?.toLowerCase().includes("under") ? "Over/Under 2.5 Goals" : "Match Odds");

      const marketKey = `${matchId}_${marketName}`;

      if (!sportsMap[sport]) {
        sportsMap[sport] = [];
      }

      let existing = sportsMap[sport].find((m: any) => m.key === marketKey);
      if (!existing) {
        existing = {
          key: marketKey,
          matchId,
          matchTitle: resolvedMatch.title || matchTitle,
          marketName,
          displayTitle: `${resolvedMatch.title || matchTitle} / ${marketName}`,
          matchObject: resolvedMatch,
          bets: [],
          selections: new Set<string>(),
          sport,
        };
        sportsMap[sport].push(existing);
      }

      existing.bets.push(bet);
      if (bet.selection) existing.selections.add(bet.selection);
    });

    // Calculate net company positions for each market
    Object.keys(sportsMap).forEach((sport) => {
      sportsMap[sport].forEach((m: any) => {
        const selArray = Array.from(m.selections);
        const positions = calculateMarketPositions(selArray as string[], m.bets);
        m.positions = positions;
        
        // In company view: Company P/L is the inverse of client net position
        // Or if calculated directly from book:
        const pnlValues = Object.values(positions) as number[];
        if (pnlValues.length > 0) {
          // Find worst-case liability or net book
          const minPnl = Math.min(...pnlValues);
          m.amount = minPnl;
        } else {
          const totalStake = m.bets.reduce((acc: number, b: any) => acc + (Number(b.stake) || 0), 0);
          m.amount = totalStake;
        }
      });

      // If sport has 0 active bets, we can either keep it empty or populate active inplay matches
    });

    // Remove empty sports if we have others, but keep standard ones if populated
    const cleanMap: Record<string, any[]> = {};
    Object.entries(sportsMap).forEach(([k, v]) => {
      if (v.length > 0) cleanMap[k] = v;
    });

    return cleanMap;
  }, [bets, dbMatches]);

  const totalActiveMarkets = Object.values(marketsBySport).reduce((acc, m) => acc + m.length, 0);
  const totalActiveBets = bets.length;

  // Render for Bettor (inside User Header)
  if (isBettorUser) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#e8eff5", fontFamily: '"Roboto Condensed", -apple-system, sans-serif' }}>
        <UserHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ maxWidth: 840, margin: "0 auto", padding: "10px 8px 40px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Market Position</span>
            <button
              onClick={handleRefreshAll}
              style={{ backgroundColor: "#00a676", color: "#ffffff", border: "none", borderRadius: 3, padding: "4px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <RefreshCw className={cn("w-3 h-3", isFetching && "animate-spin")} /> Refresh
            </button>
          </div>

          {isLoading ? (
            <div style={{ backgroundColor: "#fff", padding: "24px 12px", textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: 700 }}>
              Loading market positions...
            </div>
          ) : totalActiveMarkets === 0 ? (
            <div style={{ backgroundColor: "#fff", border: "1px solid #cbd5e1", padding: "30px 16px", textAlign: "center" }}>
              <div style={{ color: "#475569", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                No active market positions currently.
              </div>
              <button
                onClick={() => navigate("/play")}
                style={{ backgroundColor: "#00a676", color: "#ffffff", border: "none", borderRadius: 3, padding: "6px 16px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(marketsBySport).map(([sport, markets]) => (
                <div key={sport} style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#dbe3ec", padding: "6px 12px", fontSize: 12.5, fontWeight: 800, color: "#1e293b" }}>
                    <span>{sport}</span>
                    <span>Amount</span>
                  </div>
                  {markets.map((m: any, idx: number) => {
                    const isNegative = m.amount < 0;
                    const isPositive = m.amount > 0;
                    return (
                      <div
                        key={m.key || idx}
                        onClick={() => {
                          const targetMatch = m.matchObject || findMatchByIdOrTitle(m.matchId || m.matchTitle, dbMatches);
                          navigate(`/play/match/${targetMatch?.id || m.matchId || "unknown"}`);
                        }}
                        style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderBottom: idx < markets.length - 1 ? "1px solid #e2e8f0" : "none", cursor: "pointer" }}
                      >
                        <span style={{ color: "#00a676", fontSize: 13, fontWeight: 700 }}>{m.displayTitle}</span>
                        <span style={{ color: isNegative ? "#e53935" : isPositive ? "#00a676" : "#1e293b", fontSize: 13.5, fontWeight: 800 }}>
                          {isNegative ? `-${Math.abs(Math.round(m.amount)).toLocaleString()}` : Math.round(m.amount).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Company & Admin Management Portal View
  return (
    <div
      className="min-h-screen bg-[rgb(228,229,230)] pb-16 text-[rgb(35,40,44)]"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div className="w-full px-2.5 pt-2.5 pb-10">

        {/* 1. Report Type Quick Navigation Header */}
        <div className="bg-white rounded-[0.25rem] border border-[rgb(200,206,211)] mb-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#f0f3f5] border-b border-[rgb(200,206,211)]">
            <Filter size={14} className="text-[rgb(35,40,44)]" strokeWidth={2.5} />
            <span className="font-bold text-[14px] text-[rgb(35,40,44)]">Report Type</span>
          </div>

          <div className="p-3 flex flex-wrap gap-2">
            {[
              { label: "Book Detail", path: "/reports/book-detail" },
              { label: "Book Detail 2", path: "/reports/book-detail-2" },
              { label: "Daily PL", path: "/reports/daily-pl" },
              { label: "Daily Report", path: "/reports/daily" },
              { label: "Final Sheet", path: "/reports/final-sheet" },
              { label: "Accounts", path: "/accounts" },
              { label: "Current Position", path: "/current-position", active: true },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => navigate(btn.path)}
                className={`rounded-[0.25rem] px-3 py-1.5 text-[12px] font-bold transition-all border ${
                  btn.active
                    ? "bg-[#00b98a] text-white border-[#00b98a]"
                    : "bg-white text-[#138a72] border-[#138a72] hover:bg-[#138a72] hover:text-white"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Search-Users Filter Box */}
        <div className="bg-white rounded-[0.25rem] border border-[rgb(200,206,211)] mb-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#f0f3f5] border-b border-[rgb(200,206,211)]">
            <Filter size={14} className="text-[rgb(35,40,44)]" strokeWidth={2.5} />
            <span className="font-bold text-[14px] text-[rgb(35,40,44)]">Search-Users</span>
          </div>

          <div className="p-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-[420px]">
              <input
                type="text"
                placeholder="Username (optional)"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-[13px] border border-[rgb(200,206,211)] rounded-[0.25rem] bg-white outline-none focus:border-[#00b98a]"
              />
              <button
                type="submit"
                className="bg-[#00b98a] hover:bg-[#138a72] text-white rounded-[0.25rem] px-4 py-1.5 text-[13px] font-bold flex items-center gap-1.5 transition-colors"
              >
                <Search size={14} /> Search
              </button>
              {selectedUserFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserFilter("");
                    setSearchUsername("");
                  }}
                  className="bg-[#e4e5e6] hover:bg-[#c8ced3] text-[#23282c] rounded-[0.25rem] px-3 py-1.5 text-[12px] font-bold transition-colors"
                >
                  Clear
                </button>
              )}
            </form>
            {selectedUserFilter && (
              <div className="mt-2 text-[12px] text-[#00b98a] font-bold">
                Showing active positions for user: <u>{selectedUserFilter}</u>
              </div>
            )}
          </div>
        </div>

        {/* 3. Sport Highlights / Current Position Tables */}
        <div className="bg-white rounded-[0.25rem] border border-[rgb(200,206,211)] mb-4 overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          {/* Header Bar with Refresh */}
          <div className="flex justify-between items-center px-3 py-2 bg-[#f0f3f5] border-b border-[rgb(200,206,211)]">
            <span className="font-bold text-[14px] text-[rgb(35,40,44)]">
              Sport Highlights / Current Position
            </span>
            <button
              onClick={handleRefreshAll}
              className="bg-[#00b98a] hover:bg-[#138a72] text-white rounded-[0.25rem] px-3 py-1 text-[12px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={12} className={cn(isFetching && "animate-spin")} /> Refresh
            </button>
          </div>

          {/* Tables Grouped by Sport */}
          {isLoading ? (
            <div className="p-8 text-center text-[#73818f] text-[13px]">
              Loading active market positions...
            </div>
          ) : totalActiveMarkets === 0 ? (
            <div className="p-8 text-center text-[#73818f]">
              <div className="text-[14px] font-semibold text-[rgb(35,40,44)] mb-1.5">
                No active betting positions found
              </div>
              <div className="text-[12px] text-[#73818f]">
                {selectedUserFilter ? `No pending bets found for ${selectedUserFilter}.` : "There are currently no active pending bets in any sport market."}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {Object.entries(marketsBySport).map(([sport, markets]) => (
                <div key={sport} className="border-b border-[rgb(200,206,211)]">
                  {/* Sport Header Table Row */}
                  <div className="flex justify-between px-3 py-1.5 bg-[#e4e5e6] border-b border-[rgb(200,206,211)] font-bold text-[13px] text-[rgb(35,40,44)]">
                    <span>{sport}</span>
                    <span>Amount</span>
                  </div>

                  {/* Market Rows */}
                  {markets.map((m: any, idx: number) => {
                    const isNegative = m.amount < 0;
                    const isPositive = m.amount > 0;
                    const formattedAmount = isNegative
                      ? `-${Math.abs(Math.round(m.amount)).toLocaleString()}`
                      : Math.round(m.amount).toLocaleString();

                    return (
                      <div
                        key={m.key || idx}
                        onClick={() => setSelectedMarketModal(m)}
                        className={`flex justify-between items-center px-3 py-2 bg-white hover:bg-[#f0f3f5] cursor-pointer transition-colors ${
                          idx < markets.length - 1 ? "border-b border-[rgb(200,206,211)]" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[#00b98a] font-bold text-[13px]">
                            {m.displayTitle}
                          </span>
                          <span className="bg-[#e8f5e9] text-[#2e7d32] text-[10px] font-extrabold px-1.5 py-0.5 rounded-[2px]">
                            {m.bets?.length} {m.bets?.length === 1 ? "Bet" : "Bets"}
                          </span>
                        </div>
                        <span
                          className={`font-bold text-[13px] ${
                            isNegative ? "text-[#f86c6b]" : isPositive ? "text-[#00b98a]" : "text-[rgb(35,40,44)]"
                          }`}
                        >
                          {formattedAmount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Interactive Market Book & Bets Modal */}
        {selectedMarketModal && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-3">
            <div className="bg-white rounded-[0.25rem] w-full max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
              {/* Modal Header */}
              <div className="flex justify-between items-center bg-[#00b98a] px-4 py-2.5 text-white">
                <div>
                  <div className="font-bold text-[14.5px]">{selectedMarketModal.displayTitle}</div>
                  <div className="text-[11.5px] opacity-90">Sport: {selectedMarketModal.sport} | Pending Bets: {selectedMarketModal.bets.length}</div>
                </div>
                <button
                  onClick={() => setSelectedMarketModal(null)}
                  className="bg-transparent border-none text-white hover:opacity-75 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto flex-1">
                
                {/* Book Positions Breakdown */}
                <div className="mb-4">
                  <div className="font-bold text-[13px] text-[rgb(35,40,44)] mb-1.5">
                    Runner Book Position (Company P/L):
                  </div>
                  <div className="border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-hidden">
                    <table className="w-full border-collapse text-[12.5px]">
                      <thead>
                        <tr className="bg-[#f0f3f5] border-b border-[rgb(200,206,211)] text-[#73818f] font-bold">
                          <th className="px-2.5 py-1.5 text-left">Selection / Runner</th>
                          <th className="px-2.5 py-1.5 text-right">Company Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedMarketModal.positions || {}).map(([sel, posVal]) => {
                          const val = Number(posVal) || 0;
                          return (
                            <tr key={sel} className="border-b border-[rgb(200,206,211)] last:border-b-0">
                              <td className="px-2.5 py-1.5 font-semibold text-[rgb(35,40,44)]">{sel}</td>
                              <td className={`px-2.5 py-1.5 text-right font-bold ${
                                val > 0 ? "text-[#00b98a]" : val < 0 ? "text-[#f86c6b]" : "text-[rgb(35,40,44)]"
                              }`}>
                                {val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Downline Bets Table */}
                <div>
                  <div className="font-bold text-[13px] text-[rgb(35,40,44)] mb-1.5">
                    Active Client Bets ({selectedMarketModal.bets.length}):
                  </div>
                  <div className="border border-[rgb(200,206,211)] rounded-[0.25rem] overflow-x-auto">
                    <table className="w-full border-collapse text-[12px] min-w-[520px]">
                      <thead>
                        <tr className="bg-[#f0f3f5] border-b border-[rgb(200,206,211)] text-[#73818f] font-bold">
                          <th className="px-2 py-1.5 text-left">User</th>
                          <th className="px-2 py-1.5 text-left">Selection</th>
                          <th className="px-2 py-1.5 text-center">Type</th>
                          <th className="px-2 py-1.5 text-right">Odds</th>
                          <th className="px-2 py-1.5 text-right">Stake</th>
                          <th className="px-2 py-1.5 text-right">Exposure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMarketModal.bets.map((b: any, bIdx: number) => {
                          const isBack = b.type?.toLowerCase() === "back";
                          return (
                            <tr key={b.id || bIdx} className="border-b border-[rgb(200,206,211)] last:border-b-0">
                              <td className="px-2 py-1.5 font-bold text-[#00b98a]">
                                {b.user_email || b.client_username || "client"}
                              </td>
                              <td className="px-2 py-1.5 text-[rgb(35,40,44)] font-semibold">
                                {b.selection}
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <span className={`px-1.5 py-0.5 rounded-[2px] font-extrabold text-[11px] ${
                                  isBack ? "bg-[#a5d8ff] text-[#004085]" : "bg-[#ffc9c9] text-[#721c24]"
                                }`}>
                                  {b.type ? b.type.toUpperCase() : "BACK"}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-right font-bold text-[rgb(35,40,44)]">
                                {Number(b.odds || 0).toFixed(2)}
                              </td>
                              <td className="px-2 py-1.5 text-right font-bold text-[rgb(35,40,44)]">
                                {Number(b.stake || 0).toLocaleString()}
                              </td>
                              <td className="px-2 py-1.5 text-right font-bold text-[#f86c6b]">
                                {Number(b.potential_profit || b.stake || 0).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-[#f0f3f5] border-t border-[rgb(200,206,211)] px-4 py-2 flex justify-end">
                <button
                  onClick={() => setSelectedMarketModal(null)}
                  className="bg-[#73818f] hover:bg-[#5c6873] text-white rounded-[0.25rem] px-3.5 py-1 text-[12.5px] font-bold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
