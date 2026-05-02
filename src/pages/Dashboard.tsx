import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Filter, Search, Plus, Check, RefreshCw } from "lucide-react";
import { fetchBetfairEvents } from "@/functions";
import { Match } from "@/entities";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchUsername, setSearchUsername] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const { data: markets = [], isLoading, refetch } = useQuery({
    queryKey: ["dashboard-markets"],
    queryFn: () => fetchBetfairEvents({}),
    staleTime: 60000,
  });

  const { mutate: addMatchToDB, variables: addingId } = useMutation({
    mutationFn: async (event: any) => {
      await Match.create({
        title: event.title,
        sport: event.sport,
        team1: event.team1,
        team2: event.team2,
        match_time: event.match_time || new Date().toISOString(),
        status: event.status || 'live',
        back_odds: event.back_odds || 1.9,
        lay_odds: event.lay_odds || 2.0,
        back_odds2: event.back_odds2 || 1.9,
        lay_odds2: event.lay_odds2 || 2.0,
        betfair_event_id: event.betfair_event_id,
        category: event.sport === 'Cricket' ? 'IPL 2026' : event.sport,
      });
      return event.betfair_event_id;
    },
    onSuccess: (id: string) => {
      setAddedIds(prev => new Set([...prev, id]));
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    }
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
      case 'Cricket': return '#00b181';
      case 'Soccer': return '#254465';
      case 'Tennis': return '#f1c40f';
      default: return '#7f8c8d';
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

        {/* Live Betfair Events — Click to Add */}
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
            background: "#ecf0f1",
            borderBottom: "1px solid #d0d0d0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <RefreshCw size={14} color="#555" />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#212529" }}>Live Betfair Events — Click to Add</span>
            </div>
            <button
              onClick={() => refetch()}
              style={{
                background: "#254465",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
          
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {isLoading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#666", fontSize: 13 }}>Loading live events...</div>
            ) : markets.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#666", fontSize: 13 }}>No live events found. Click Refresh to try again.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 16px", borderBottom: "1px solid #eee" }}>Match</th>
                    <th style={{ textAlign: "left", padding: "10px 16px", borderBottom: "1px solid #eee" }}>Sport</th>
                    <th style={{ textAlign: "left", padding: "10px 16px", borderBottom: "1px solid #eee" }}>Time</th>
                    <th style={{ textAlign: "center", padding: "10px 16px", borderBottom: "1px solid #eee" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(markets as any[]).map((event: any) => (
                    <tr key={event.id} style={{ borderBottom: "1px solid #f1f1f1" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#333" }}>{event.title}</div>
                        <div style={{ fontSize: 10, color: "#999" }}>ID: {event.betfair_event_id}</div>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{
                          background: getSportColor(event.sport),
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontSize: 10,
                          fontWeight: 700
                        }}>
                          {event.sport}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ color: event.status === 'live' ? "#00b181" : "#666", fontWeight: 600 }}>
                          {event.status === 'live' ? '● LIVE' : 'UPCOMING'}
                        </div>
                        <div style={{ fontSize: 10, color: "#777" }}>
                          {event.match_time ? new Date(event.match_time).toLocaleString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' PKT' : '-'}
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        {addedIds.has(event.betfair_event_id) ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#00b181", fontWeight: 700, fontSize: 11, justifyContent: "center" }}>
                            <Check size={14} />
                            Added
                          </div>
                        ) : (
                          <button
                            onClick={() => addMatchToDB(event)}
                            disabled={addingId === event}
                            style={{
                              background: "#254465",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              padding: "6px 12px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              margin: "0 auto"
                            }}
                          >
                            <Plus size={12} />
                            {addingId === event ? 'Adding...' : 'Add Match'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
