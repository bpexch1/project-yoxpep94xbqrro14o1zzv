import { createClient } from "npm:@supabase/supabase-js@2.110.4";
import { normalizeCricketMatches } from "./normalize.ts";

const MIN_REFRESH_MS = 20 * 60 * 1000; // At most 72 scheduled-equivalent hits/day per shared cache.
const LEASE_MS = 30 * 1000;
const MAX_STALE_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const allowed = (Deno.env.get("CRICKET_ALLOWED_ORIGINS") || "https://bpexch1.com")
    .split(",").map((value) => value.trim());
  const cors = allowed.includes(origin) ? {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,x-exchange-session",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
  } : {};
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  if (origin && !allowed.includes(origin)) return json({ error: "Origin not allowed" }, 403);

  const token = req.headers.get("x-exchange-session");
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return json({ error: "Authentication required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "Backend unavailable" }, 503);
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const auth = await db.rpc("exchange_request", { p_token: token, p_action: "account", p_input: {} });
  if (auth.error) return json({ error: "Authentication required" }, 401);

  const key = Deno.env.get("CRICKETDATA_API_KEY");
  if (!key) return json({ error: "Cricket provider is not configured" }, 503);
  const read = await db.from("cricket_feed_cache").select("payload,fetched_at,refresh_lease_until").eq("id", "current").single();
  if (read.error || !read.data) return json({ error: "Cricket cache unavailable" }, 503);
  const now = Date.now();
  const age = now - new Date(read.data.fetched_at).getTime();
  const cached = Array.isArray(read.data.payload) ? read.data.payload : [];
  const response = (matches: unknown, stale: boolean, fetchedAt: string) =>
    json({ matches, source: "CricketData", fetchedAt, stale, oddsAvailable: false });
  if (age < MIN_REFRESH_MS) return response(cached, false, read.data.fetched_at);

  // A conditional database update grants one worker a short refresh lease.
  // Other workers serve a clearly marked stale response instead of spending
  // more free-tier requests or overwriting a newer snapshot.
  const claim = await db.from("cricket_feed_cache")
    .update({ refresh_lease_until: new Date(now + LEASE_MS).toISOString() })
    .eq("id", "current")
    .lt("refresh_lease_until", new Date(now).toISOString())
    .lt("fetched_at", new Date(now - MIN_REFRESH_MS).toISOString())
    .select("id");
  if (claim.error) return json({ error: "Cricket cache unavailable" }, 503);
  if (!claim.data?.length) {
    return age < MAX_STALE_MS ? response(cached, true, read.data.fetched_at) : json({ error: "Cricket feed is refreshing" }, 503);
  }

  try {
    const endpoint = new URL("https://api.cricapi.com/v1/currentMatches");
    endpoint.searchParams.set("apikey", key);
    endpoint.searchParams.set("offset", "0");
    const upstream = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error("Provider unavailable");
    const raw = await upstream.json();
    if (raw?.status !== "success") throw new Error("Provider rejected request");
    const matches = normalizeCricketMatches(raw);
    const fetchedAt = new Date().toISOString();
    const write = await db.from("cricket_feed_cache").update({
      payload: matches, fetched_at: fetchedAt, refresh_lease_until: new Date(0).toISOString(), last_error_at: null,
    }).eq("id", "current");
    if (write.error) throw new Error("Cache write failed");
    return response(matches, false, fetchedAt);
  } catch {
    await db.from("cricket_feed_cache").update({
      // A failed provider request also consumes quota. Back off before retry.
      refresh_lease_until: new Date(Date.now() + MIN_REFRESH_MS).toISOString(), last_error_at: new Date().toISOString(),
    }).eq("id", "current");
    return age < MAX_STALE_MS ? response(cached, true, read.data.fetched_at) : json({ error: "Cricket feed unavailable" }, 503);
  }
});
