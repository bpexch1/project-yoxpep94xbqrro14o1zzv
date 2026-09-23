import React from "react";

interface MatchedAndOpenBetsProps {
  openBets?: any[];
  matchedBets?: any[];
}

export function MatchedAndOpenBets({ openBets = [], matchedBets = [] }: MatchedAndOpenBetsProps) {
  // In exchange workflows, placed bets are matched
  const effectiveMatched = matchedBets.length > 0 ? matchedBets : openBets;
  const effectiveOpen = matchedBets.length > 0 ? openBets : [];

  return (
    <div 
      style={{
        marginTop: 14,
        marginBottom: 14,
        fontFamily: '"Roboto Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      {/* 1. OPEN BETS */}
      <div style={{ marginBottom: 12 }}>
        {/* Navy Header Bar */}
        <div
          style={{
            backgroundColor: "#19365a",
            color: "white",
            padding: "5px 10px",
            fontSize: 12.5,
            fontWeight: 800,
            letterSpacing: "0.2px",
          }}
        >
          Open Bets ({effectiveOpen.length})
        </div>

        {/* Column Sub-Header */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#dbe3ec",
            color: "#334155",
            fontSize: 11,
            fontWeight: 800,
            padding: "4px 10px",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <div style={{ flex: 1, textAlign: "left" }}>Runner</div>
          <div style={{ width: 80, textAlign: "center" }}>Price</div>
          <div style={{ width: 90, textAlign: "right" }}>Size</div>
        </div>

        {/* Rows (if any) */}
        {effectiveOpen.length > 0 ? (
          effectiveOpen.map((b, idx) => {
            const stake = Number(b.stake) || 0;
            const odds = Number(b.odds) || 0;
            return (
              <div
                key={b.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f6f9fc",
                  padding: "6px 10px",
                  fontSize: 12,
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div style={{ flex: 1, textAlign: "left", fontWeight: 700, color: "#1e293b" }}>
                  {b.selection || b.runner_name || b.runner || b.match_title}
                </div>
                <div style={{ width: 80, textAlign: "center", fontWeight: 800, color: "#0f172a" }}>
                  {Number(odds).toFixed(2)}
                </div>
                <div style={{ width: 90, textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                  {stake.toLocaleString("en-IN")}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ backgroundColor: "#fff", height: 2, borderBottom: "1px solid #e2e8f0" }} />
        )}
      </div>

      {/* 2. MATCHED BETS */}
      <div>
        {/* Navy Header Bar */}
        <div
          style={{
            backgroundColor: "#19365a",
            color: "white",
            padding: "5px 10px",
            fontSize: 12.5,
            fontWeight: 800,
            letterSpacing: "0.2px",
          }}
        >
          Matched Bets ({effectiveMatched.length})
        </div>

        {/* Column Sub-Header */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#dbe3ec",
            color: "#334155",
            fontSize: 11,
            fontWeight: 800,
            padding: "4px 10px",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <div style={{ flex: 1, textAlign: "left" }}>Runner</div>
          <div style={{ width: 80, textAlign: "center" }}>Price</div>
          <div style={{ width: 90, textAlign: "right" }}>Size</div>
        </div>

        {/* Rows */}
        {effectiveMatched.length > 0 ? (
          effectiveMatched.map((b, idx) => {
            const stake = Number(b.stake) || 0;
            const odds = Number(b.odds) || 0;
            const runnerTitle = b.selection || b.runner_name || b.runner || b.match_title || "Runner";

            return (
              <div
                key={b.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f6f9fc",
                  padding: "6px 10px",
                  fontSize: 12,
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div style={{ flex: 1, textAlign: "left", fontWeight: 700, color: "#1e293b" }}>
                  {runnerTitle}
                </div>
                <div style={{ width: 80, textAlign: "center", fontWeight: 800, color: "#0f172a" }}>
                  {Number(odds).toFixed(2)}
                </div>
                <div style={{ width: 90, textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                  {stake.toLocaleString("en-IN")}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ backgroundColor: "#fff", height: 2, borderBottom: "1px solid #e2e8f0" }} />
        )}
      </div>
    </div>
  );
}
