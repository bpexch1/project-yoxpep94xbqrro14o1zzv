
import { useNavigate } from "react-router-dom";

interface BettingMatchCardProps {
  match: any;
  onSelectBet?: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
  mongoOdds?: any; // from MongoDB live odds engine
}

const TvIcon = () => (
  <svg width="14" height="13" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'#666'}}>
    <rect x="1" y="4" width="14" height="9" rx="1"/>
    <path d="M5 4L8 1l3 3"/>
  </svg>
);

export function BettingMatchCard({ match, mongoOdds }: BettingMatchCardProps) {
  const navigate = useNavigate();
  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const isLive = match.status === 'live';

  const isMongoSuspended = mongoOdds?.isSuspended === true;
  
  // Matched amount for UI - use real data if available, otherwise show 0
  const matchedAmount = match.matched_amount ? Number(match.matched_amount).toLocaleString('en-IN') : '0';
  
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
        minHeight: 56,
        cursor: "pointer",
      }}
      onClick={() => navigate(`/play/match/${match.id}`, { state: { match } })}
    >
      {/* Left: Status + time */}
      <div style={{
        width: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 2px",
        flexShrink: 0,
        backgroundColor: isLive ? "#00b181" : "#3d6b8b",
      }}>
        <span style={{
          color: "#fff",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          textAlign: "center",
        }}>
          {isLive ? 'InPlay' : 'Today'}
        </span>
        <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{timeDisplay}</span>
      </div>

      {/* Center: match title + badges + amount */}
      <div style={{ flex: 1, padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, minWidth: 0 }}>
        {/* Row 1: title (wrapping) + TV/badges top-right */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          {/* Title — wraps naturally */}
          <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: "#1a2a3a", lineHeight: 1.3 }}>
            {matchTitle}
            {isMongoSuspended && (
              <span style={{ marginLeft: 6, color: "#dc3545", fontWeight: 900, fontSize: 10, backgroundColor: '#f0e0e0', padding: '1px 4px', borderRadius: 2 }}>SUSPENDED</span>
            )}
          </span>
          {/* TV + badges (right side, aligned to top) */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0, paddingTop: 1 }}>
            <TvIcon />
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              backgroundColor: "#00b181", 
              color: "#fff", 
              fontSize: 8, 
              fontWeight: 700, 
              borderRadius: 10, 
              padding: "1px 4px" 
            }}>@BM</span>
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              backgroundColor: "#00b181", 
              color: "#fff", 
              fontSize: 8, 
              fontWeight: 700, 
              borderRadius: 10, 
              padding: "1px 4px" 
            }}>@F</span>
          </div>
        </div>
        {/* Row 2: matched amount */}
        <span style={{ fontSize: 11, color: "#6c757d", fontWeight: 500 }}>{matchedAmount}</span>
      </div>

      {/* Right: Info button */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 22, height: 22,
          borderRadius: "50%",
          border: "1.5px solid #bbb",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          backgroundColor: "#fff",
        }}>
          <span style={{ fontSize: 11, color: "#888", fontWeight: 700, fontStyle: "italic" }}>i</span>
        </div>
      </div>
    </div>
  );
}
