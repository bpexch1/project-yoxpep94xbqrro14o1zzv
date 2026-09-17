import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEventShotmap } from "@/functions";
import { ShotmapItem } from "@/functions/mockSportsData";
import { RefreshCw, Filter, Target, Zap, Shield, HelpCircle, Activity } from "lucide-react";

interface FootballShotmapProps {
  match: any;
  defaultEventId?: string | number;
}

export function FootballShotmap({ match, defaultEventId }: FootballShotmapProps) {
  const effectiveEventId = defaultEventId || match?.betfair_event_id || match?.id || "331003";
  const [customEventId, setCustomEventId] = useState<string>(String(effectiveEventId).replace(/^bf-|^atd-/, ''));
  const [activeEventId, setActiveEventId] = useState<string>(String(effectiveEventId).replace(/^bf-|^atd-/, ''));
  const [teamFilter, setTeamFilter] = useState<'all' | 'home' | 'away'>('all');
  const [shotFilter, setShotFilter] = useState<'all' | 'goal' | 'ontarget' | 'high_xg'>('all');
  const [selectedShot, setSelectedShot] = useState<ShotmapItem | null>(null);

  const homeTeamName = match?.team1 || "Home Team";
  const awayTeamName = match?.team2 || "Away Team";

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['football-shotmap', activeEventId, teamFilter],
    queryFn: () => fetchEventShotmap(activeEventId, teamFilter === 'all' ? undefined : (teamFilter === 'home' ? 1 : 2)),
    refetchInterval: 15000,
  });

  const rawShots: ShotmapItem[] = Array.isArray(data?.shotmap) ? data.shotmap : [];

  // Filter shots
  const filteredShots = rawShots.filter((shot) => {
    // Team filter
    if (teamFilter === 'home' && !shot.isHome) return false;
    if (teamFilter === 'away' && shot.isHome) return false;

    // Shot type filter
    if (shotFilter === 'goal' && shot.shotType !== 'goal') return false;
    if (shotFilter === 'ontarget' && shot.shotType !== 'goal' && shot.shotType !== 'save') return false;
    if (shotFilter === 'high_xg' && shot.xg < 0.25) return false;

    return true;
  });

  const stats = data?.stats || {
    home: { totalShots: 6, onTarget: 3, goals: 2, blocked: 1, missed: 2, xg: 1.83 },
    away: { totalShots: 5, onTarget: 3, goals: 1, blocked: 1, missed: 1, xg: 1.15 }
  };

  const getShotColor = (type: ShotmapItem['shotType']) => {
    switch (type) {
      case 'goal': return '#f59e0b'; // Gold / Amber
      case 'save': return '#10b981'; // Emerald Green
      case 'block': return '#eab308'; // Yellow
      case 'post': return '#a855f7'; // Purple
      case 'miss': return '#ef4444'; // Red
      default: return '#94a3b8';
    }
  };

  const getShotLabel = (type: ShotmapItem['shotType']) => {
    switch (type) {
      case 'goal': return 'Goal';
      case 'save': return 'Saved / On Target';
      case 'block': return 'Blocked';
      case 'post': return 'Hit Woodwork';
      case 'miss': return 'Missed Off Target';
      default: return type;
    }
  };

  const handleSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEventId.trim()) {
      setActiveEventId(customEventId.trim());
      setSelectedShot(null);
    }
  };

  return (
    <div className="bg-[#0f172a] text-white p-3 md:p-4 rounded-b-lg border-b-2 border-[#00b181]">
      {/* Header with Title & API Endpoint Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00b181]" />
          <h3 className="text-sm font-black tracking-wide text-white uppercase">
            Live Shotmap & Expected Goals (xG)
          </h3>
          <span className="text-[10px] bg-white/10 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
            SportAPI7
          </span>
        </div>

        <form onSubmit={handleSync} className="flex items-center gap-1.5 text-xs">
          <input
            type="text"
            value={customEventId}
            onChange={(e) => setCustomEventId(e.target.value)}
            placeholder="Event ID (e.g. 123456)"
            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#00b181] w-28"
          />
          <button
            type="submit"
            disabled={isFetching}
            className="bg-[#00b181] hover:bg-[#00966d] text-white px-2.5 py-1 rounded font-bold flex items-center gap-1 transition-colors text-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </form>
      </div>

      {/* Team & Type Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 my-3">
        {/* Team Selector */}
        <div className="flex rounded-md bg-white/5 p-0.5 border border-white/10 text-xs">
          <button
            onClick={() => { setTeamFilter('all'); setSelectedShot(null); }}
            className={`px-2.5 py-1 rounded font-bold transition-colors ${teamFilter === 'all' ? 'bg-[#00b181] text-white' : 'text-white/60 hover:text-white'}`}
          >
            All Teams
          </button>
          <button
            onClick={() => { setTeamFilter('home'); setSelectedShot(null); }}
            className={`px-2.5 py-1 rounded font-bold transition-colors ${teamFilter === 'home' ? 'bg-[#00b181] text-white' : 'text-white/60 hover:text-white'}`}
          >
            {homeTeamName.length > 12 ? `${homeTeamName.slice(0, 12)}...` : homeTeamName} (Home)
          </button>
          <button
            onClick={() => { setTeamFilter('away'); setSelectedShot(null); }}
            className={`px-2.5 py-1 rounded font-bold transition-colors ${teamFilter === 'away' ? 'bg-[#00b181] text-white' : 'text-white/60 hover:text-white'}`}
          >
            {awayTeamName.length > 12 ? `${awayTeamName.slice(0, 12)}...` : awayTeamName} (Away)
          </button>
        </div>

        {/* Shot Filter */}
        <div className="flex items-center gap-1 text-xs">
          <Filter className="w-3 h-3 text-white/40" />
          <select
            value={shotFilter}
            onChange={(e: any) => { setShotFilter(e.target.value); setSelectedShot(null); }}
            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00b181]"
          >
            <option value="all" className="bg-[#1e293b]">All Shots ({rawShots.length})</option>
            <option value="goal" className="bg-[#1e293b]">Goals Only ⚽</option>
            <option value="ontarget" className="bg-[#1e293b]">On Target 🟢</option>
            <option value="high_xg" className="bg-[#1e293b]">High xG (&gt; 0.25) 🔥</option>
          </select>
        </div>
      </div>

      {/* Main Visualizer: Football Pitch SVG + Live Shot Nodes */}
      <div className="relative w-full aspect-[16/9] max-h-[300px] bg-[#1b4332] rounded-lg border-2 border-white/20 overflow-hidden shadow-inner flex items-center justify-center select-none">
        {/* Pitch Lines (Attacking Half) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grass striping pattern */}
          <defs>
            <pattern id="pitch-stripes" width="10" height="100" patternUnits="userSpaceOnUse">
              <rect width="5" height="100" fill="#1b4332" />
              <rect x="5" width="5" height="100" fill="#2d6a4f" fillOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#pitch-stripes)" />

          {/* Touchline border */}
          <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

          {/* Halfway line */}
          <line x1="2" y1="2" x2="2" y2="98" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          {/* Center circle arc */}
          <path d="M 2 30 A 20 20 0 0 1 2 70" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />

          {/* Penalty box (Right side attacking goal) */}
          <rect x="76" y="22" width="22" height="56" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />

          {/* 6-yard box */}
          <rect x="91" y="36" width="7" height="28" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />

          {/* Goal post */}
          <rect x="98" y="42" width="1.5" height="16" fill="rgba(255,255,255,0.8)" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" />

          {/* Penalty spot */}
          <circle cx="85" cy="50" r="0.8" fill="rgba(255,255,255,0.7)" />

          {/* Penalty arc */}
          <path d="M 76 38 A 12 12 0 0 0 76 62" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

          {/* Corner arcs */}
          <path d="M 98 6 A 4 4 0 0 0 94 2" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <path d="M 98 94 A 4 4 0 0 1 94 98" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        </svg>

        {/* Goal Indicator Label */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 text-[9px] font-black uppercase text-white/50 tracking-widest pointer-events-none">
          GOAL
        </div>

        {/* Shot markers */}
        {filteredShots.map((shot) => {
          const isSelected = selectedShot?.id === shot.id;
          const markerSize = Math.max(14, Math.min(26, Math.round(shot.xg * 32 + 12)));
          const shotColor = getShotColor(shot.shotType);

          // Coords: clamp inside 5% to 95%
          const posX = Math.max(5, Math.min(95, shot.draw?.start?.x ?? 80));
          const posY = Math.max(8, Math.min(92, shot.draw?.start?.y ?? 50));

          return (
            <button
              key={shot.id}
              onClick={() => setSelectedShot(shot)}
              style={{
                left: `${posX}%`,
                top: `${posY}%`,
                width: `${markerSize}px`,
                height: `${markerSize}px`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: shotColor,
                borderColor: isSelected ? '#ffffff' : 'rgba(0,0,0,0.4)',
              }}
              className={`absolute rounded-full border-2 flex items-center justify-center font-bold text-[9px] text-white shadow-lg transition-all hover:scale-125 focus:scale-125 focus:outline-none ${
                isSelected ? 'ring-4 ring-white z-30' : 'z-10'
              } ${shot.shotType === 'goal' ? 'animate-pulse' : ''}`}
              title={`${shot.player.name} (${shot.time}') - ${getShotLabel(shot.shotType)} [xG: ${shot.xg}]`}
            >
              {shot.shotType === 'goal' ? '⚽' : shot.isHome ? 'H' : 'A'}
            </button>
          );
        })}

        {filteredShots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white/70">
            No shots matching current filter
          </div>
        )}
      </div>

      {/* Selected Shot Detail Tooltip Card */}
      {selectedShot && (
        <div className="mt-3 p-2.5 bg-white/10 rounded-lg border border-white/20 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getShotColor(selectedShot.shotType) }}
            />
            <div>
              <div className="font-bold text-white text-[13px] flex items-center gap-1.5">
                {selectedShot.player.name}
                <span className="text-[11px] font-normal text-white/60">
                  ({selectedShot.time}&apos;) - {selectedShot.isHome ? homeTeamName : awayTeamName}
                </span>
              </div>
              <div className="text-[11px] text-white/70 capitalize">
                Outcome: <strong className="text-white">{getShotLabel(selectedShot.shotType)}</strong> • Body: <strong className="text-white">{selectedShot.bodyPart.replace('-', ' ')}</strong> • Situation: <strong className="text-white">{selectedShot.situation}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-white/50 uppercase font-bold">xG Value</div>
              <div className="text-base font-black text-amber-400">{selectedShot.xg.toFixed(2)}</div>
            </div>
            <button
              onClick={() => setSelectedShot(null)}
              className="text-white/40 hover:text-white px-2 py-1 rounded bg-white/5 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Shotmap Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-2 border-t border-white/10 text-[11px] text-white/80">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block" />
          <span>Goal ⚽</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block" />
          <span>Saved / On Target</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] inline-block" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] inline-block" />
          <span>Woodwork</span>
        </div>
        <div className="text-white/40 text-[10px]">
          (Dot size = xG probability)
        </div>
      </div>

      {/* Comparison Statistics Bar */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2 flex justify-between">
          <span>{homeTeamName}</span>
          <span>Match Shot Stats</span>
          <span>{awayTeamName}</span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Expected Goals (xG) */}
          <div>
            <div className="flex justify-between font-bold text-[11px] mb-0.5">
              <span className="text-amber-400">{stats.home.xg}</span>
              <span className="text-white/70">Expected Goals (xG)</span>
              <span className="text-amber-400">{stats.away.xg}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(stats.home.xg / (stats.home.xg + stats.away.xg || 1)) * 100}%` }}
                className="bg-blue-500 h-full"
              />
              <div
                style={{ width: `${(stats.away.xg / (stats.home.xg + stats.away.xg || 1)) * 100}%` }}
                className="bg-red-500 h-full"
              />
            </div>
          </div>

          {/* Total Shots */}
          <div>
            <div className="flex justify-between font-bold text-[11px] mb-0.5">
              <span>{stats.home.totalShots}</span>
              <span className="text-white/70">Total Shots</span>
              <span>{stats.away.totalShots}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(stats.home.totalShots / (stats.home.totalShots + stats.away.totalShots || 1)) * 100}%` }}
                className="bg-blue-500 h-full"
              />
              <div
                style={{ width: `${(stats.away.totalShots / (stats.home.totalShots + stats.away.totalShots || 1)) * 100}%` }}
                className="bg-red-500 h-full"
              />
            </div>
          </div>

          {/* Shots On Target */}
          <div>
            <div className="flex justify-between font-bold text-[11px] mb-0.5">
              <span className="text-emerald-400">{stats.home.onTarget}</span>
              <span className="text-white/70">Shots On Target</span>
              <span className="text-emerald-400">{stats.away.onTarget}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(stats.home.onTarget / (stats.home.onTarget + stats.away.onTarget || 1)) * 100}%` }}
                className="bg-blue-500 h-full"
              />
              <div
                style={{ width: `${(stats.away.onTarget / (stats.home.onTarget + stats.away.onTarget || 1)) * 100}%` }}
                className="bg-red-500 h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
