import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface RaceSlot {
  time: string;
  venue: string;
}

interface RaceSectionProps {
  title: string;
  icon?: React.ElementType;
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
      <div className="bg-[#e6f2fc] border-b border-[#ccd9e5] px-4 py-2 flex items-center gap-3">
        {iconClass ? (
          <span className={iconClass} />
        ) : Icon ? (
          <Icon className="w-5 h-5 text-[#254465]" />
        ) : (
          <span style={{ fontSize: 18 }}>{emoji}</span>
        )}
        <span className="text-black font-bold text-[18px]">{title}</span>
      </div>

      {/* Time Slots Row */}
      <div 
        style={{ 
          backgroundColor: "#254465", 
          display: "flex", 
          alignItems: "center", 
          height: 64, 
          padding: "0 10px" 
        }}
      >
        <button 
          onClick={handlePrev} 
          disabled={startIndex === 0} 
          style={{ 
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.5)",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: startIndex === 0 ? 0.3 : 1,
            transition: "all 0.2s"
          }}
        >
          <ChevronLeft size={16} color="white" />
        </button>

        <div style={{ flex: 1, display: "flex", height: "100%" }}>
          {visibleSlots.map((slot, idx) => (
            <div 
              key={`${slot.venue}-${idx}`} 
              className="hover:bg-white/5 transition-colors"
              style={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                borderRight: idx < visibleSlots.length - 1 ? "1px solid rgba(255,255,255,0.2)" : "none", 
                cursor: "pointer" 
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, color: "white" }}>{slot.time}</span>
              <span style={{ fontSize: 12, color: "white", opacity: 0.8, marginTop: 2 }}>{slot.venue}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={handleNext} 
          disabled={startIndex >= slots.length - visibleCount} 
          style={{ 
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.5)",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: startIndex >= slots.length - visibleCount ? 0.3 : 1,
            transition: "all 0.2s"
          }}
        >
          <ChevronRight size={16} color="white" />
        </button>
      </div>
    </div>
  );
}
