import { useNavigate } from "react-router-dom";

interface BettingMatchCardProps {
  match: any;
  onSelectBet: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
}

export function BettingMatchCard({ match, onSelectBet }: BettingMatchCardProps) {
  const navigate = useNavigate();
  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const isLive = match.status === 'live';
  
  // Random matched amount for UI authenticity
  const matchedAmount = Math.floor(Math.random() * 30000000 + 500000).toLocaleString('en-IN');
  
  // Time display: extract time portion from match_time
  const mt = match.match_time != null ? String(match.match_time) : '';
  const timeDisplay = mt
    ? (mt.includes('T')
        ? new Date(mt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : (mt.length > 5 ? mt.substring(0, 5) : mt))
    : "19:00";

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

      {/* Right: info button */}
      <div style={{ display: "flex", alignItems: "center", paddingRight: 8, flexShrink: 0 }}
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
