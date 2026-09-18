
import { useNavigate } from "react-router-dom";
import { DBMBadge, DFBadge, DTVIcon } from "@/components/icons/CustomIcons";

interface BettingMatchCardProps {
  match: any;
  onSelectBet?: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
  onSelectOdds?: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
  setActiveBet?: (bet: { match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null) => void;
  mongoOdds?: any;
}

export function BettingMatchCard({ match, mongoOdds }: BettingMatchCardProps) {
  const navigate = useNavigate();

  if (!match || (!match.title && !match.team1 && !match.eventName)) {
    return null;
  }

  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  const isLive = match.status === 'live' || String(match.status || '').toLowerCase() === 'inplay';

  const isMongoSuspended = mongoOdds?.isSuspended === true;
  
  // Format matched volume number
  const matchedAmount = match.matched_amount 
    ? Number(match.matched_amount).toLocaleString('en-IN') 
    : (match.id ? (Number(String(match.id).replace(/\D/g, '').substring(0, 8)) || 192902882).toLocaleString('en-IN') : '0');
  
  // Time display
  const mt = match.match_time != null ? String(match.match_time) : '';
  const timeDisplay = (() => {
    if (!mt) return "18:15";
    try {
      if (mt.includes('T') || mt.includes('Z') || /^\d{10,}$/.test(mt)) {
        const d = /^\d{10,}$/.test(mt) ? new Date(parseInt(mt)) : new Date(mt);
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Karachi'
        });
      }
      return mt.length > 5 ? mt.substring(0, 5) : mt;
    } catch {
      return mt.length > 5 ? mt.substring(0, 5) : mt;
    }
  })();

  const isCricket = (match.sport || '').toLowerCase() === 'cricket' || (match.title || '').toLowerCase().includes('cricket');

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #dbe3ec",
        display: "flex",
        alignItems: "stretch",
        minHeight: 52,
        cursor: "pointer",
        transition: "background-color 0.15s",
      }}
      onClick={() => navigate(`/play/match/${match.id}`, { state: { match } })}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafd")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
    >
      {/* Left: Status + time */}
      <div style={{
        width: 62,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 2px",
        flexShrink: 0,
        backgroundColor: isLive ? "#00b894" : "#e2e8f0",
        borderRight: "1px solid #cbd5e1"
      }}>
        <span style={{
          color: isLive ? "#fff" : "#475569",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          textAlign: "center",
        }}>
          {isLive ? 'InPlay' : 'Today'}
        </span>
        <span style={{
          fontSize: 11,
          color: isLive ? "#fff" : "#1e293b",
          fontWeight: 700,
          marginTop: 1
        }}>
          {timeDisplay}
        </span>
      </div>

      {/* Center: match title + badges + amount */}
      <div style={{ flex: 1, padding: "6px 10px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, minWidth: 0 }}>
        {/* Row 1: title + icons */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", lineHeight: 1.25 }}>
            {matchTitle}
            {isMongoSuspended && (
              <span style={{ marginLeft: 6, color: "#dc3545", fontWeight: 900, fontSize: 10, backgroundColor: '#f0e0e0', padding: '1px 4px', borderRadius: 2 }}>SUSPENDED</span>
            )}
          </span>
          
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, paddingTop: 1 }}>
            <DTVIcon className="w-3.5 h-3.5 text-[#00b894]" color="#00b894" />
            <DBMBadge />
            <DFBadge />
          </div>
        </div>

        {/* Row 2: matched amount */}
        <span style={{ fontSize: 11, color: "#334155", fontWeight: 700 }}>
          {matchedAmount}
        </span>
      </div>

      {/* Right: Info circle */}
      <div
        style={{ display: "flex", alignItems: "center", padding: "0 10px", flexShrink: 0 }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/play/match/${match.id}`, { state: { match } });
        }}
      >
        <div style={{
          width: 20, height: 20,
          borderRadius: "50%",
          backgroundColor: "#1e3a5f",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 800, fontStyle: "italic", fontFamily: "serif" }}>i</span>
        </div>
      </div>
    </div>
  );
}
