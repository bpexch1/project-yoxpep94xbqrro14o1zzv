import React from "react";
import { useNavigate } from "react-router-dom";
import { Tv, Info } from "lucide-react";

interface BettingMatchCardProps {
  match: any;
  onSelectBet?: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
  onSelectOdds?: (match: any, selection: string, betType: 'back' | 'lay', odds: number) => void;
  setActiveBet?: (bet: { match: any; selection: string; betType: 'back' | 'lay'; odds: number } | null) => void;
  mongoOdds?: any;
}

export function BettingMatchCard({ match, onSelectBet, onSelectOdds, setActiveBet }: BettingMatchCardProps) {
  const navigate = useNavigate();

  if (!match || (!match.title && !match.team1 && !match.eventName)) {
    return null;
  }

  const matchTitle = match.title || `${match.team1} V ${match.team2}`;
  const isLive = match.status === 'live' || String(match.status || '').toLowerCase() === 'inplay';
  // Scheduled markets can open before kickoff. Only verified, fresh server prices are actionable.
  const isMarketOpen = match.marketPriceVerified === true
    && String(match.odds_status || "").toUpperCase() === "OPEN";
  const sport = String(match.sport || "").toLowerCase();
  const hasDraw = sport === "soccer" || sport === "football";
  const runnerNames = [match.team1 || match.title, hasDraw ? "The Draw" : "", match.team2];
  const selectOdds = (event: React.MouseEvent<HTMLButtonElement>, selection: string, side: "back" | "lay", odds: number) => {
    event.stopPropagation();
    if (!isMarketOpen || !selection || !Number.isFinite(odds) || odds <= 1) return;
    if (onSelectBet) onSelectBet(match, selection, side, odds);
    else if (onSelectOdds) onSelectOdds(match, selection, side, odds);
    else setActiveBet?.({ match, selection, betType: side, odds });
  };

  // Format matched volume number
  const matchedValue = Number(match.matched_amount);
  const matchedAmount = match.matched_amount != null && Number.isFinite(matchedValue)
    ? matchedValue.toLocaleString('en-US') : '—';
  
  // Time display
  const mt = match.match_time != null ? String(match.match_time) : '';
  const timeDisplay = (() => {
    if (!mt) return "—";
    try {
      if (mt.includes('T') || mt.includes('Z') || /^\d{10,}$/.test(mt)) {
        const d = /^\d{10,}$/.test(mt) ? new Date(parseInt(mt)) : new Date(mt);
        return d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
      return mt.length > 5 ? mt.substring(0, 5) : mt;
    } catch {
      return mt.length > 5 ? mt.substring(0, 5) : mt;
    }
  })();

  return (
    <div
      className={`reference-match-row ${isLive ? "is-live" : "is-upcoming"}`}
      style={{
        backgroundColor: "#e5f3fc",
        borderBottom: "1px solid #dce4ed",
        display: "flex",
        alignItems: "stretch",
        minHeight: 52,
        cursor: "pointer",
        transition: "background-color 0.15s",
      }}
      role="link"
      tabIndex={0}
      onKeyDown={event => { if (event.key === "Enter") navigate(`/play/match/${match.id}`, { state: { match } }); }}
      onClick={() => navigate(`/play/match/${match.id}`, { state: { match } })}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f6f9fc")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e5f3fc")}
    >
      {/* Left Column: InPlay + Time in Solid Green */}
      <div
        style={{
          width: 58,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isLive ? "#00b181" : "#e7edf4",
          color: isLive ? "#ffffff" : "#292f33",
          flexShrink: 0,
          padding: "4px 2px",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: "0.2px",
            lineHeight: 1.1,
          }}
        >
          {isLive ? "InPlay" : match.day_label || "Today"}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            marginTop: 2,
            lineHeight: 1.1,
          }}
        >
          {timeDisplay}
        </span>
      </div>

      {/* Middle Column: Match Name */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "6px 10px",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: "#182638",
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {matchTitle}
        </span>
      </div>

      {/* Right Column: TV Icon, Info Icon, Matched Volume */}
      <div
        className="reference-match-volume"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "4px 10px 4px 4px",
          flexShrink: 0,
          gap: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* TV icon */}
          <div style={{ color: "#182638", display: "flex", alignItems: "center" }}>
            <Tv size={15} strokeWidth={2.2} />
          </div>

          {/* Info icon */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/play/match/${match.id}`, { state: { match } });
            }}
            style={{
              color: "#182638",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Info size={15} strokeWidth={2.2} className="fill-[#182638] text-white" />
          </div>
        </div>

        {/* Matched Volume */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "#334155",
            letterSpacing: "0.2px",
          }}
        >
          {matchedAmount}
        </span>
      </div>
      <div className="reference-match-odds" aria-label="Available market prices">
        {runnerNames.map((selection, index) => (
          <div className="reference-odds-pair" key={index}>
            {(["back", "lay"] as const).map(side => {
              const raw = index === 0 && side === "back" ? match.odds : match[`${side}_${index + 1}`];
              const value = raw == null ? NaN : Number(raw);
              const enabled = isMarketOpen && !!selection && Number.isFinite(value) && value > 1;
              return <button
                type="button"
                key={side}
                className={`reference-price ${side}`}
                disabled={!enabled}
                aria-label={enabled ? `${side.toUpperCase()} ${selection} at ${value.toFixed(2)}` : `${side} price unavailable`}
                title={enabled ? `${side.toUpperCase()} ${selection}` : "Market unavailable"}
                onClick={event => selectOdds(event, selection, side, value)}
              >
                {enabled ? value.toFixed(2) : "–"}
              </button>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
