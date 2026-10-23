export type CricketScore = {
  inning: string;
  runs: number | null;
  wickets: number | null;
  overs: number | null;
};

export type CricketFixture = {
  id: string;
  name: string;
  status: string;
  dateTimeGMT: string;
  teams: string[];
  score: CricketScore[];
  matchStarted: boolean;
};

export async function getCricketScores(): Promise<CricketFixture[]> {
  const base = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !anonKey) throw new Error("Cricket feed is not configured");
  const response = await fetch(`${base}/functions/v1/cricket-feed`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!response.ok) throw new Error("Cricket feed is unavailable");
  const payload = await response.json();
  if (!Array.isArray(payload.matches)) throw new Error("Cricket feed returned invalid data");
  return payload.matches as CricketFixture[];
}
