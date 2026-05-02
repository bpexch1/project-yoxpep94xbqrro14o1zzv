import { useNavigate } from "react-router-dom";

interface BettingMatchCardProps {
  match: any;
  onSelectBet?: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
  mongoOdds?: any; // from MongoDB live odds engine
}

export function BettingMatchCard({ match, mongoOdds }: BettingMatchCardProps) {
  const navigate = useNavigate();
  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const isLive = match.status === 'live';

  const isMongoSuspended = mongoOdds?.isSuspended === true;
  
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
        padding: "4px 2px",
        gap: 1,
        flexShrink: 0,
        backgroundColor: isLive ? "#00b181" : "#3d6b8b",
      }}>
        <span style={{
          color: "#fff",
          fontSize: 9,
          fontWeight: 800,
          borderRadius: 2,
          padding: "1px 3px",
          letterSpacing: 0.3,
          textTransform: "uppercase",
          textAlign: "center",
        }}>
          {isLive ? 'InPlay' : 'Today'}
        </span>
        <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{timeDisplay}</span>
      </div>

      {/* Center: match title + icons + amount */}
      <div style={{ flex: 1, padding: "5px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, minWidth: 0 }}>
        {isMongoSuspended ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
             <span style={{ fontWeight: 700, fontSize: 13, color: "#1a2a3a", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {matchTitle}
            </span>
            <span style={{ color: "#dc3545", fontWeight: 900, fontSize: 10, backgroundColor: '#f0e0e0', padding: '1px 4px', borderRadius: 2 }}>SUSPENDED</span>
          </div>
        ) : (
          <>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1a2a3a", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {matchTitle}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
              <span className="svg-DTV" style={{ flexShrink: 0 }} />
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
              }}>@BM</span>
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
            </div>
            <span style={{ fontSize: 11, color: "#6c757d", fontWeight: 500 }}>{matchedAmount}</span>
          </>
        )}
      </div>

      {/* Right: Info button */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 10px", flexShrink: 0, borderLeft: "1px solid #e0e8ef" }}
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
