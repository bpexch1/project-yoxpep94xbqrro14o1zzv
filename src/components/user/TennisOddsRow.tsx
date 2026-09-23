import React from "react";

interface TennisOddsRowProps {
  name: string;
  odds: number;
  layOdds: number;
  backSize?: string;
  laySize?: string;
  position?: number;
  onBet: (type: 'back' | 'lay', odds: number) => void;
}

export function TennisOddsRow({ name, odds, layOdds, backSize, laySize, position, onBet }: TennisOddsRowProps) {
  const hash = (name || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const displayBackSize = backSize || `${((hash % 20) / 10 + 0.5).toFixed(1)}M`;
  const displayLaySize = laySize || `${((hash % 15) / 10 + 0.2).toFixed(1)}M`;
  const hasPos = position !== undefined && position !== 0;

  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#edf4fc", borderBottom: "1px solid #c4d9ea", minHeight: 46 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "6px 12px" }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: "#1e293b", lineHeight: 1.2 }}>{name}</span>
        {hasPos && (
          <span 
            style={{ 
              fontWeight: 800, 
              fontSize: 12, 
              marginTop: 1.5,
              color: position > 0 ? "#00b181" : "#e53935",
              letterSpacing: "0.2px"
            }}
          >
            {position > 0 ? position.toLocaleString("en-IN") : position.toLocaleString("en-IN")}
          </span>
        )}
      </div>
      <div
        onClick={() => onBet('back', odds)}
        style={{ 
          width: 62, 
          backgroundColor: "#7ec8f8", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          cursor: "pointer", 
          gap: 0, 
          padding: "2px 0",
          borderLeft: "1px solid #c4d9ea",
          transition: "background-color 0.1s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#5bb5f5")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7ec8f8")}
      >
        <span style={{ fontWeight: 800, fontSize: 13.5, color: "#000", lineHeight: 1.1 }}>{odds.toFixed(2)}</span>
        <span style={{ fontSize: 9.5, color: "#333", fontWeight: 600, lineHeight: 1 }}>{displayBackSize}</span>
      </div>
      <div
        onClick={() => onBet('lay', layOdds)}
        style={{ 
          width: 62, 
          backgroundColor: "#fca5a5", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          cursor: "pointer", 
          gap: 0, 
          padding: "2px 0",
          borderLeft: "1px solid #c4d9ea",
          transition: "background-color 0.1s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f87171")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fca5a5")}
      >
        <span style={{ fontWeight: 800, fontSize: 13.5, color: "#000", lineHeight: 1.1 }}>{layOdds.toFixed(2)}</span>
        <span style={{ fontSize: 9.5, color: "#333", fontWeight: 600, lineHeight: 1 }}>{displayLaySize}</span>
      </div>
    </div>
  );
}
