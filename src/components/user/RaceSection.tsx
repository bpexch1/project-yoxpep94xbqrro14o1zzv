import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface RaceSlot {
  time: string;
  venue: string;
}

interface RaceSectionProps {
  title: string;
  iconType: "horse" | "greyhound";
  slots: RaceSlot[];
}

export function RaceSection({ title, iconType, slots }: RaceSectionProps) {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 3;

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(Math.max(0, slots.length - visibleCount), prev + 1));
  };

  const visibleSlots = slots.slice(startIndex, startIndex + visibleCount);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", borderBottom: "1px solid #c7d6e5" }}>
      {/* Section Header */}
      <div style={{
        backgroundColor: "#e8eff5",
        borderBottom: "1px solid #ccd9e5",
        padding: "4px 10px",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{ fontSize: 16 }}>
          {iconType === "horse" ? "🐎" : "🐕"}
        </span>
        <span style={{ color: "#1e3a5f", fontWeight: 700, fontSize: 13 }}>{title}</span>
      </div>

      {/* Time Slots Row - Slate/Blue theme */}
      <div style={{
        backgroundColor: "#2e5680",
        display: "flex",
        alignItems: "stretch",
        height: 48,
      }}>
        <button
          onClick={handlePrev}
          disabled={startIndex === 0}
          style={{
            padding: "0 8px",
            background: "none",
            border: "none",
            cursor: startIndex === 0 ? "default" : "pointer",
            opacity: startIndex === 0 ? 0.3 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={16} color="white" />
        </button>
        <div style={{ flex: 1, display: "flex", height: "100%" }}>
          {visibleSlots.map((slot, idx) => (
            <div
              key={`${slot.venue}-${idx}`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRight: idx < visibleSlots.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
                cursor: "pointer",
                padding: "2px 4px",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <span style={{ fontWeight: 800, fontSize: 12, color: "white", lineHeight: 1.1 }}>{slot.time}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%" }}>
                {slot.venue}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={handleNext}
          disabled={startIndex >= Math.max(0, slots.length - visibleCount)}
          style={{
            padding: "0 8px",
            background: "none",
            border: "none",
            cursor: startIndex >= Math.max(0, slots.length - visibleCount) ? "default" : "pointer",
            opacity: startIndex >= Math.max(0, slots.length - visibleCount) ? 0.3 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight size={16} color="white" />
        </button>
      </div>
    </div>
  );
}
