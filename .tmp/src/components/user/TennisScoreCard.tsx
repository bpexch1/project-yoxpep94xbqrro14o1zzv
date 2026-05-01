import { ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TennisScoreCardProps {
  scoreTab: "tv" | "scorecard";
  setScoreTab: (tab: "tv" | "scorecard") => void;
  match: any;
}

export function TennisScoreCard({ scoreTab, setScoreTab, match }: TennisScoreCardProps) {
  return (
    <div className="mt-0">
      <div className="flex border-b-2 border-white/10">
        <button 
          onClick={() => setScoreTab("tv")}
          className={cn(
            "flex-1 py-2 font-black text-[13px] transition-all",
            scoreTab === "tv" ? "bg-[#008c66] text-white shadow-inner" : "bg-[#00b181] text-white/80 hover:bg-[#00a377]"
          )}
        >
          Tv
        </button>
        <button 
          onClick={() => setScoreTab("scorecard")}
          className={cn(
            "flex-1 py-2 font-black text-[13px] transition-all border-l border-white/10",
            scoreTab === "scorecard" ? "bg-[#008c66] text-white shadow-inner" : "bg-[#00b181] text-white/80 hover:bg-[#00a377]"
          )}
        >
          Score Card
        </button>
      </div>

      {scoreTab === "scorecard" ? (
        <div className="bg-[#0d1117] p-0 flex flex-col relative overflow-hidden">
          {/* Card Header Area */}
          <div className="p-4 flex flex-col items-center">
            <div className="bg-[#5a3a22] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full mb-4 tracking-widest border border-white/10">
              Set 3 | Game 1
            </div>
            
            <div className="flex justify-between items-center w-full px-4 max-w-lg mb-6">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[28px] drop-shadow-md">🇺🇦</span>
                <span className="font-black text-sm text-white/90 uppercase text-center tracking-tight leading-none h-8 flex items-center">
                  {match.team1}
                </span>
              </div>
              
              <div className="px-6 flex flex-col items-center">
                <span className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">0 : 0</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[28px] drop-shadow-md">🇦🇹</span>
                <span className="font-black text-sm text-white/90 uppercase text-center tracking-tight leading-none h-8 flex items-center">
                  {match.team2}
                </span>
              </div>
            </div>

            <div className="flex justify-between w-full max-w-md px-2 text-[12px] font-bold text-white/40 mb-3">
              <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                Set 3 <ChevronDown size={14} />
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 size={14} className="text-white/60" />
                <span className="tracking-wide">Best of 3</span>
              </div>
            </div>

            {/* Score Grid Small (KOS/POT) */}
            <div className="w-full max-w-md flex flex-col gap-2 mb-6 px-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-white/60 w-8 uppercase">KOS</span>
                  <div className="flex gap-1">
                    {[6, 1, 0].map((v, i) => (
                      <div key={i} className="w-[22px] h-[22px] bg-black/40 rounded border border-white/10 flex items-center justify-center text-[12px] font-bold text-white">
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-[45px] h-[22px] bg-black/40 rounded border border-white/10 flex items-center justify-center text-[12px] font-bold text-white">
                  0:0
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-white/60 w-8 uppercase">POT</span>
                <div className="flex gap-1">
                  {[2, 6, 0].map((v, i) => (
                    <div key={i} className="w-[22px] h-[22px] bg-black/40 rounded border border-white/10 flex items-center justify-center text-[12px] font-bold text-white">
                      {v}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TENNIS COURT VISUALIZATION */}
          <div className="w-full aspect-[21/13] bg-[#c2703a] relative overflow-hidden border-y border-white/10">
            {/* Top Overlay Bar */}
            <div className="absolute top-0 left-0 right-0 bg-black/50 px-3 py-1.5 flex items-center gap-2 z-20">
               <div className="w-2 h-2 rounded-full bg-yellow-400" />
               <span className="text-white font-bold text-[12px]">Set 3 • Potapova, Anastasia 🇦🇹</span>
            </div>

            {/* Court Lines */}
            <div className="absolute inset-4 border-2 border-white/60">
              <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-white/60" />
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/80 -translate-y-1/2" />
              <div className="absolute top-[35%] bottom-[35%] left-0 right-0 border-y-[1.5px] border-white/60" />
            </div>

            {/* Center Stat Overlay Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-[1px] px-6 py-4 rounded-xl border border-white/10 flex flex-col items-center min-w-[140px]">
                <span className="text-white font-black text-3xl leading-none">24/46</span>
                <span className="text-white font-black text-xl mt-1 opacity-90">52%</span>
                <span className="text-white/40 font-black text-[10px] uppercase tracking-[0.2em] mt-2">Service Points Won</span>
              </div>
            </div>

            {/* Ball indicator */}
            <div className="absolute right-[30%] top-[45%] w-3.5 h-3.5 bg-yellow-300 rounded-full shadow-[0_0_10px_rgba(255,255,0,0.9)] z-20" />

            {/* Bottom Overlay Strip */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-1 z-20">
               <span className="text-white font-bold text-[13px]">🇺🇦 Kostyuk, Marta</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1a2e] p-12 text-center text-white/40 font-black uppercase tracking-widest border-y border-white/5">
          Live stream unavailable
        </div>
      )}
    </div>
  );
}
