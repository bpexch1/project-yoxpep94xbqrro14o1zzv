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

function RaceIcon({ type }: { type: "horse" | "greyhound" }) {
  if (type === "horse") return (
    <svg width="22" height="18" viewBox="0 0 36 28" fill="#254465" xmlns="http://www.w3.org/2000/svg">
      {/* Jockey on horse silhouette */}
      <ellipse cx="22" cy="16" rx="12" ry="6" />
      <ellipse cx="10" cy="14" rx="5" ry="4" />
      <circle cx="8" cy="9" r="3" />
      <rect x="18" y="18" width="3" height="7" rx="1" />
      <rect x="24" y="18" width="3" height="7" rx="1" />
      <rect x="8" y="17" width="2" height="6" rx="1" />
      <rect x="13" y="17" width="2" height="6" rx="1" />
      <path d="M30 12 Q34 10 35 8" stroke="#254465" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M6 13 Q3 15 2 18" stroke="#254465" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
  // Greyhound
  return (
    <svg width="22" height="18" viewBox="0 0 36 24" fill="#254465" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="14" rx="13" ry="5" />
      <circle cx="6" cy="11" r="4" />
      <path d="M30 10 Q34 8 35 6" stroke="#254465" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="10" y="18" width="2" height="5" rx="1" />
      <rect x="16" y="19" width="2" height="4" rx="1" />
      <rect x="22" y="18" width="2" height="5" rx="1" />
      <rect x="28" y="18" width="2" height="5" rx="1" />
      <path d="M4 14 Q2 17 2 20" stroke="#254465" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M8 7 Q7 4 9 3" stroke="#254465" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function RaceSection({ title, iconType, slots }: RaceSectionProps) {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 3;

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(slots.length - visibleCount, prev + 1));
  };

  const visibleSlots = slots.slice(startIndex, startIndex + visibleCount);

  return (
    <div className="flex flex-col w-full">
      {/* Section Header */}
      <div className="bg-[#e6f2fc] border-b border-[#ccd9e5] px-3 py-2 flex items-center gap-2">
        <RaceIcon type={iconType} />
        <span className="text-[#254465] font-bold text-[13px]">{title}</span>
      </div>

      {/* Time Slots Row - WHITE background */}
      <div style={{ backgroundColor: "#fff", display: "flex", alignItems: "center", height: 52, borderBottom: "1px solid #dde4ea" }}>
        <button
          onClick={handlePrev}
          disabled={startIndex === 0}
          style={{ padding: "0 10px", background: "none", border: "none", cursor: "pointer", opacity: startIndex === 0 ? 0.3 : 1 }}
        >
          <ChevronLeft size={18} color="#254465" />
        </button>
        <div style={{ flex: 1, display: "flex", height: "100%" }}>
          {visibleSlots.map((slot, idx) => (
            <div
              key={`${slot.venue}-${idx}`}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: idx < visibleSlots.length - 1 ? "1px solid #dde4ea" : "none", cursor: "pointer" }}
            >
              <span style={{ fontWeight: 700, fontSize: 12, color: "#254465" }}>{slot.time}</span>
              <span style={{ fontSize: 10, color: "#6c757d", marginTop: 2 }}>{slot.venue}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleNext}
          disabled={startIndex >= slots.length - visibleCount}
          style={{ padding: "0 10px", background: "none", border: "none", cursor: "pointer", opacity: startIndex >= slots.length - visibleCount ? 0.3 : 1 }}
        >
          <ChevronRight size={18} color="#254465" />
        </button>
      </div>
    </div>
  );
}
