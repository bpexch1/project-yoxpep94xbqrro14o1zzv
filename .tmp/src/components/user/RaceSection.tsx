import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RaceSlot {
  time: string;
  venue: string;
}

interface RaceSectionProps {
  title: string;
  icon: React.ElementType;
  slots: RaceSlot[];
}

export function RaceSection({ title, icon: Icon, slots }: RaceSectionProps) {
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
      <div className="bg-[#e8f0f5] border-b border-[#ccd9e5] px-4 py-2 flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#1e3a5c]" />
        <span className="text-[#1e3a5c] font-bold text-[13px]">{title}</span>
      </div>

      {/* Time Slots Row */}
      <div className="bg-[#254465] flex items-center h-[52px]">
        <button 
          onClick={handlePrev}
          disabled={startIndex === 0}
          className="px-2 h-full flex items-center justify-center text-white/50 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 flex h-full overflow-hidden">
          {visibleSlots.map((slot, idx) => (
            <div 
              key={`${slot.venue}-${idx}`}
              className={cn(
                "flex-1 flex flex-col items-center justify-center border-r border-white/10 last:border-r-0 px-1",
              )}
            >
              <span className="text-white font-bold text-[12px] leading-tight truncate w-full text-center">
                {slot.time}
              </span>
              <span className="text-white/70 text-[10px] leading-tight truncate w-full text-center">
                {slot.venue}
              </span>
            </div>
          ))}
        </div>

        <button 
          onClick={handleNext}
          disabled={startIndex >= slots.length - visibleCount}
          className="px-2 h-full flex items-center justify-center text-white/50 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
