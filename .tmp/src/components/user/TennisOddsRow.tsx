interface TennisOddsRowProps {
  name: string;
  odds: number;
  layOdds: number;
  onBet: (type: 'back' | 'lay', odds: number) => void;
}

export function TennisOddsRow({ name, odds, layOdds, onBet }: TennisOddsRowProps) {
  const backSize = `${(Math.random() * 400 + 100).toFixed(1)}K`;
  const laySize = `${(Math.random() * 600 + 200).toFixed(1)}K`;
  
  return (
    <div className="flex items-stretch bg-[#dce8f3] border-b border-[#c4d9ea] min-h-[70px] hover:bg-[#d4e2ee] transition-colors">
      <div className="flex-1 flex items-center px-4 py-3">
        <span className="font-black text-[17px] text-[#1e293b] tracking-tight">{name}</span>
      </div>
      <div 
        onClick={() => onBet('back', odds)} 
        className="w-[60px] bg-[#72bbef] hover:bg-[#62aadd] flex flex-col items-center justify-center cursor-pointer transition-colors active:scale-95"
      >
        <span className="font-black text-[22px] text-[#1e293b] leading-none">{odds.toFixed(2)}</span>
        <span className="text-[10px] font-black text-[#1e293b]/60 mt-1 tracking-tighter">{backSize}</span>
      </div>
      <div 
        onClick={() => onBet('lay', layOdds)} 
        className="w-[60px] bg-[#faa9ba] hover:bg-[#f898ab] flex flex-col items-center justify-center cursor-pointer transition-colors active:scale-95"
      >
        <span className="font-black text-[22px] text-[#1e293b] leading-none">{layOdds.toFixed(2)}</span>
        <span className="text-[10px] font-black text-[#1e293b]/60 mt-1 tracking-tighter">{laySize}</span>
      </div>
    </div>
  );
}
