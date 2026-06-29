import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, RefreshCw } from "lucide-react";
import { Match } from "@/entities";
import { fetchBetfairEvents, fetchAtdCricketHome } from "@/functions";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchUsername, setSearchUsername] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) navigate(`/accounts?search=${searchUsername.trim()}`);
  };

  // 1. Fetch DB matches for highlights (Hum har response key ko deeply check karenge)
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

  // 2. Fetch Betfair live events for highlights
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

  // 3. Fetch ATD Cricket matches for highlights
  const { data: atdData, refetch: refetchAtd, isFetching: isFetchingAtd } = useQuery({
    queryKey: ['atd-highlights'],
    queryFn: async () => {
      const res = await fetchAtdCricketHome({});
      return res || {};
    },
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
    return {
      ...m,
      status: isLive ? 'live' : 'upcoming'
    };
  };

  // --- SAFE DATA PARSING ---

  // CRICKET
  const dbCricket = Array.isArray(dbMatches)
    ? (dbMatches as any[]).filter(m => m && String(m.sport || m.sport_type || '').toLowerCase() === 'cricket').map(normalizeMatch).filter(Boolean)
    : [];

  // ATD Cricket Matches key handling
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

  // FOOTBALL (Soccer aur Football dono key text check)
  const footballMatches = [
    ...(Array.isArray(dbMatches) ? (dbMatches as any[]).filter(m => m && (String(m.sport || m.sport_type || '').toLowerCase() === 'football' || String(m.sport || m.sport_type || '').toLowerCase() === 'soccer')) : []),
    ...(Array.isArray(betfairData) ? (betfairData as any[]).filter(bf => bf && (String(bf.sport || bf.sport_type || '').toLowerCase() === 'soccer' || String(bf.sport || bf.sport_type || '').toLowerCase() === 'football')) : [])
  ].map(normalizeMatch).filter(Boolean);

  // TENNIS
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

  return (
    <div style={{ minHeight: "100vh", background: "#e8e8e8", fontFamily: "Roboto, system-ui, sans-serif" }}>
      <main style={{ width: "100%", padding: "12px 5px 80px" }}>

        {/* 1. Search-Users Card */}  
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #d0d0d0", marginBottom: 14, overflow: "hidden" }}>  
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>  
            <Filter size={14} color="#212529" />  
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#212529" }}>Search-Users</span>  
          </div>  
          <div style={{ padding: "14px 14px" }}>  
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>  
              <input  
                type="text"  
                placeholder="Username"  
                value={searchUsername}  
                onChange={e => setSearchUsername(e.target.value)}  
                style={{ flex: 1, border: "1px solid #ccc", borderRadius: 4, padding: "7px 10px", fontSize: 13, outline: "none", color: "#333" }}  
              />  
              <button type="submit" style={{ background: "#00b181", color: "#fff", border: "none", borderRadius: 4, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>  
                <Search size={13} /> Search  
              </button>  
            </form>  
          </div>  
        </div>  

        {/* 2. Sport Highlights Card */}  
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #d0d0d0", marginBottom: 14, overflow: "hidden" }}>  
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "#f0f0f0", borderBottom: "1px solid #d0d0d0" }}>  
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#000000" }}>Sport Highlights</span>  
            <button  
              onClick={() => refetchHighlights()}  
              disabled={isFetching}  
              style={{ background: "#00b181", color: "#fff", border: "none", borderRadius: 4, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}  
            >  
              <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />  
              {isFetching ? "Refreshing..." : "Refresh"}  
            </button>  
          </div>  

          {/* Cricket Section */}  
          {cricketMatches.length > 0 && (  
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>  
              <thead>  
                <tr style={{ borderBottom: "1px solid #dee2e6" }}>  
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 13, color: "#212529", borderRight: "1px solid #dee2e6" }}>Cricket</th>  
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 13, color: "#212529", width: 130 }}>Amount</th>  
                </tr>  
              </thead>  
              <tbody>  
                {cricketMatches.map((match: any, idx: number) => (  
                  <tr key={match.id || idx} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>  
                    <td style={{ padding: "9px 12px", borderRight: "1px solid #dee2e6" }}>  
                      <div style={{ color: "#00b181", fontWeight: 500, fontSize: 13, lineHeight: 1.4, cursor: "pointer" }}>  
                        {match.title || `${match.team1} v ${match.team2}`} / Match Odds  
                      </div>  
                      {match.status === 'live' && (  
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>  
                          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#00b181" }} />  
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#00b181" }}>LIVE</span>  
                        </div>  
                      )}  
                    </td>  
                    <td style={{ padding: "9px 12px", fontSize: 13, color: "#333", fontWeight: 600 }}>{getAmount(match, idx)}</td>  
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
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 13, color: "#212529", borderRight: "1px solid #dee2e6" }}>Football</th>  
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 13, color: "#212529", width: 130 }}>Amount</th>  
                </tr>  
              </thead>  
              <tbody>  
                {footballMatches.map((match: any, idx: number) => (  
                  <tr key={match.id || idx} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>  
                    <td style={{ padding: "9px 12px", borderRight: "1px solid #dee2e6" }}>  
                      <div style={{ color: "#00b181", fontWeight: 500, fontSize: 13, lineHeight: 1.4, cursor: "pointer" }}>  
                        {match.title || `${match.team1} v ${match.team2}`} / Match Odds  
                      </div>  
                      {match.status === 'live' && (  
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>  
                          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#00b181" }} />  
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#00b181" }}>LIVE</span>  
                        </div>  
                      )}  
                    </td>  
                    <td style={{ padding: "9px 12px", fontSize: 13, color: "#333", fontWeight: 600 }}>{getAmount(match, idx + 20)}</td>  
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
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 13, color: "#212529", borderRight: "1px solid #dee2e6" }}>Tennis</th>  
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 13, color: "#212529", width: 130 }}>Amount</th>  
                </tr>  
              </thead>  
              <tbody>  
                {tennisMatches.map((match: any, idx: number) => (  
                  <tr key={match.id || idx} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>  
                    <td style={{ padding: "9px 12px", borderRight: "1px solid #dee2e6" }}>  
                      <div style={{ color: "#00b181", fontWeight: 500, fontSize: 13, lineHeight: 1.4, cursor: "pointer" }}>  
                        {match.title || `${match.team1} v ${match.team2}`} / Match Odds  
                      </div>  
                      {match.status === 'live' && (  
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>  
                          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#00b181" }} />  
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#00b181" }}>LIVE</span>  
                        </div>  
                      )}  
                    </td>  
                    <td style={{ padding: "9px 12px", fontSize: 13, color: "#333", fontWeight: 600 }}>{getAmount(match, idx + 40)}</td>  
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
  );
}
