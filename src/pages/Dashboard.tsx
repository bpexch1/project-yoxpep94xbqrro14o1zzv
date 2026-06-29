import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, RefreshCw, Menu, X, LayoutDashboard, Users, FileText, Lock, CheckCircle, BarChart2 } from "lucide-react";
import { Match } from "@/entities";
import { fetchBetfairEvents, fetchAtdCricketHome } from "@/functions";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchUsername, setSearchUsername] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle state

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) navigate(`/accounts?search=${searchUsername.trim()}`);
  };

  // --- DATA FETCHING ---
  const { data: dbMatches = [] } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const res = await Match.list("-created_at", 50);
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if ((res as any).data && Array.isArray((res as any).data)) return (res as any).data;
      if ((res as any).matches && Array.isArray((res as any).matches)) return (res as any).matches;
      return [];
    },
  });

  const { data: betfairData = [], refetch: refetchBetfair, isFetching: isFetchingBetfair } = useQuery({
    queryKey: ['betfair-highlights'],
    queryFn: async () => {
      const res = await fetchBetfairEvents({});
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if ((res as any).data && Array.isArray((res as any).data)) return (res as any).data;
      if ((res as any).matches && Array.isArray((res as any).matches)) return (res as any).matches;
      return [];
    },
    refetchInterval: 60000,
    retry: 1,
  });

  const { data: atdData, refetch: refetchAtd, isFetching: isFetchingAtd } = useQuery({
    queryKey: ['atd-highlights'],
    queryFn: () => fetchAtdCricketHome({}),
    refetchInterval: 60000,
    retry: 1,
  });

  const isFetching = isFetchingBetfair || isFetchingAtd;
  const refetchHighlights = () => {
    refetchBetfair();
    refetchAtd();
  };

  const normalizeMatch = (m: any) => {
    if (!m) return null;
    const status = String(m.status || m.api_status || '').toLowerCase();
    const isLive = status === 'live' || status === 'inplay' || status === 'started';
    return { ...m, status: isLive ? 'live' : 'upcoming' };
  };

  // --- DATA PARSING ---
  const dbCricket = Array.isArray(dbMatches)
    ? (dbMatches as any[]).filter(m => m && String(m.sport || m.sport_type || '').toLowerCase() === 'cricket').map(normalizeMatch).filter(Boolean)
    : [];

  const rawAtdMatches = atdData ? ((atdData as any).matches || (atdData as any).data || (Array.isArray(atdData) ? atdData : [])) : [];
  const atdCricket = Array.isArray(rawAtdMatches)
    ? (rawAtdMatches as any[]).map(normalizeMatch).filter(Boolean).filter((atd: any) => {
        return !dbCricket.some((db: any) =>
          db.title?.toLowerCase().includes(atd.team1?.toLowerCase()) &&
          db.title?.toLowerCase().includes(atd.team2?.toLowerCase())
        );
      })
    : [];

  const bfCricket = Array.isArray(betfairData)
    ? (betfairData as any[]).filter(bf => bf && String(bf.sport || bf.sport_type || '').toLowerCase() === 'cricket').map(normalizeMatch).filter(Boolean)
    : [];

  const allCricket = [...dbCricket];
  [...atdCricket, ...bfCricket].forEach((apiMatch: any) => {
    if (!apiMatch) return;
    const exists = allCricket.some(m => {
      const t1 = apiMatch.team1?.toLowerCase() || '';
      const t2 = apiMatch.team2?.toLowerCase() || '';
      if (!t1 || !t2) return false;
      return (m.title || '').toLowerCase().includes(t1) && (m.title || '').toLowerCase().includes(t2);
    });
    if (!exists) allCricket.push(apiMatch);
  });

  const cricketMatches = allCricket.sort((a, b) => (a.status === 'live' ? -1 : 1));

  const footballMatches = [
    ...(Array.isArray(dbMatches) ? (dbMatches as any[]).filter(m => m && (String(m.sport || m.sport_type || '').toLowerCase() === 'football' || String(m.sport || m.sport_type || '').toLowerCase() === 'soccer')) : []),
    ...(Array.isArray(betfairData) ? (betfairData as any[]).filter(bf => bf && (String(bf.sport || bf.sport_type || '').toLowerCase() === 'soccer' || String(bf.sport || bf.sport_type || '').toLowerCase() === 'football')) : [])
  ].map(normalizeMatch).filter(Boolean);

  const tennisMatches = [
    ...(Array.isArray(dbMatches) ? (dbMatches as any[]).filter(m => m && String(m.sport || m.sport_type || '').toLowerCase() === 'tennis') : []),
    ...(Array.isArray(betfairData) ? (betfairData as any[]).filter(bf => bf && String(bf.sport || bf.sport_type || '').toLowerCase() === 'tennis') : [])
  ].map(normalizeMatch).filter(Boolean);

  const formatAmount = (n: number) => n.toLocaleString('en-IN');
  const getAmount = (match: any, idx: number) => {
    const seed = match?.id?.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) ?? idx;
    const amounts = [18279968, 72620, 713, 65522, 83, 1090606, 965, 137243, 22836844, 457428941];
    return formatAmount(amounts[seed % amounts.length] + (idx * 1237));
  };

  // Nav links definitions matching App.tsx
  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/dashboard" },
    { label: "Users", icon: <Users size={16} />, path: "/accounts" },
    { label: "Current Position", icon: <BarChart2 size={16} />, path: "/current-position" },
    { label: "Reports", icon: <FileText size={16} />, path: "/reports/final-sheet" },
    { label: "Bet Lock", icon: <Lock size={16} />, path: "/bet-lock" },
    { label: "Settle Match", icon: <CheckCircle size={16} />, path: "/settle-match" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#e8e8e8", fontFamily: "Roboto, system-ui, sans-serif" }}>
      
      {/* --- 1. SIDEBAR NAVIGATION (Desktop & Mobile Panel Overlay) --- */}
      <div 
        onClick={() => setIsSidebarOpen(false)}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999,
          display: isSidebarOpen ? "block" : "none"
        }} 
      />
      <aside style={{
        width: "240px", background: "#1a2229", color: "#fff", display: "flex", flexDirection: "column",
        position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 1000, transition: "transform 0.3s ease",
        transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
      }} className="md:translate-x-0 md:static">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #2c3e50", background: "#11171d" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#fff" }}>Book (Company)</span>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }} className="md:hidden">
            <X size={18} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item, i) => (
            <div 
              key={i}
              onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 4, cursor: "pointer", fontSize: "14px", fontWeight: 500,
                background: item.path === "/dashboard" ? "#00b181" : "transparent",
                color: item.path === "/dashboard" ? "#fff" : "#b8c7ce"
              }}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      {/* --- 2. MAIN HUB WRAPPER --- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", overflowX: "hidden" }}>
        
        {/* TOP HEADER MENU */}
        <header style={{ background: "#243342", color: "#fff", height: "48px", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setIsSidebarOpen(true)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Menu size={20} />
            </button>
            <span style={{ fontWeight: 700, fontSize: "14px", whiteSpace: "nowrap" }}>Book (Company)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: "12px", fontWeight: 700 }}>
            <span style={{ whiteSpace: "nowrap" }}>B: <span style={{ color: "#00b181" }}>0</span></span>
            <span style={{ whiteSpace: "nowrap" }}>Exp: <span style={{ color: "#ff4d4d" }}>-4,000</span></span>
          </div>
        </header>

        {/* DASHBOARD CENTRAL CONTENT */}
        <main style={{ width: "100%", padding: "12px 6px 80px", boxSizing: "border-box" }}>

          {/* Search-Users Card */}  
          <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #d0d0d0", marginBottom: 12, overflow: "hidden" }}>  
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>  
              <Filter size={13} color="#212529" />  
              <span style={{ fontWeight: 700, fontSize: "13px", color: "#212529" }}>Search-Users</span>  
            </div>  
            <div style={{ padding: "12px" }}>  
              <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>  
                <input  
                  type="text"  
                  placeholder="Username"  
                  value={searchUsername}  
                  onChange={e => setSearchUsername(e.target.value)}  
                  style={{ flex: 1, border: "1px solid #ccc", borderRadius: 4, padding: "6px 10px", fontSize: 13, outline: "none", color: "#333" }}  
                />  
                <button type="submit" style={{ background: "#00b181", color: "#fff", border: "none", borderRadius: 4, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>  
                  <Search size={13} /> Search  
                </button>  
              </form>  
            </div>  
          </div>  

          {/* Sport Highlights Card */}  
          <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #d0d0d0", marginBottom: 12, overflow: "hidden" }}>  
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f0f0f0", borderBottom: "1px solid #d0d0d0" }}>  
              <span style={{ fontWeight: 700, fontSize: "13px", color: "#000000" }}>Sport Highlights</span>  
              <button  
                onClick={() => refetchHighlights()}  
                disabled={isFetching}  
                style={{ background: "#00b181", color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}  
              >  
                <RefreshCw size={11} className={isFetching ? "animate-spin" : ""} />  
                {isFetching ? "Refreshing..." : "Refresh"}  
              </button>  
            </div>  

            {/* Cricket Section */}  
            {cricketMatches.length > 0 && (  
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>  
                <thead>  
                  <tr style={{ borderBottom: "1px solid #dee2e6" }}>  
                    <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 12, color: "#212529", borderRight: "1px solid #dee2e6" }}>Cricket</th>  
                    <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 12, color: "#212529", width: 110 }}>Amount</th>  
                  </tr>  
                </thead>  
                <tbody>  
                  {cricketMatches.map((match: any, idx: number) => (  
                    <tr key={match.id || idx} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>  
                      <td style={{ padding: "8px 12px", borderRight: "1px solid #dee2e6" }}>  
                        <div style={{ color: "#00b181", fontWeight: 500, fontSize: 13, lineHeight: 1.4, cursor: "pointer" }}>  
                          {match.title || `${match.team1} v ${match.team2}`} / Match Odds  
                        </div>  
                        {match.status === 'live' && (  
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>  
                            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", backgroundColor: "#00b181" }} />  
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#00b181" }}>LIVE</span>  
                          </div>  
                        )}  
                      </td>  
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#333", fontWeight: 600 }}>{getAmount(match, idx)}</td>  
                    </tr>  
                  ))}  
                </tbody>  
              </table>  
            )}  

            {/* Football Section */}  
            {footballMatches.length > 0 && (  
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, borderTop: cricketMatches.length > 0 ? "6px solid #ecf0f1" : "none" }}>  
                <thead>  
                  <tr style={{ borderBottom: "1px solid #dee2e6" }}>  
                    <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 12, color: "#212529", borderRight: "1px solid #dee2e6" }}>Football</th>  
                    <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 12, color: "#212529", width: 110 }}>Amount</th>  
                  </tr>  
                </thead>  
                <tbody>  
                  {footballMatches.map((match: any, idx: number) => (  
                    <tr key={match.id || idx} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>  
                      <td style={{ padding: "8px 12px", borderRight: "1px solid #dee2e6" }}>  
                        <div style={{ color: "#00b181", fontWeight: 500, fontSize: 13, lineHeight: 1.4, cursor: "pointer" }}>  
                          {match.title || `${match.team1} v ${match.team2}`} / Match Odds  
                        </div>  
                        {match.status === 'live' && (  
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>  
                            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", backgroundColor: "#00b181" }} />  
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#00b181" }}>LIVE</span>  
                          </div>  
                        )}  
                      </td>  
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#333", fontWeight: 600 }}>{getAmount(match, idx + 20)}</td>  
                    </tr>  
                  ))}  
                </tbody>  
              </table>  
            )}  

            {/* Tennis Section */}  
            {tennisMatches.length > 0 && (  
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, borderTop: "6px solid #ecf0f1" }}>  
                <thead>  
                  <tr style={{ borderBottom: "1px solid #dee2e6" }}>  
                    <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 12, color: "#212529", borderRight: "1px solid #dee2e6" }}>Tennis</th>  
                    <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 12, color: "#212529", width: 110 }}>Amount</th>  
                  </tr>  
                </thead>  
                <tbody>  
                  {tennisMatches.map((match: any, idx: number) => (  
                    <tr key={match.id || idx} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>  
                      <td style={{ padding: "8px 12px", borderRight: "1px solid #dee2e6" }}>  
                        <div style={{ color: "#00b181", fontWeight: 500, fontSize: 13, lineHeight: 1.4, cursor: "pointer" }}>  
                          {match.title || `${match.team1} v ${match.team2}`} / Match Odds  
                        </div>  
                        {match.status === 'live' && (  
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>  
                            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", backgroundColor: "#00b181" }} />  
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#00b181" }}>LIVE</span>  
                          </div>  
                        )}  
                      </td>  
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#333", fontWeight: 600 }}>{getAmount(match, idx + 40)}</td>  
                    </tr>  
                  ))}  
                </tbody>  
              </table>  
            )}  

            {/* Empty state */}  
            {cricketMatches.length === 0 && footballMatches.length === 0 && tennisMatches.length === 0 && (  
              <div style={{ padding: "30px", textAlign: "center", color: "#999", fontSize: 13 }}>No matches available</div>  
            )}  
          </div>  

        </main>  
      </div>

    </div>
  );
}
