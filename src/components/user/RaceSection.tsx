import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export interface RaceSlot {
  time: string;
  venue: string;
}

export interface RaceSectionProps {
  title?: string;
  iconType?: "horse" | "greyhound";
  slots?: RaceSlot[];
  onSelectRace?: (race: RaceSlot) => void;
}

const DEFAULT_HORSE_SLOTS: RaceSlot[] = [
  { time: "10:04 PM", venue: "Laurel Park (US)" },
  { time: "10:06 PM", venue: "Delaware Park (US)" },
  { time: "10:15 PM", venue: "Belmont Park (US)" },
  { time: "10:35 PM", venue: "Churchill Downs (US)" },
  { time: "10:50 PM", venue: "Saratoga (US)" },
];

const DEFAULT_GREYHOUND_SLOTS: RaceSlot[] = [
  { time: "10:20 PM", venue: "Dunstall Park (GB)" },
  { time: "10:21 PM", venue: "Star Pelaw (GB)" },
  { time: "10:26 PM", venue: "Hove (GB)" },
  { time: "10:38 PM", venue: "Monmore (GB)" },
  { time: "10:44 PM", venue: "Romford (GB)" },
];

export function SingleRaceRow({
  title = "Horse Race",
  iconType = "horse",
  slots = DEFAULT_HORSE_SLOTS,
  onSelectRace,
}: {
  title?: string;
  iconType?: "horse" | "greyhound";
  slots?: RaceSlot[];
  onSelectRace?: (race: RaceSlot) => void;
}) {
  const safeSlots = Array.isArray(slots) && slots.length > 0 ? slots : (iconType === "horse" ? DEFAULT_HORSE_SLOTS : DEFAULT_GREYHOUND_SLOTS);
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 3;

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(Math.max(0, safeSlots.length - visibleCount), prev + 1));
  };

  const visibleSlots = safeSlots.slice(startIndex, startIndex + visibleCount);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Section Header */}
      <div
        style={{
          backgroundColor: "#eaeff5",
          borderBottom: "1px solid #d4deea",
          padding: "5px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 16 }}>{iconType === "horse" ? "🐎" : "🐕"}</span>
        <span style={{ color: "#142c4c", fontWeight: 800, fontSize: 13 }}>{title}</span>
      </div>

      {/* Time Slots Row */}
      <div
        style={{
          backgroundColor: "#2e5781",
          display: "flex",
          alignItems: "center",
          height: 48,
          borderBottom: "1px solid #1f3f61",
        }}
      >
        {/* Left Arrow Button */}
        <button
          onClick={handlePrev}
          disabled={startIndex === 0}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: startIndex === 0 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)",
            border: "none",
            cursor: startIndex === 0 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 6,
            flexShrink: 0,
            opacity: startIndex === 0 ? 0.35 : 1,
            transition: "background-color 0.15s",
          }}
        >
          <ChevronLeft size={16} color="white" />
        </button>

        {/* 3 Slots */}
        <div style={{ flex: 1, display: "flex", height: "100%", alignItems: "stretch" }}>
          {visibleSlots.map((slot, idx) => (
            <div
              key={`${slot.venue}-${idx}`}
              onClick={() => onSelectRace?.(slot)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRight: idx < visibleSlots.length - 1 ? "1px solid rgba(255,255,255,0.2)" : "none",
                cursor: "pointer",
                padding: "2px 2px",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <span style={{ fontWeight: 800, fontSize: 12, color: "#ffffff", lineHeight: 1.1 }}>
                {slot.time}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.9)",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "92%",
                  textAlign: "center",
                }}
              >
                {slot.venue}
              </span>
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={handleNext}
          disabled={startIndex >= Math.max(0, safeSlots.length - visibleCount)}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: startIndex >= Math.max(0, safeSlots.length - visibleCount) ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)",
            border: "none",
            cursor: startIndex >= Math.max(0, safeSlots.length - visibleCount) ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 6,
            flexShrink: 0,
            opacity: startIndex >= Math.max(0, safeSlots.length - visibleCount) ? 0.35 : 1,
            transition: "background-color 0.15s",
          }}
        >
          <ChevronRight size={16} color="white" />
        </button>
      </div>
    </div>
  );
}

export function RaceSection({
  title,
  iconType,
  slots,
  onSelectRace,
}: RaceSectionProps) {
  if (title) {
    return (
      <SingleRaceRow
        title={title}
        iconType={iconType || "horse"}
        slots={slots}
        onSelectRace={onSelectRace}
      />
    );
  }

  return (
    <div className="w-full">
      <SingleRaceRow
        title="Horse Race"
        iconType="horse"
        slots={DEFAULT_HORSE_SLOTS}
        onSelectRace={onSelectRace}
      />
      <SingleRaceRow
        title="Grey Hound"
        iconType="greyhound"
        slots={DEFAULT_GREYHOUND_SLOTS}
        onSelectRace={onSelectRace}
      />
    </div>
  );
}
