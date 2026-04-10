import { Trophy, Clock, Zap, Star } from "lucide-react";

const matches = [
  {
    sport: "Cricket",
    tournament: "IPL 2024",
    home: "Chennai Super Kings",
    away: "Mumbai Indians",
    time: "LIVE",
    odds: { home: "1.85", away: "2.10" }
  },
  {
    sport: "Soccer",
    tournament: "Champions League",
    home: "Real Madrid",
    away: "Manchester City",
    time: "20:45",
    odds: { home: "2.40", draw: "3.40", away: "2.80" }
  },
  {
    sport: "Tennis",
    tournament: "Wimbledon",
    home: "Carlos Alcaraz",
    away: "Novak Djokovic",
    time: "LIVE",
    odds: { home: "1.90", away: "1.90" }
  }
];

export function SportHighlights() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-tight">Sport Highlights</h2>
        </div>
        <button className="text-[11px] font-bold text-emerald-600 hover:underline">View All Matches</button>
      </div>

      <div className="grid gap-3">
        {matches.map((match, i) => (
          <div key={i} className="bg-white rounded border shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{match.tournament}</span>
              </div>
              <div className={match.time === "LIVE" ? "flex items-center gap-1.5" : ""}>
                {match.time === "LIVE" && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>}
                <span className={`text-[11px] font-bold ${match.time === "LIVE" ? "text-red-500" : "text-slate-500"}`}>
                  {match.time}
                </span>
              </div>
            </div>
            
            <div className="p-3 flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between group-hover:text-emerald-700 transition-colors">
                  <span className="text-[14px] font-bold text-slate-800">{match.home}</span>
                  <div className="flex gap-1">
                    <div className="w-12 h-7 bg-sky-100 rounded flex items-center justify-center text-[12px] font-bold text-sky-700">
                      {match.odds.home}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-slate-800">{match.away}</span>
                  <div className="flex gap-1">
                    <div className="w-12 h-7 bg-pink-100 rounded flex items-center justify-center text-[12px] font-bold text-pink-700">
                      {match.odds.away}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
