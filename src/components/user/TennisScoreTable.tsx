interface TennisScoreTableProps {
  match: any;
}

export function TennisScoreTable({ match }: TennisScoreTableProps) {
  return (
    <div className="bg-[#1f2a38] text-white border-y border-white/5">
      <div className="flex flex-col">
        {/* Data Rows */}
        <div className="flex items-center border-b border-white/5 py-1.5 px-3">
          <div className="flex-1 font-bold text-[14px] truncate">{match.team1}</div>
          <div className="flex items-center text-center">
            <div className="w-[32px] font-black text-[17px]">6</div>
            <div className="w-[32px] font-black text-[17px]">1</div>
            <div className="w-[32px] font-black text-[17px] text-white/40">0</div>
            <div className="w-px h-4 bg-white/20 mx-2" />
            <div className="w-[50px] font-black text-[17px] text-[#00b181]">0</div>
            <div className="w-[65px] font-black text-[17px]">0</div>
          </div>
        </div>
        <div className="flex items-center py-1.5 px-3">
          <div className="flex-1 font-bold text-[14px] truncate">{match.team2}</div>
          <div className="flex items-center text-center">
            <div className="w-[32px] font-black text-[17px]">2</div>
            <div className="w-[32px] font-black text-[17px]">6</div>
            <div className="w-[32px] font-black text-[17px] text-white/40">0</div>
            <div className="w-px h-4 bg-white/20 mx-2" />
            <div className="w-[50px] font-black text-[17px] text-[#00b181]">0</div>
            <div className="w-[65px] font-black text-[17px]">0</div>
          </div>
        </div>
        {/* Headers Row */}
        <div className="flex items-center bg-black/30 py-1 px-3 text-[10px] font-black text-white/40 uppercase tracking-widest">
          <div className="flex-1"></div>
          <div className="flex items-center text-center">
            <div className="w-[32px]">1</div>
            <div className="w-[32px]">2</div>
            <div className="w-[32px]">3</div>
            <div className="w-px h-3 bg-white/10 mx-2" />
            <div className="w-[50px]">Points</div>
            <div className="w-[65px]">ServBreak</div>
          </div>
        </div>
        {/* Bottom indicator */}
        <div className="px-3 py-1.5 bg-black/10">
          <span className="text-[#00b181] font-bold text-[13px] uppercase">Set 3 | 0:0</span>
        </div>
      </div>
    </div>
  );
}
