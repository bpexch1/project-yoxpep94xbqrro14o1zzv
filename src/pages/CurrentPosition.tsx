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
    <div style={{ minHeight: "100vh", backgroundColor: "#f2f4f8", fontFamily: 'Roboto, system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: "100%", padding: "10px 10px 40px" }}>

        {/* 1. Report Type Quick Navigation Header */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "3px", border: "1px solid #dcdcdc", marginBottom: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
            <Filter size={14} color="#212529" strokeWidth={2.5} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#212529" }}>Report Type</span>
          </div>

          <div style={{ padding: "12px 14px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
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
                style={{
                  backgroundColor: btn.active ? "#00a65a" : "#ffffff",
                  color: btn.active ? "#ffffff" : "#00a65a",
                  border: "1px solid #00a65a",
                  borderRadius: "3px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Search-Users Filter Box */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "3px", border: "1px solid #dcdcdc", marginBottom: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
            <Filter size={14} color="#212529" strokeWidth={2.5} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#212529" }}>Search-Users</span>
          </div>

          <div style={{ padding: "12px 14px" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", maxWidth: "420px" }}>
              <input
                type="text"
                placeholder="Username (optional)"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  fontSize: "13px",
                  border: "1px solid #ced4da",
                  borderRadius: "3px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "#00b181",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "3px",
                  padding: "6px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
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
                  style={{
                    backgroundColor: "#e2e8f0",
                    color: "#475569",
                    border: "none",
                    borderRadius: "3px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </form>
            {selectedUserFilter && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#00a65a", fontWeight: 700 }}>
                Showing active positions for user: <u>{selectedUserFilter}</u>
              </div>
            )}
          </div>
        </div>

        {/* 3. Sport Highlights / Current Position Tables */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "3px", border: "1px solid #dcdcdc", marginBottom: "16px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          {/* Header Bar with Refresh */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#212529" }}>
              Sport Highlights / Current Position
            </span>
            <button
              onClick={handleRefreshAll}
              style={{
                backgroundColor: "#00b181",
                color: "#ffffff",
                border: "none",
                borderRadius: "3px",
                padding: "3px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <RefreshCw size={12} className={cn(isFetching && "animate-spin")} /> Refresh
            </button>
          </div>

          {/* Tables Grouped by Sport */}
          {isLoading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#6c757d", fontSize: "13px" }}>
              Loading active market positions...
            </div>
          ) : totalActiveMarkets === 0 ? (
            <div style={{ padding: "30px 16px", textAlign: "center", color: "#6c757d" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#212529", marginBottom: "6px" }}>
                No active betting positions found
              </div>
              <div style={{ fontSize: "12px", color: "#6c757d" }}>
                {selectedUserFilter ? `No pending bets found for ${selectedUserFilter}.` : "There are currently no active pending bets in any sport market."}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {Object.entries(marketsBySport).map(([sport, markets]) => (
                <div key={sport} style={{ borderBottom: "1px solid #dee2e6" }}>
                  {/* Sport Header Table Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", backgroundColor: "#e9ecef", borderBottom: "1px solid #dee2e6", fontWeight: 700, fontSize: "13px", color: "#212529" }}>
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
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "9px 12px",
                          borderBottom: idx < markets.length - 1 ? "1px solid #f1f3f5" : "none",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                          transition: "background-color 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                          <span style={{ color: "#00b181", fontWeight: 700, fontSize: "13px" }}>
                            {m.displayTitle}
                          </span>
                          <span style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", fontSize: "10px", fontWeight: 800, padding: "1px 6px", borderRadius: "2px" }}>
                            {m.bets?.length} {m.bets?.length === 1 ? "Bet" : "Bets"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "13px",
                            color: isNegative ? "#dc3545" : isPositive ? "#00b181" : "#212529",
                          }}
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
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "4px", width: "100%", maxWidth: "700px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#00a65a", padding: "10px 16px", color: "#ffffff" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14.5px" }}>{selectedMarketModal.displayTitle}</div>
                  <div style={{ fontSize: "11.5px", opacity: 0.9 }}>Sport: {selectedMarketModal.sport} | Pending Bets: {selectedMarketModal.bets.length}</div>
                </div>
                <button
                  onClick={() => setSelectedMarketModal(null)}
                  style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
                
                {/* Book Positions Breakdown */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#212529", marginBottom: "6px" }}>
                    Runner Book Position (Company P/L):
                  </div>
                  <div style={{ border: "1px solid #dee2e6", borderRadius: "3px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6", color: "#495057", fontWeight: 700 }}>
                          <th style={{ padding: "6px 10px", textAlign: "left" }}>Selection / Runner</th>
                          <th style={{ padding: "6px 10px", textAlign: "right" }}>Company Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedMarketModal.positions || {}).map(([sel, posVal]) => {
                          const val = Number(posVal) || 0;
                          return (
                            <tr key={sel} style={{ borderBottom: "1px solid #dee2e6" }}>
                              <td style={{ padding: "6px 10px", fontWeight: 600, color: "#212529" }}>{sel}</td>
                              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: val > 0 ? "#00b181" : val < 0 ? "#dc3545" : "#212529" }}>
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
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#212529", marginBottom: "6px" }}>
                    Active Client Bets ({selectedMarketModal.bets.length}):
                  </div>
                  <div style={{ border: "1px solid #dee2e6", borderRadius: "3px", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "520px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6", color: "#495057", fontWeight: 700 }}>
                          <th style={{ padding: "6px 8px", textAlign: "left" }}>User</th>
                          <th style={{ padding: "6px 8px", textAlign: "left" }}>Selection</th>
                          <th style={{ padding: "6px 8px", textAlign: "center" }}>Type</th>
                          <th style={{ padding: "6px 8px", textAlign: "right" }}>Odds</th>
                          <th style={{ padding: "6px 8px", textAlign: "right" }}>Stake</th>
                          <th style={{ padding: "6px 8px", textAlign: "right" }}>Exposure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMarketModal.bets.map((b: any, bIdx: number) => {
                          const isBack = b.type?.toLowerCase() === "back";
                          return (
                            <tr key={b.id || bIdx} style={{ borderBottom: "1px solid #dee2e6" }}>
                              <td style={{ padding: "6px 8px", fontWeight: 700, color: "#00b181" }}>
                                {b.user_email || b.client_username || "client"}
                              </td>
                              <td style={{ padding: "6px 8px", color: "#212529", fontWeight: 600 }}>
                                {b.selection}
                              </td>
                              <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                <span style={{
                                  backgroundColor: isBack ? "#a5d8ff" : "#ffc9c9",
                                  color: isBack ? "#004085" : "#721c24",
                                  padding: "1px 6px",
                                  borderRadius: "2px",
                                  fontWeight: 800,
                                  fontSize: "11px",
                                }}
                                >
                                  {b.type ? b.type.toUpperCase() : "BACK"}
                                </span>
                              </td>
                              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#212529" }}>
                                {Number(b.odds || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#212529" }}>
                                {Number(b.stake || 0).toLocaleString()}
                              </td>
                              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#dc3545" }}>
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
              <div style={{ backgroundColor: "#f8f9fa", borderTop: "1px solid #dee2e6", padding: "8px 16px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setSelectedMarketModal(null)}
                  style={{ backgroundColor: "#6c757d", color: "#ffffff", border: "none", borderRadius: "3px", padding: "5px 14px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
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
