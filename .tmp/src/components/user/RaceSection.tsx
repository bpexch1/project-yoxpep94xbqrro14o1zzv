import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface RaceSlot {
  time: string;
  venue: string;
}

interface RaceSectionProps {
  title: string;
  icon: React.ElementType;
  emoji?: string;
  iconClass?: string;
  slots: RaceSlot[];
}

export function RaceSection({ title, icon: Icon, emoji, iconClass, slots }: RaceSectionProps) {
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
      <div className="bg-[#e6f2fc] border-b border-[#ccd9e5] px-4 py-2 flex items-center gap-2">
        {iconClass ? (
          <span className={iconClass} />
        ) : emoji ? (
          <span style={{ fontSize: 18 }}>{emoji}</span>
        ) : (
          <Icon className="w-5 h-5 text-[#254465]" />
        )}
        <span className="text-[#254465] font-bold text-[13px]">{title}</span>
      </div>

      {/* Time Slots Row */}
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
