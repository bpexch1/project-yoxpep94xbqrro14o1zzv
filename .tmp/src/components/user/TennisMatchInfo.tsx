import { Clock } from "lucide-react";

interface TennisMatchInfoProps {
  match: any;
  keepDisplayOn: boolean;
  setKeepDisplayOn: (val: boolean) => void;
}

export function TennisMatchInfo({ match, keepDisplayOn, setKeepDisplayOn }: TennisMatchInfoProps) {
  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  
  const formatPKT = (timeStr: string | null | undefined): string => {
    if (!timeStr) return 'Live Now';
    const s = String(timeStr);
    try {
      if (s.includes('T') || s.includes('Z') || /^\d{10,}$/.test(s)) {
        const d = /^\d{10,}$/.test(s) ? new Date(parseInt(s)) : new Date(s);
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Karachi'
        });
      }
      return s.length > 5 ? s.substring(0, 5) : s;
    } catch { return s; }
  };

  return (
    <div className="bg-[#254465] p-3.5 text-white">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 ml-1">
              <Clock size={14} className="text-white/60" />
              <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">
                Starts at: {formatPKT(match.match_time)} | Winners: 1
              </span>
            </div>
          </div>
          <h1 className="font-black text-[22px] leading-none mt-2 tracking-tight">
            {matchTitle}
          </h1>
        </div>
        <span className="text-[#00b181] font-black text-sm uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
          {match.status === 'live' ? 'INPLAY' : match.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED'}
        </span>
      </div>
      
      <div className="mt-2 space-y-1">
        <div className="font-black text-[14px] text-white/90 uppercase tracking-tight">Elapsed : 01:07:56</div>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="keep-display"
            checked={keepDisplayOn} 
            onChange={(e) => setKeepDisplayOn(e.target.checked)} 
            className="w-4 h-4 accent-[#00b181] cursor-pointer border-white/20" 
          />
          <label htmlFor="keep-display" className="text-[13px] font-bold cursor-pointer text-white/90">Keep Display On</label>
        </div>
      </div>
    </div>
  );
}
