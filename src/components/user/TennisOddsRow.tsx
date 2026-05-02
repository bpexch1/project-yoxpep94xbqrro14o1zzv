interface TennisOddsRowProps {
  name: string;
  odds: number;
  layOdds: number;
  backSize?: string;
  laySize?: string;
  onBet: (type: 'back' | 'lay', odds: number) => void;
}

export function TennisOddsRow({ name, odds, layOdds, backSize, laySize, onBet }: TennisOddsRowProps) {
  const displayBackSize = backSize || `${(Math.random() * 3 + 0.5).toFixed(1)}M`;
  const displayLaySize = laySize || `${(Math.random() * 2 + 0.2).toFixed(1)}M`;
  
  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#edf4fc", borderBottom: "1px solid #c4d9ea", minHeight: 44 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "6px 12px" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#212529" }}>{name}</span>
      </div>
      <div
        onClick={() => onBet('back', odds)}
        style={{ width: 60, backgroundColor: "#a5d9fe", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 0, padding: "0 2px" }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: "#212529", lineHeight: 1.1 }}>{odds.toFixed(2)}</span>
        <span style={{ fontSize: 9, color: "#666", lineHeight: 1 }}>{displayBackSize}</span>
      </div>
      <div
        onClick={() => onBet('lay', layOdds)}
        style={{ width: 60, backgroundColor: "#f8d0ce", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 0, padding: "0 2px" }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: "#212529", lineHeight: 1.1 }}>{layOdds.toFixed(2)}</span>
        <span style={{ fontSize: 9, color: "#666", lineHeight: 1 }}>{displayLaySize}</span>
      </div>
    </div>
  );
}
