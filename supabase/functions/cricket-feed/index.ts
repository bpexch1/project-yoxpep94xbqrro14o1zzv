// Score-only cricket feed. No betting markets or synthetic odds are generated here.
const allowedOrigin = Deno.env.get("CRICKET_FEED_ORIGIN") || "https://bpexch1.com";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Vary": "Origin",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "private, max-age=30" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const origin = request.headers.get("Origin");
  if (origin && origin !== allowedOrigin) return json({ error: "Origin not allowed" }, 403);
  const key = Deno.env.get("CRICKETDATA_API_KEY");
  if (!key) return json({ error: "Cricket feed is not configured" }, 503);

  try {
    const url = new URL("https://api.cricapi.com/v1/currentMatches");
    url.searchParams.set("apikey", key);
    url.searchParams.set("offset", "0");
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return json({ error: "Cricket provider unavailable" }, 502);
    const payload = await response.json();
    if (payload.status !== "success" || !Array.isArray(payload.data)) {
      return json({ error: "Cricket provider returned no usable data" }, 502);
    }
    const matches = payload.data
      .filter((match: Record<string, unknown>) => !match.matchEnded)
      .slice(0, 40)
      .map((match: Record<string, unknown>) => ({
        id: String(match.id || ""),
        name: String(match.name || ""),
        status: String(match.status || ""),
        dateTimeGMT: String(match.dateTimeGMT || ""),
        teams: Array.isArray(match.teams) ? match.teams.map(String).slice(0, 2) : [],
        score: Array.isArray(match.score)
          ? match.score.slice(0, 4).map((entry: Record<string, unknown>) => ({
              inning: String(entry.inning || ""),
              runs: typeof entry.r === "number" ? entry.r : null,
              wickets: typeof entry.w === "number" ? entry.w : null,
              overs: typeof entry.o === "number" ? entry.o : null,
            }))
          : [],
        matchStarted: match.matchStarted === true,
      }))
      .filter((match: { id: string; name: string }) => match.id && match.name);
    return json({ matches });
  } catch {
    return json({ error: "Cricket provider unavailable" }, 502);
  }
});
