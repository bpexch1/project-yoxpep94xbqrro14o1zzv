import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { HorseRaceIcon, GreyhoundIcon } from "@/components/icons/ReferenceSportsIcons";

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
  slots,
  onSelectRace,
}: {
  title?: string;
  iconType?: "horse" | "greyhound";
  slots?: RaceSlot[];
  onSelectRace?: (race: RaceSlot) => void;
}) {
  // Race times are example fixtures in DEV only. Never display invented races as live production.
  const safeSlots = Array.isArray(slots)
    ? slots
    : import.meta.env.DEV
      ? (iconType === "horse" ? DEFAULT_HORSE_SLOTS : DEFAULT_GREYHOUND_SLOTS)
      : [];
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
    <div className={`reference-race-section reference-race-${iconType}`} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Section Header */}
      <div
        style={{
          backgroundColor: "#e5f3fc",
          borderBottom: "1px solid #d4deea",
          padding: "7px 0",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {iconType === "horse" ? <HorseRaceIcon className="w-6 h-6" color="#343a40" /> : <GreyhoundIcon className="w-6 h-6" color="#343a40" />}
        <span style={{ color: "#292f33", fontWeight: 700, fontSize: 18 }}>{title}</span>
      </div>

      {/* Time Slots Row */}
      <div
        style={{
          backgroundColor: "#406e88",
          display: "flex",
          alignItems: "center",
          minHeight: 62,
          borderBottom: "1px solid #1f3f61",
        }}
      >
        {/* Left Arrow Button */}
        <button
          aria-label={`Previous ${title} fixtures`}
          onClick={handlePrev}
          disabled={startIndex === 0}
          style={{
            width: 20,
            height: 20,
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
          {visibleSlots.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-3 text-center text-xs sm:text-sm font-semibold text-white/85"
              role="status">Race schedule unavailable — awaiting verified feed</div>
          ) : visibleSlots.map((slot, idx) => (
            <button
              type="button"
              key={`${slot.venue}-${idx}`}
              onClick={() => onSelectRace?.(slot)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRight: idx < visibleSlots.length - 1 ? "1px solid rgba(255,255,255,0.65)" : "none",
                cursor: "pointer",
                padding: "8px 3px",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <span style={{ fontWeight: 700, fontSize: 16, color: "#ffffff", lineHeight: 1.1 }}>
                {slot.time}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: "rgba(255,255,255,0.9)",
                  marginTop: 2,
                  whiteSpace: "normal",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "92%",
                  textAlign: "center",
                }}
              >
                {slot.venue}
              </span>
            </button>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          aria-label={`Next ${title} fixtures`}
          onClick={handleNext}
          disabled={startIndex >= Math.max(0, safeSlots.length - visibleCount)}
          style={{
            width: 20,
            height: 20,
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
        slots={import.meta.env.DEV ? DEFAULT_HORSE_SLOTS : []}
        onSelectRace={onSelectRace}
      />
      <SingleRaceRow
        title="Grey Hound"
        iconType="greyhound"
        slots={import.meta.env.DEV ? DEFAULT_GREYHOUND_SLOTS : []}
        onSelectRace={onSelectRace}
      />
    </div>
  );
}
