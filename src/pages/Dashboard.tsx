import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, AlertTriangle, RefreshCw } from "lucide-react";
import { Match } from "@/entities";

interface DisplayMatchItem {
  id: string;
  title: string;
  sport: string;
  amount: string;
  isLive: boolean;
  matchTime?: string;
}

const DEFAULT_DASHBOARD_MATCHES = [
  // Soccer
  { id: "fb-1", title: "Roma V Inter / Match Odds", sport: "Soccer", amount: "1,40,29,346", isLive: true },
  { id: "fb-2", title: "Nottm Forest V Coventry / Match Odds", sport: "Soccer", amount: "1,40,40,110", isLive: true },
  { id: "fb-3", title: "Stuttgart V Dortmund / Match Odds", sport: "Soccer", amount: "88,35,988", isLive: true },
  { id: "fb-4", title: "Trabzonspor V Galatasaray / Match Odds", sport: "Soccer", amount: "8,22,308", isLive: true },
  // Cricket
  { id: "cr-1", title: "Afghanistan v India / Match Odds", sport: "Cricket", amount: "2,41,98,340", isLive: true },
  { id: "cr-2", title: "England v Sri Lanka / Match Odds", sport: "Cricket", amount: "1,83,40,120", isLive: true },
  { id: "cr-3", title: "Zimbabwe v Australia / Match Odds", sport: "Cricket", amount: "1,12,00,900", isLive: true },
  // Tennis
  { id: "tn-1", title: "Bucsa v Bejlek / Match Odds", sport: "Tennis", amount: "34,20,100", isLive: true },
  { id: "tn-2", title: "Frech v I Jovic / Match Odds", sport: "Tennis", amount: "28,90,450", isLive: true },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchUsername, setSearchUsername] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      navigate(`/accounts?search=${encodeURIComponent(searchUsername.trim())}`);
    }
  };

  // Fetch DB matches
  const { data: dbMatches = [], refetch, isFetching } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: () => Match.list("-created_at", 50),
    staleTime: 10000,
  });

  const handleRefresh = () => {
    refetch();
  };

  const formatAmount = (n: number) => n.toLocaleString('en-IN');
  const getAmountForMatch = (m: any, idx: number): string => {
    const seed = String(m.id || m.title || idx).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const amounts = [1255214, 2982530, 79187, 3070274, 328942, 1590250, 74459, 109282, 68805, 744726, 36622, 50155, 135773, 1441515, 219418937, 30555, 4709, 1311];
    return formatAmount(amounts[seed % amounts.length] + ((idx % 7) * 113));
  };

  // Build Soccer Matches
  const soccerMatches: DisplayMatchItem[] = useMemo(() => {
    const list: DisplayMatchItem[] = [];
    const addedTitles = new Set<string>();

    const dbSoccer = (Array.isArray(dbMatches) ? dbMatches : []).filter(
      (m: any) => m && (m.sport?.toLowerCase() === 'soccer' || m.sport?.toLowerCase() === 'football')
    );

    if (dbSoccer.length === 0) {
      return DEFAULT_DASHBOARD_MATCHES.filter(m => m.sport === "Soccer");
    }

    dbSoccer.forEach((m: any, idx: number) => {
      const titleBase = m.title || `${m.team1 || 'Team A'} v ${m.team2 || 'Team B'}`;
      const title = titleBase.includes('/ Match Odds') ? titleBase : `${titleBase} / Match Odds`;
      const key = title.toLowerCase().trim();
      if (!addedTitles.has(key)) {
        addedTitles.add(key);
        const status = String(m.status || m.api_status || '').toLowerCase();
        const isLive = status === 'live' || status === 'inplay' || status === 'started';
        list.push({
          id: m.id || `live-fb-${idx}`,
          title,
          sport: "Soccer",
          amount: getAmountForMatch(m, idx),
          isLive,
        });
      }
    });

    return list;
  }, [dbMatches]);

  // Build Cricket Matches
  const cricketMatches: DisplayMatchItem[] = useMemo(() => {
    const list: DisplayMatchItem[] = [];
    const addedTitles = new Set<string>();

    const dbCricket = (Array.isArray(dbMatches) ? dbMatches : []).filter(
      (m: any) => m && m.sport?.toLowerCase() === 'cricket'
    );

    if (dbCricket.length === 0) {
      return DEFAULT_DASHBOARD_MATCHES.filter(m => m.sport === "Cricket");
    }

    dbCricket.forEach((m: any, idx: number) => {
      const titleBase = m.title || `${m.team1 || 'Team A'} v ${m.team2 || 'Team B'}`;
      const title = titleBase.includes('/ Match Odds') ? titleBase : `${titleBase} / Match Odds`;
      const key = title.toLowerCase().trim();
      if (!addedTitles.has(key)) {
        addedTitles.add(key);
        const status = String(m.status || m.api_status || '').toLowerCase();
        const isLive = status === 'live' || status === 'inplay' || status === 'started';
        list.push({
          id: m.id || `live-ck-${idx}`,
          title,
          sport: "Cricket",
          amount: getAmountForMatch(m, idx + 10),
          isLive,
        });
      }
    });

    return list;
  }, [dbMatches]);

  // Build Tennis Matches
  const tennisMatches: DisplayMatchItem[] = useMemo(() => {
    const list: DisplayMatchItem[] = [];
    const addedTitles = new Set<string>();

    const dbTennis = (Array.isArray(dbMatches) ? dbMatches : []).filter(
      (m: any) => m && m.sport?.toLowerCase() === 'tennis'
    );

    if (dbTennis.length === 0) {
      return DEFAULT_DASHBOARD_MATCHES.filter(m => m.sport === "Tennis");
    }

    dbTennis.forEach((m: any, idx: number) => {
      const titleBase = m.title || `${m.team1 || 'Player 1'} v ${m.team2 || 'Player 2'}`;
      const title = titleBase.includes('/ Match Odds') ? titleBase : `${titleBase} / Match Odds`;
      const key = title.toLowerCase().trim();
      if (!addedTitles.has(key)) {
        addedTitles.add(key);
        const status = String(m.status || m.api_status || '').toLowerCase();
        const isLive = status === 'live' || status === 'inplay' || status === 'started';
        list.push({
          id: m.id || `live-tn-${idx}`,
          title,
          sport: "Tennis",
          amount: getAmountForMatch(m, idx + 20),
          isLive,
        });
      }
    });

    return list;
  }, [dbMatches]);

  const handleMatchClick = (match: DisplayMatchItem) => {
    navigate(`/play/match/${match.id}`);
  };

  const totalHighlightsCount = soccerMatches.length + cricketMatches.length + tennisMatches.length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f2f4f8", fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }}>
      <div style={{ width: "100%", padding: "10px 10px 40px" }}>

        {/* 1. Search-Users Card */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "3px", border: "1px solid #dcdcdc", marginBottom: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          {/* Card Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
            <Filter size={14} color="#212529" strokeWidth={2.5} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#212529" }}>Search-Users</span>
          </div>

          {/* Card Body */}
          <div style={{ padding: "14px 14px" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", maxWidth: "420px" }}>
              <input
                type="text"
                placeholder="Username"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                style={{
                  flex: 1,
                  height: "36px",
                  border: "1px solid #ced4da",
                  borderRight: "none",
                  borderRadius: "4px 0 0 4px",
                  padding: "6px 12px",
                  fontSize: "14px",
                  outline: "none",
                  color: "#495057",
                  backgroundColor: "#ffffff",
                }}
              />
              <button
                type="submit"
                style={{
                  height: "36px",
                  backgroundColor: "#00b181",
                  color: "#ffffff",
                  border: "1px solid #00b181",
                  borderRadius: "0 4px 4px 0",
                  padding: "0 14px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  whiteSpace: "nowrap",
                }}
              >
                <Search size={14} strokeWidth={2.5} />
                Search
              </button>
            </form>
          </div>
        </div>

        {/* 2. Sport Highlights Card */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "3px", border: "1px solid #dcdcdc", marginBottom: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          {/* Card Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#212529" }}>Sport Highlights</span>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              style={{
                backgroundColor: "#00b181",
                color: "#ffffff",
                border: "none",
                borderRadius: "3px",
                padding: "2px 8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                lineHeight: "1.5",
              }}
            >
              {isFetching ? "Refreshing" : "Refresh"}
            </button>
          </div>

          {/* Tables Container */}
          <div>
            {/* Soccer Table */}
            {soccerMatches.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <th style={{ textAlign: "left", padding: "7px 12px", fontWeight: 700, fontSize: "14px", color: "#212529", borderBottom: "1px solid #dee2e6", borderRight: "1px solid #dee2e6" }}>
                      Soccer
                    </th>
                    <th style={{ textAlign: "left", padding: "7px 12px", fontWeight: 700, fontSize: "14px", color: "#212529", borderBottom: "1px solid #dee2e6", width: "120px" }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {soccerMatches.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => handleMatchClick(m)}
                      style={{ borderBottom: "1px solid #e9ecef", cursor: "pointer", backgroundColor: "#ffffff" }}
                    >
                      <td style={{ padding: "8px 12px", borderRight: "1px solid #dee2e6", color: "#009e74", fontWeight: 700, fontSize: "13.5px", lineHeight: 1.35 }}>
                        <span>{m.title}</span>
                        {m.isLive && (
                          <span
                            style={{
                              display: "inline-block",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: "#1b5e20",
                              marginLeft: "6px",
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </td>
                      <td style={{ padding: "8px 12px", color: "#212529", fontSize: "13.5px", fontWeight: 400 }}>
                        {m.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {/* Cricket Table */}
            {cricketMatches.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <th style={{ textAlign: "left", padding: "7px 12px", fontWeight: 700, fontSize: "14px", color: "#212529", borderTop: soccerMatches.length > 0 ? "1px solid #dee2e6" : "none", borderBottom: "1px solid #dee2e6", borderRight: "1px solid #dee2e6" }}>
                      Cricket
                    </th>
                    <th style={{ textAlign: "left", padding: "7px 12px", fontWeight: 700, fontSize: "14px", color: "#212529", borderTop: soccerMatches.length > 0 ? "1px solid #dee2e6" : "none", borderBottom: "1px solid #dee2e6", width: "120px" }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cricketMatches.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => handleMatchClick(m)}
                      style={{ borderBottom: "1px solid #e9ecef", cursor: "pointer", backgroundColor: "#ffffff" }}
                    >
                      <td style={{ padding: "8px 12px", borderRight: "1px solid #dee2e6", color: "#009e74", fontWeight: 700, fontSize: "13.5px", lineHeight: 1.35 }}>
                        <span>{m.title}</span>
                        {m.isLive && (
                          <span
                            style={{
                              display: "inline-block",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: "#1b5e20",
                              marginLeft: "6px",
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </td>
                      <td style={{ padding: "8px 12px", color: "#212529", fontSize: "13.5px", fontWeight: 400 }}>
                        {m.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {/* Tennis Table */}
            {tennisMatches.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <th style={{ textAlign: "left", padding: "7px 12px", fontWeight: 700, fontSize: "14px", color: "#212529", borderTop: (soccerMatches.length > 0 || cricketMatches.length > 0) ? "1px solid #dee2e6" : "none", borderBottom: "1px solid #dee2e6", borderRight: "1px solid #dee2e6" }}>
                      Tennis
                    </th>
                    <th style={{ textAlign: "left", padding: "7px 12px", fontWeight: 700, fontSize: "14px", color: "#212529", borderTop: (soccerMatches.length > 0 || cricketMatches.length > 0) ? "1px solid #dee2e6" : "none", borderBottom: "1px solid #dee2e6", width: "120px" }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tennisMatches.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => handleMatchClick(m)}
                      style={{ borderBottom: "1px solid #e9ecef", cursor: "pointer", backgroundColor: "#ffffff" }}
                    >
                      <td style={{ padding: "8px 12px", borderRight: "1px solid #dee2e6", color: "#009e74", fontWeight: 700, fontSize: "13.5px", lineHeight: 1.35 }}>
                        <span>{m.title}</span>
                        {m.isLive && (
                          <span
                            style={{
                              display: "inline-block",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: "#1b5e20",
                              marginLeft: "6px",
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </td>
                      <td style={{ padding: "8px 12px", color: "#212529", fontSize: "13.5px", fontWeight: 400 }}>
                        {m.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {/* Clean status message when no matches are available */}
            {totalHighlightsCount === 0 && (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "#6c757d", fontSize: "13.5px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px", color: "#856404", fontWeight: 700 }}>
                  <AlertTriangle size={18} color="#856404" />
                  <span>No Active Matches Currently Available</span>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#6c757d" }}>
                  Please click Refresh or check back shortly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer (matches Screenshot 1 exactly) */}
        <div style={{ textAlign: "center", padding: "20px 10px 10px", fontSize: "13px", fontWeight: 700, color: "#212529" }}>
          Welcome to Exchange.
        </div>

      </div>
    </div>
  );
}
