export type CricketScore = { inning: string; runs: number; wickets: number; overs: number };
export type CricketMatch = {
  id: string;
  providerId: string;
  source: "CricketData";
  title: string;
  teams: [string, string];
  startsAt: string | null;
  status: "live" | "upcoming" | "completed";
  statusText: string;
  scores: CricketScore[];
  marketStatus: "SUSPENDED";
};

export function normalizeCricketMatches(payload: unknown): CricketMatch[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as any).data))
    throw new Error("Invalid cricket provider response");
  const seen = new Set<string>();
  return (payload as any).data.flatMap((raw: any) => {
    if (!raw || typeof raw.id !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(raw.id) || seen.has(raw.id)) return [];
    const teams = Array.isArray(raw.teams) ? raw.teams.filter((x: unknown) => typeof x === "string" && x.trim()) : [];
    if (teams.length < 2) return [];
    seen.add(raw.id);
    const dateText = typeof raw.dateTimeGMT === "string" ? raw.dateTimeGMT : raw.date;
    const start = typeof dateText === "string" ? Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(dateText) ? dateText : `${dateText}Z`) : NaN;
    const scores: CricketScore[] = (Array.isArray(raw.score) ? raw.score : []).flatMap((s: any) => {
      if (!s || !Number.isFinite(s.r) || !Number.isFinite(s.w) || !Number.isFinite(s.o)) return [];
      return [{ inning: String(s.inning || "Innings").slice(0, 80), runs: s.r, wickets: s.w, overs: s.o }];
    });
    return [{
      id: `cricketdata:${raw.id}`,
      providerId: raw.id,
      source: "CricketData" as const,
      title: typeof raw.name === "string" ? raw.name.slice(0, 180) : `${teams[0]} vs ${teams[1]}`,
      teams: [teams[0].slice(0, 80), teams[1].slice(0, 80)] as [string, string],
      startsAt: Number.isFinite(start) ? new Date(start).toISOString() : null,
      status: raw.matchEnded ? "completed" as const : raw.matchStarted ? "live" as const : "upcoming" as const,
      statusText: typeof raw.status === "string" ? raw.status.slice(0, 180) : "",
      scores,
      // Free score data has no licensed exchange price. Never enable betting
      // against these provider IDs or present a synthetic price as live odds.
      marketStatus: "SUSPENDED" as const,
    }];
  });
}
