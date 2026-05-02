import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Search, Trophy } from "lucide-react";
import { oddsEngine } from "@/functions";
import { Match } from "@/entities";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchUsername, setSearchUsername] = useState("");
  const [oddsControl, setOddsControl] = useState<Record<string, {
    teamA_back: string; teamA_lay: string; teamB_back: string; teamB_lay: string;
  }>>({});
  const [expandedOddsId, setExpandedOddsId] = useState<string | null>(null);
  const [liveOddsMap, setLiveOddsMap] = useState<Record<string, any>>({});

  // Fetch all DB matches
  const { data: dbMatches = [], isLoading: dbLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: () => Match.list("-created_at", 50),
  });

  const { data: allMongoOdds, refetch: refetchOdds } = useQuery({
    queryKey: ['mongo-odds-all'],
    queryFn: async () => {
      const res = await oddsEngine({ action: 'getAllOdds' });
      return res?.odds || [];
    },
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (allMongoOdds) {
      const map: Record<string, any> = {};
      allMongoOdds.forEach((o: any) => { map[o.matchId] = o; });
      setLiveOddsMap(map);
    }
  }, [allMongoOdds]);

  const { mutate: saveOdds, isPending: savingOdds } = useMutation({
    mutationFn: async ({ matchId, odds, meta }: { matchId: string; odds: any; meta: any }) => {
      await oddsEngine({ action: 'updateOdds', matchId, odds, matchMeta: meta });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mongo-odds-all'] }); },
  });

  const { mutate: toggleSuspend } = useMutation({
    mutationFn: async ({ matchId, isSuspended }: { matchId: string; isSuspended: boolean }) => {
      await oddsEngine({ action: 'suspendMarket', matchId, isSuspended });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mongo-odds-all'] }); },
  });

  const { mutate: initOdds } = useMutation({
    mutationFn: async ({ matchId, meta }: { matchId: string; meta: any }) => {
      await oddsEngine({ action: 'initOdds', matchId, matchMeta: meta });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mongo-odds-all'] }); },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) navigate(`/accounts?search=${searchUsername.trim()}`);
  };

  const getSportColor = (sport: string) => {
    switch (sport) {
      case "Cricket":
        return "#00b181";
      case "Soccer":
        return "#254465";
      case "Tennis":
        return "#e67e22";
      default:
        return "#7f8c8d";
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ecf0f1", fontFamily: "Roboto, system-ui, sans-serif" }}>
      {/* Scrolling Welcome Ticker */}
      <div style={{
        backgroundColor: "#254465",
        overflow: "hidden",
        height: 32,
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8" style={{ color: "white", fontSize: 13, fontWeight: 500 }}>
          <span>🏏 Welcome to Exchange.</span>
          <span style={{ margin: "0 32px" }}>⚽ Welcome to Exchange.</span>
          <span style={{ margin: "0 32px" }}>🎾 Welcome to Exchange.</span>
          <span style={{ margin: "0 32px" }}>🏏 Welcome to Exchange.</span>
          <span style={{ margin: "0 32px" }}>⚽ Welcome to Exchange.</span>
          <span style={{ margin: "0 32px" }}>🎾 Welcome to Exchange.</span>
        </div>
      </div>
      <main style={{ width: "100%", padding: "16px 16px 80px" }}>

        {/* 1. Search-Users Card */}
        <div style={{
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #d0d0d0",
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
          marginBottom: 16,
          overflow: "hidden"
        }}>
          {/* Card header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "#ecf0f1",
            borderBottom: "1px solid #d0d0d0"
          }}>
            <Search size={14} color="#555" />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#212529" }}>Search-Users</span>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Username"
                value={searchUsername}
                onChange={e => setSearchUsername(e.target.value)}
                style={{
                  width: 280,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  padding: "6px 10px",
                  fontSize: 13,
                  outline: "none",
                  color: "#333"
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#00b181",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Search size={13} />
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Live Odds Control Section */}
        <div style={{
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #d0d0d0",
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
          marginBottom: 16,
          overflow: "hidden"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "#254465",
            borderBottom: "1px solid #d0d0d0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy size={16} color="#fff" />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Live Odds Control</span>
            </div>
          </div>

          {/* DB Matches List */}
          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {dbLoading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>Loading matches...</div>
            ) : dbMatches.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#999", fontSize: 13 }}>No matches found in database.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <th style={{ textAlign: "left", padding: "10px 16px", color: "#666", fontSize: 11, textTransform: "uppercase" }}>Match Info</th>
                    <th style={{ textAlign: "right", padding: "10px 16px", color: "#666", fontSize: 11, textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(dbMatches as any[]).map((match: any) => (
                    <React.Fragment key={match.id}>
                      <tr style={{ borderBottom: "1px solid #f1f1f1" }}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              background: getSportColor(match.sport),
                              color: "#fff",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              minWidth: 40,
                              textAlign: "center"
                            }}>
                              {match.sport?.substring(0, 3).toUpperCase()}
                            </span>
                            <span style={{ fontWeight: 600, color: "#333" }}>{match.title}</span>
                            <span style={{ 
                              fontSize: 10, 
                              color: match.status === 'live' ? "#00b181" : "#999",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 3
                            }}>
                              {match.status === 'live' && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00b181" }} />}
                              {match.status?.toUpperCase()}
                            </span>
                            {liveOddsMap[match.id]?.isSuspended && (
                              <span style={{ fontSize: 9, fontWeight: 700, color: "white", backgroundColor: "#dc3545", padding: "1px 4px", borderRadius: 2 }}>SUSP</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <button
                            onClick={() => setExpandedOddsId(prev => prev === match.id ? null : match.id)}
                            style={{
                              padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 4, cursor: 'pointer',
                              backgroundColor: liveOddsMap[match.id] ? '#254465' : '#6c757d',
                              color: 'white', border: 'none'
                            }}
                          >
                            ⚡ Odds Control
                          </button>
                        </td>
                      </tr>
                      {expandedOddsId === match.id && (
                        <tr>
                          <td colSpan={2} style={{ padding: 0 }}>
                            <div style={{ backgroundColor: '#f0f8ff', border: '1px solid #c4d9ea', padding: '12px', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: 12 }}>LIVE ODDS CONTROL — {match.team1} v {match.team2}</span>
                                <button
                                  onClick={() => toggleSuspend({ matchId: match.id, isSuspended: !liveOddsMap[match.id]?.isSuspended })}
                                  style={{
                                    padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    backgroundColor: liveOddsMap[match.id]?.isSuspended ? '#dc3545' : '#00b181',
                                    color: 'white', border: 'none'
                                  }}
                                >
                                  {liveOddsMap[match.id]?.isSuspended ? '⛔ SUSPENDED' : '✅ ACTIVE — Click to Suspend'}
                                </button>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: '#254465' }}>{match.team1 || 'Team A'} BACK</label>
                                  <input
                                    type="number" step="0.01"
                                    value={oddsControl[match.id]?.teamA_back ?? liveOddsMap[match.id]?.teamA_back ?? '1.90'}
                                    onChange={e => setOddsControl(prev => ({ ...prev, [match.id]: { ...prev[match.id], teamA_back: e.target.value }}))}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #72bbef', borderRadius: 4, fontSize: 13, fontWeight: 700, backgroundColor: '#dbeafe', outline: 'none' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: '#254465' }}>{match.team1 || 'Team A'} LAY</label>
                                  <input
                                    type="number" step="0.01"
                                    value={oddsControl[match.id]?.teamA_lay ?? liveOddsMap[match.id]?.teamA_lay ?? '2.00'}
                                    onChange={e => setOddsControl(prev => ({ ...prev, [match.id]: { ...prev[match.id], teamA_lay: e.target.value }}))}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #faa9ba', borderRadius: 4, fontSize: 13, fontWeight: 700, backgroundColor: '#fde8e8', outline: 'none' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: '#254465' }}>{match.team2 || 'Team B'} BACK</label>
                                  <input
                                    type="number" step="0.01"
                                    value={oddsControl[match.id]?.teamB_back ?? liveOddsMap[match.id]?.teamB_back ?? '1.90'}
                                    onChange={e => setOddsControl(prev => ({ ...prev, [match.id]: { ...prev[match.id], teamB_back: e.target.value }}))}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #72bbef', borderRadius: 4, fontSize: 13, fontWeight: 700, backgroundColor: '#dbeafe', outline: 'none' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: '#254465' }}>{match.team2 || 'Team B'} LAY</label>
                                  <input
                                    type="number" step="0.01"
                                    value={oddsControl[match.id]?.teamB_lay ?? liveOddsMap[match.id]?.teamB_lay ?? '2.00'}
                                    onChange={e => setOddsControl(prev => ({ ...prev, [match.id]: { ...prev[match.id], teamB_lay: e.target.value }}))}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #faa9ba', borderRadius: 4, fontSize: 13, fontWeight: 700, backgroundColor: '#fde8e8', outline: 'none' }}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: 8 }}>
                                {!liveOddsMap[match.id] && (
                                  <button
                                    onClick={() => initOdds({ matchId: match.id, meta: { teamA: match.team1, teamB: match.team2, sport: match.sport, matchTitle: match.title } })}
                                    style={{ padding: '5px 14px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    + Init Market
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const ctrl = oddsControl[match.id] || {};
                                    const cur = liveOddsMap[match.id] || {};
                                    saveOdds({
                                      matchId: match.id,
                                      odds: {
                                        teamA_back: parseFloat(ctrl.teamA_back ?? cur.teamA_back ?? '1.90'),
                                        teamA_lay: parseFloat(ctrl.teamA_lay ?? cur.teamA_lay ?? '2.00'),
                                        teamB_back: parseFloat(ctrl.teamB_back ?? cur.teamB_back ?? '1.90'),
                                        teamB_lay: parseFloat(ctrl.teamB_lay ?? cur.teamB_lay ?? '2.00'),
                                      },
                                      meta: { teamA: match.team1, teamB: match.team2, sport: match.sport, matchTitle: match.title }
                                    });
                                  }}
                                  disabled={savingOdds}
                                  style={{ padding: '5px 14px', backgroundColor: '#254465', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  {savingOdds ? '...' : '💾 Save Odds'}
                                </button>
                                {liveOddsMap[match.id]?.lastUpdated && (
                                  <span style={{ fontSize: 10, color: '#6c757d', alignSelf: 'center' }}>
                                    Updated: {new Date(liveOddsMap[match.id].lastUpdated).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
