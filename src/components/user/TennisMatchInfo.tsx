import { ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TennisMatchInfoProps {
  match: any;
  keepDisplayOn: boolean;
  setKeepDisplayOn: (val: boolean) => void;
}

export function TennisMatchInfo({ match, keepDisplayOn, setKeepDisplayOn }: TennisMatchInfoProps) {
  const navigate = useNavigate();
  const matchTitle = match.title || `${match.team1} v ${match.team2}`;
  
  return (
    <div className="bg-[#254465] p-3.5 text-white">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/play')} className="hover:opacity-80 transition-opacity">
              <ArrowLeft size={22} />
            </button>
            <div className="flex items-center gap-1.5 ml-1">
              <Clock size={14} className="text-white/60" />
              <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">
                an hour ago | {match.match_time || 'Live Now'} | Winners: 1
              </span>
            </div>
          </div>
          <h1 className="font-black text-[22px] leading-none mt-2 tracking-tight">
            {matchTitle}
          </h1>
        </div>
        <span className="text-[#00b181] font-black text-sm uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
          INPLAY
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
