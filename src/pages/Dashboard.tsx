import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Filter, Search, Plus, Check, RefreshCw, Trash2, Edit2, X, Trophy } from "lucide-react";
import { fetchBetfairEvents, oddsEngine } from "@/functions";
import { Match } from "@/entities";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchUsername, setSearchUsername] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<{ id: string; val: string } | null>(null);
  const [editingCricbuzzId, setEditingCricbuzzId] = useState<{ id: string; val: string } | null>(null);
  const [newMatch, setNewMatch] = useState({
    title: "",
    sport: "Cricket",
    team1: "",
    team2: "",
    betfair_event_id: "",
    cricbuzz_match_id: "",
    status: "live",
    category: "IPL 2026",
  });

  const [oddsControl, setOddsControl] = useState<Record<string, {
    teamA_back: string; teamA_lay: string; teamB_back: string; teamB_lay: string;
  }>>({});
  const [expandedOddsId, setExpandedOddsId] = useState<string | null>(null);
  const [liveOddsMap, setLiveOddsMap] = useState<Record<string, any>>({});

  const inputStyle = {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "5px 8px",
    fontSize: "12px",
    outline: "none",
  };

  // Fetch all DB matches
  const { data: dbMatches = [], isLoading: dbLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: () => Match.list("-created_at", 50),
  });

  const { data: markets = [], isLoading, refetch } = useQuery({
    queryKey: ["dashboard-markets"],
    queryFn: () => fetchBetfairEvents({}),
    staleTime: 60000,
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

  // Add match mutation
  const { mutate: saveNewMatch, isPending: savingNew } = useMutation({
    mutationFn: async () => {
      const title = newMatch.title || `${newMatch.team1} v ${newMatch.team2}`;
      await Match.create({
        title,
        sport: newMatch.sport,
        team1: newMatch.team1,
        team2: newMatch.team2,
        match_time: new Date().toISOString(),
        status: newMatch.status,
        back_odds: 1.9,
        lay_odds: 2.0,
        back_odds2: 1.9,
        lay_odds2: 2.0,
        betfair_event_id: newMatch.betfair_event_id,
        cricbuzz_match_id: newMatch.cricbuzz_match_id,
        category: newMatch.category,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      setNewMatch({
        title: "",
        sport: "Cricket",
        team1: "",
        team2: "",
        betfair_event_id: "",
        cricbuzz_match_id: "",
        status: "live",
        category: "IPL 2026",
      });
      setShowAddForm(false);
    },
  });

  // Update event ID mutation
  const { mutate: updateEventId } = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: string }) => {
      await Match.update(id, { betfair_event_id: val });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      setEditingEventId(null);
    },
  });

  // Update Cricbuzz ID mutation
  const { mutate: updateCricbuzzId } = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: string }) => {
      await Match.update(id, { cricbuzz_match_id: val });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      setEditingCricbuzzId(null);
    },
  });

  // Delete match
  const { mutate: deleteMatch } = useMutation({
    mutationFn: async (id: string) => Match.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  const { mutate: addMatchToDB, variables: addingId } = useMutation({
    mutationFn: async (event: any) => {
      await Match.create({
        title: event.title,
        sport: event.sport,
        team1: event.team1,
        team2: event.team2,
        match_time: event.match_time || new Date().toISOString(),
        status: event.status || "live",
        back_odds: event.back_odds || 1.9,
        lay_odds: event.lay_odds || 2.0,
        back_odds2: event.back_odds2 || 1.9,
        lay_odds2: event.lay_odds2 || 2.0,
        betfair_event_id: event.betfair_event_id,
        cricbuzz_match_id: "",
        category: event.sport === "Cricket" ? "IPL 2026" : event.sport,
      });
      return event.betfair_event_id;
    },
    onSuccess: (id: string) => {
      setAddedIds((prev) => new Set([...prev, id]));
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) navigate(`/accounts?search=${searchUsername.trim()}`);
  };

  // Group markets by sport
  const grouped = (markets as any[]).reduce((acc: Record<string, any[]>, m) => {
    const sport = m.sport || 'Other';
    if (!acc[sport]) acc[sport] = [];
    acc[sport].push(m);
    return acc;
  }, {});

  const sportOrder = ['Soccer', 'Cricket', 'Tennis', 'Horse Racing'];
  const sortedSports = [
    ...sportOrder.filter(s => grouped[s]),
    ...Object.keys(grouped).filter(s => !sportOrder.includes(s))
  ];

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
            <Filter size={14} color="#555" />
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

        {/* Manage Matches Section */}
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
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Manage Matches</span>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                background: "#00b181",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <Plus size={14} />
              Add Match
            </button>
          </div>

          {/* Add Match Form */}
          {showAddForm && (
            <div style={{ padding: "16px", background: "#f1f8ff", borderBottom: "1px solid #d0d0d0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                   <label style={{ fontSize: 10, fontWeight: 700, color: "#666" }}>TEAM 1</label>
                   <input
                    placeholder="Team 1"
                    value={newMatch.team1}
                    onChange={e => setNewMatch({ ...newMatch, team1: e.target.value })}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                   <label style={{ fontSize: 10, fontWeight: 700, color: "#666" }}>TEAM 2</label>
                   <input
                    placeholder="Team 2"
                    value={newMatch.team2}
                    onChange={e => setNewMatch({ ...newMatch, team2: e.target.value })}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                   <label style={{ fontSize: 10, fontWeight: 700, color: "#666" }}>SPORT</label>
                   <select
                    value={newMatch.sport}
                    onChange={e => setNewMatch({ ...newMatch, sport: e.target.value })}
                    style={{ ...inputStyle, width: "100%", height: 28 }}
                  >
                    <option value="Cricket">Cricket</option>
                    <option value="Soccer">Soccer</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Horse Racing">Horse Racing</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                   <label style={{ fontSize: 10, fontWeight: 700, color: "#666" }}>STATUS</label>
                   <select
                    value={newMatch.status}
                    onChange={e => setNewMatch({ ...newMatch, status: e.target.value })}
                    style={{ ...inputStyle, width: "100%", height: 28 }}
                  >
                    <option value="live">Live</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                   <label style={{ fontSize: 10, fontWeight: 700, color: "#666" }}>CATEGORY</label>
                   <input
                    placeholder="e.g. IPL 2026"
                    value={newMatch.category}
                    onChange={e => setNewMatch({ ...newMatch, category: e.target.value })}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                   <label style={{ fontSize: 10, fontWeight: 700, color: "#666" }}>BETFAIR EVENT ID</label>
                   <input
                    placeholder="Event ID e.g. 33256431"
                    value={newMatch.betfair_event_id}
                    onChange={e => setNewMatch({ ...newMatch, betfair_event_id: e.target.value })}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                   <label style={{ fontSize: 10, fontWeight: 700, color: "#666" }}>CRICBUZZ MATCH ID</label>
                   <input
                    placeholder="Cricbuzz ID e.g. 40381"
                    value={newMatch.cricbuzz_match_id}
                    onChange={e => setNewMatch({ ...newMatch, cricbuzz_match_id: e.target.value })}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px", height: 28, alignSelf: "flex-end" }}>
                  <button
                    onClick={() => setShowAddForm(false)}
                    style={{ background: "#666", color: "#fff", border: "none", borderRadius: 4, padding: "0 12px", cursor: "pointer", fontSize: 12, height: "100%" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveNewMatch()}
                    disabled={savingNew}
                    style={{ background: "#00b181", color: "#fff", border: "none", borderRadius: 4, padding: "0 12px", cursor: "pointer", fontWeight: 700, fontSize: 12, height: "100%" }}
                  >
                    {savingNew ? 'Saving...' : 'Save Match'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DB Matches List */}
          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            {dbLoading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>Loading matches...</div>
            ) : dbMatches.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#999", fontSize: 13 }}>No matches found in database.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <th style={{ textAlign: "left", padding: "10px 16px", color: "#666", fontSize: 11, textTransform: "uppercase" }}>Match Info</th>
                    <th style={{ textAlign: "left", padding: "10px 16px", color: "#666", fontSize: 11, textTransform: "uppercase" }}>Event ID</th>
                    <th style={{ textAlign: "left", padding: "10px 16px", color: "#666", fontSize: 11, textTransform: "uppercase" }}>Cricbuzz ID</th>
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
                        <td style={{ padding: "10px 16px" }}>
                          {editingEventId?.id === match.id ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <input 
                                value={editingEventId.val} 
                                onChange={e => setEditingEventId({ ...editingEventId, val: e.target.value })}
                                style={{ ...inputStyle, width: 90, fontSize: 11, height: 24 }}
                              />
                              <button onClick={() => updateEventId(editingEventId)} style={{ color: "#00b181" }}><Check size={14} /></button>
                              <button onClick={() => setEditingEventId(null)} style={{ color: "#ff4d4d" }}><X size={14} /></button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: match.betfair_event_id ? "#333" : "#999" }}>
                              <span style={{ fontSize: 11, fontFamily: "monospace" }}>{match.betfair_event_id || "No ID"}</span>
                              <button 
                                onClick={() => setEditingEventId({ id: match.id, val: match.betfair_event_id || '' })}
                                style={{ color: "#3d6b8b", padding: 2 }}
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {editingCricbuzzId?.id === match.id ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <input 
                                value={editingCricbuzzId.val} 
                                onChange={e => setEditingCricbuzzId({ ...editingCricbuzzId, val: e.target.value })}
                                style={{ ...inputStyle, width: 80, fontSize: 11, height: 24 }}
                              />
                              <button onClick={() => updateCricbuzzId(editingCricbuzzId)} style={{ color: "#00b181" }}><Check size={14} /></button>
                              <button onClick={() => setEditingCricbuzzId(null)} style={{ color: "#ff4d4d" }}><X size={14} /></button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: match.cricbuzz_match_id ? "#333" : "#999" }}>
                              <span style={{ fontSize: 11, fontFamily: "monospace" }}>{match.cricbuzz_match_id || "No CB ID"}</span>
                              {match.sport === 'Cricket' && (
                                <button 
                                  onClick={() => setEditingCricbuzzId({ id: match.id, val: match.cricbuzz_match_id || '' })}
                                  style={{ color: "#3d6b8b", padding: 2 }}
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => setExpandedOddsId(prev => prev === match.id ? null : match.id)}
                              style={{
                                padding: '3px 8px', fontSize: 10, fontWeight: 700, borderRadius: 3, cursor: 'pointer',
                                backgroundColor: liveOddsMap[match.id] ? '#254465' : '#6c757d',
                                color: 'white', border: 'none'
                              }}
                              title="Live Odds Control"
                            >
                              ⚡ Odds
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('Delete this match?')) deleteMatch(match.id);
                              }}
                              style={{ color: "#ff4d4d", padding: 4 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedOddsId === match.id && (
                        <tr>
                          <td colSpan={4} style={{ padding: 0 }}>
                            <div style={{ backgroundColor: '#f0f8ff', border: '1px solid #c4d9ea', padding: '12px', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: 12 }}>LIVE ODDS CONTROL — {match.team1} v {match.team2}</span>
                                {/* Suspend Toggle */}
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
                                {/* teamA_back */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: '#254465' }}>{match.team1 || 'Team A'} BACK</label>
                                  <input
                                    type="number" step="0.01"
                                    value={oddsControl[match.id]?.teamA_back ?? liveOddsMap[match.id]?.teamA_back ?? '1.90'}
                                    onChange={e => setOddsControl(prev => ({ ...prev, [match.id]: { ...prev[match.id], teamA_back: e.target.value }}))}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #72bbef', borderRadius: 4, fontSize: 13, fontWeight: 700, backgroundColor: '#dbeafe' }}
                                  />
                                </div>
                                {/* teamA_lay */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: '#254465' }}>{match.team1 || 'Team A'} LAY</label>
                                  <input
                                    type="number" step="0.01"
                                    value={oddsControl[match.id]?.teamA_lay ?? liveOddsMap[match.id]?.teamA_lay ?? '2.00'}
                                    onChange={e => setOddsControl(prev => ({ ...prev, [match.id]: { ...prev[match.id], teamA_lay: e.target.value }}))}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #faa9ba', borderRadius: 4, fontSize: 13, fontWeight: 700, backgroundColor: '#fde8e8' }}
                                  />
                                </div>
                                {/* teamB_back */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: '#254465' }}>{match.team2 || 'Team B'} BACK</label>
                                  <input
                                    type="number" step="0.01"
                                    value={oddsControl[match.id]?.teamB_back ?? liveOddsMap[match.id]?.teamB_back ?? '1.90'}
                                    onChange={e => setOddsControl(prev => ({ ...prev, [match.id]: { ...prev[match.id], teamB_back: e.target.value }}))}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #72bbef', borderRadius: 4, fontSize: 13, fontWeight: 700, backgroundColor: '#dbeafe' }}
                                  />
                                </div>
                                {/* teamB_lay */}
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: '#254465' }}>{match.team2 || 'Team B'} LAY</label>
                                  <input
                                    type="number" step="0.01"
                                    value={oddsControl[match.id]?.teamB_lay ?? liveOddsMap[match.id]?.teamB_lay ?? '2.00'}
                                    onChange={e => setOddsControl(prev => ({ ...prev, [match.id]: { ...prev[match.id], teamB_lay: e.target.value }}))}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #faa9ba', borderRadius: 4, fontSize: 13, fontWeight: 700, backgroundColor: '#fde8e8' }}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: 8 }}>
                                {/* Init button — if no odds exist in MongoDB yet */}
                                {!liveOddsMap[match.id] && (
                                  <button
                                    onClick={() => initOdds({ matchId: match.id, meta: { teamA: match.team1, teamB: match.team2, sport: match.sport, matchTitle: match.title } })}
                                    style={{ padding: '5px 14px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    + Init Market
                                  </button>
                                )}
                                {/* Save button */}
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
                                {/* Last updated */}
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

          {/* Live API Events Sub-section */}
          {markets.length > 0 && (
            <div style={{ borderTop: "1px solid #d0d0d0" }}>
              <div style={{ 
                padding: "8px 16px", 
                background: "#ecf0f1", 
                fontSize: 11, 
                fontWeight: 700, 
                color: "#254465",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>LIVE FROM API ({markets.length})</span>
                <button 
                  onClick={() => refetch()} 
                  style={{ color: "#00b181", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <RefreshCw size={10} /> REFRESH
                </button>
              </div>
              <div style={{ maxHeight: "200px", overflowY: "auto", fontSize: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {(markets as any[]).map((event: any) => (
                      <tr key={event.id} style={{ borderBottom: "1px solid #f1f1f1" }}>
                        <td style={{ padding: "8px 16px" }}>
                          <span style={{ color: getSportColor(event.sport), fontWeight: 700, marginRight: 8, fontSize: 10 }}>{event.sport?.toUpperCase()}</span>
                          {event.title}
                        </td>
                        <td style={{ padding: "8px 16px", textAlign: "right" }}>
                          {addedIds.has(event.betfair_event_id) ? (
                            <span style={{ color: "#00b181", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
                              <Check size={12} /> ADDED
                            </span>
                          ) : (
                            <button
                              onClick={() => addMatchToDB(event)}
                              disabled={addingId === event}
                              style={{
                                background: "#254465",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                padding: "3px 10px",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              {addingId === event ? '...' : 'ADD'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 2. Sport Highlights Card */}
        <div style={{
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #d0d0d0",
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
          overflow: "hidden"
        }}>
          {/* Card header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "#fff",
            borderBottom: "1px solid #d0d0d0"
          }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>Sport Highlights</span>
            <button
              onClick={() => refetch()}
              style={{
                background: "#00b181",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Refresh
            </button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6c757d", fontSize: 13 }}>
              Loading...
            </div>
          ) : markets.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6c757d", fontSize: 13 }}>
              No data available
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: "1px solid #ddd" }}>
              <tbody>
                {sortedSports.map(sport => (
                  <React.Fragment key={`group-${sport}`}>
                    {/* Sport section header row */}
                    <tr>
                      <td style={{
                        background: "#f4f4f4",
                        borderBottom: "1px solid #ddd",
                        borderTop: "1px solid #ddd",
                        padding: "7px 14px",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#333"
                      }}>{sport}</td>
                      <td style={{
                        background: "#f4f4f4",
                        borderBottom: "1px solid #ddd",
                        borderTop: "1px solid #ddd",
                        padding: "7px 14px",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#333",
                        width: 180,
                        textAlign: "right"
                      }}>Amount</td>
                    </tr>
                    {/* Match rows */}
                    {grouped[sport].map((market: any, idx: number) => (
                      <tr
                        key={market.id}
                        style={{ background: idx % 2 === 0 ? "#fff" : "#f9f9f9" }}
                      >
                        <td style={{
                          padding: "7px 14px",
                          borderBottom: "1px solid #f0f0f0"
                        }}>
                          <span
                            onClick={() => navigate(`/play/match/${market.id}`)}
                            style={{
                              color: "#00b181",
                              cursor: "pointer",
                              textDecoration: "none",
                              fontWeight: 500
                            }}
                            onMouseEnter={e => (e.target as HTMLElement).style.textDecoration = "underline"}
                            onMouseLeave={e => (e.target as HTMLElement).style.textDecoration = "none"}
                          >
                            {market.title}
                          </span>
                          {market.status === 'live' && (
                            <span style={{ color: "#00b181", marginLeft: 6, fontSize: 10 }}>●</span>
                          )}
                        </td>
                        <td style={{
                          padding: "7px 14px",
                          borderBottom: "1px solid #f0f0f0",
                          textAlign: "right",
                          color: "#333",
                          fontWeight: 500
                        }}>
                          {market.totalMatched > 0 ? market.totalMatched.toLocaleString() : "0"}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
}
