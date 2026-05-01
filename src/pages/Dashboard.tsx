import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Search } from "lucide-react";
import { fetchBetfairEvents } from "@/functions";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchUsername, setSearchUsername] = useState("");

  const { data: markets = [], isLoading, refetch } = useQuery({
    queryKey: ["dashboard-markets"],
    queryFn: () => fetchBetfairEvents({}),
    staleTime: 60000,
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

  return (
    <div style={{ minHeight: "100vh", background: "#e6f2fc", fontFamily: "Roboto, system-ui, sans-serif" }}>
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
