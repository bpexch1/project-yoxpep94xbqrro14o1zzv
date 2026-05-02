import { useNavigate } from "react-router-dom";

interface BettingMatchCardProps {
  match: any;
  onSelectBet: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
  mongoOdds?: any; // from MongoDB live odds engine
}

export function BettingMatchCard({ match, onSelectBet, mongoOdds }: BettingMatchCardProps) {
  const navigate = useNavigate();
  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const isLive = match.status === 'live';

  const isMongoSuspended = mongoOdds?.isSuspended === true;
  const back1 = mongoOdds?.teamA_back ?? match.back_odds ?? 1.9;
  const lay1  = mongoOdds?.teamA_lay  ?? match.lay_odds  ?? 2.0;
  const back2 = mongoOdds?.teamB_back ?? match.back_odds2 ?? match.back_odds ?? 1.9;
  const lay2  = mongoOdds?.teamB_lay  ?? match.lay_odds2  ?? match.lay_odds  ?? 2.0;
  
  // Random matched amount for UI authenticity
  const matchedAmount = Math.floor(Math.random() * 30000000 + 500000).toLocaleString('en-IN');
  
  // Time display: extract time portion from match_time and convert to PKT
  const mt = match.match_time != null ? String(match.match_time) : '';
  const timeDisplay = (() => {
    if (!mt) return "00:00";
    try {
      // If it looks like an ISO date/timestamp or numeric timestamp — parse and convert to PKT
      if (mt.includes('T') || mt.includes('Z') || /^\d{10,}$/.test(mt)) {
        const d = /^\d{10,}$/.test(mt) ? new Date(parseInt(mt)) : new Date(mt);
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Karachi'
        });
      }
      // Already a short time string — show as-is (stored in PKT already)
      return mt.length > 5 ? mt.substring(0, 5) : mt;
    } catch {
      return mt.length > 5 ? mt.substring(0, 5) : mt;
    }
  })();

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e0e8ef",
        display: "flex",
        alignItems: "stretch",
        minHeight: 52,
        cursor: "pointer",
      }}
      onClick={() => navigate(`/play/match/${match.id}`, { state: { match } })}
    >
      {/* Left: Status + time */}
      <div style={{
        width: 65,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 3px",
        gap: 3,
        borderRight: "1px solid #e0e8ef",
        flexShrink: 0,
        backgroundColor: "#fff",
      }}>
        {isLive ? (
          <span style={{
            backgroundColor: "#00b181",
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            borderRadius: 2,
            padding: "1px 3px",
            letterSpacing: 0.2,
            textTransform: "uppercase",
            textAlign: "center",
          }}>InPlay</span>
        ) : (
          <span style={{
            backgroundColor: "#3d6b8b",
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            borderRadius: 2,
            padding: "1px 3px",
            textTransform: "uppercase",
            textAlign: "center",
          }}>Today</span>
        )}
        <span style={{ fontSize: 10, color: "#444", fontWeight: 800 }}>{timeDisplay}</span>
      </div>

      {/* Center: match title + icons + amount */}
      <div style={{ flex: 1, padding: "5px 8px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1a2a3a", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {matchTitle}
        </span>
        {/* Icons: TV + BM + F badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "nowrap" }}>
          {/* TV icon - sprite or emoji fallback */}
          <span className="svg-DTV" style={{ flexShrink: 0 }} />
          {/* BM badge */}
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#00b181",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            borderRadius: 10,
            padding: "1px 5px",
            letterSpacing: 0.2,
          }}>@BM</span>
          {/* F badge */}
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#00b181",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            borderRadius: 10,
            padding: "1px 5px",
          }}>@F</span>
          {match.source === 'betfair' && (
            <span
              style={{
                backgroundColor: "#254465",
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                borderRadius: 2,
                padding: "1px 4px",
              }}
            >
              BF
            </span>
          )}
        </div>
        {/* Matched amount */}
        <span style={{ fontSize: 11, color: "#6c757d", fontWeight: 500 }}>{matchedAmount}</span>
      </div>

      {/* Right: Odds Buttons or Suspended */}
      <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
        {isMongoSuspended ? (
          <div style={{
            width: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f0e0e0",
            borderLeft: "1px solid #e0e8ef",
          }}>
            <span style={{ color: "#dc3545", fontWeight: 900, fontSize: 10 }}>SUSPENDED</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "stretch" }}>
            {/* Team 1 Odds */}
            <div 
              onClick={(e) => { e.stopPropagation(); onSelectBet(match, match.team1 || 'Team 1', 'back', back1); }}
              style={{
                width: 35,
                backgroundColor: "#a5d9fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderLeft: "1px solid #e0e8ef",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {back1}
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); onSelectBet(match, match.team1 || 'Team 1', 'lay', lay1); }}
              style={{
                width: 35,
                backgroundColor: "#f8d0ce",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderLeft: "1px solid #e0e8ef",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {lay1}
            </div>
            {/* Team 2 Odds */}
            <div 
              onClick={(e) => { e.stopPropagation(); onSelectBet(match, match.team2 || 'Team 2', 'back', back2); }}
              style={{
                width: 35,
                backgroundColor: "#a5d9fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderLeft: "1px solid #e0e8ef",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {back2}
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); onSelectBet(match, match.team2 || 'Team 2', 'lay', lay2); }}
              style={{
                width: 35,
                backgroundColor: "#f8d0ce",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderLeft: "1px solid #e0e8ef",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {lay2}
            </div>
          </div>
        )}
      </div>

      {/* Info button */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0, borderLeft: "1px solid #e0e8ef" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 22, height: 22,
          borderRadius: "50%",
          border: "1px solid #ccc",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          backgroundColor: "#fff",
        }}>
          <span style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>i</span>
        </div>
      </div>
    </div>
  );
}
