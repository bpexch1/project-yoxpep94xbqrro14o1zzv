import { Tv } from "lucide-react";
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
  const matchedAmount = Math.floor(Math.random() * 30000000 + 500000).toLocaleString();
  
  // Time display: extract time portion from match_time
  const timeDisplay = match.match_time 
    ? (match.match_time.includes('T') 
        ? new Date(match.match_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : (match.match_time.length > 5 ? match.match_time.substring(0, 5) : match.match_time))
    : "19:00";

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e0e8ef",
        display: "flex",
        alignItems: "stretch",
        minHeight: 64,
        cursor: "pointer",
      }}
      onClick={() => navigate(`/play/match/${match.id}`)}
    >
      {/* Left: InPlay badge + time */}
      <div
        style={{
          width: 62,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 6px",
          gap: 3,
          borderRight: "1px solid #e0e8ef",
          flexShrink: 0,
        }}
      >
        {isLive ? (
          <span
            style={{
              backgroundColor: "#00a65a",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 3,
              padding: "2px 5px",
              letterSpacing: 0.3,
            }}
          >
            InPlay
          </span>
        ) : (
          <span
            style={{
              backgroundColor: "#3d6b8b",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 3,
              padding: "2px 5px",
            }}
          >
            Today
          </span>
        )}
        <span style={{ fontSize: 11, color: "#1e3a5c", fontWeight: 700 }}>
          {timeDisplay}
        </span>
      </div>

      {/* Center: match info */}
      <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5c", lineHeight: 1.3 }}>
          {matchTitle}
        </span>
        {/* Icons row: TV + BM + F */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
          <Tv size={13} color="#555" />
          <span
            style={{
              backgroundColor: "#3dccc8",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              borderRadius: 10,
              padding: "1px 6px",
            }}
          >
            BM
          </span>
          <span
            style={{
              backgroundColor: "#3dccc8",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              borderRadius: 10,
              padding: "1px 6px",
            }}
          >
            F
          </span>
          {match.source === 'betfair' && (
            <span
              style={{
                backgroundColor: "#1e3a5c",
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
        <span style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
          {matchedAmount}
        </span>
      </div>

      {/* Right: ℹ button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingRight: 10,
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "1px solid #aaa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#666",
            cursor: "pointer",
          }}
        >
          i
        </div>
      </div>
    </div>
  );
}
