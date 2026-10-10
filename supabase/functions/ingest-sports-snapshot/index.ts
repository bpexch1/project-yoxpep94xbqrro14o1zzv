import { createClient } from "npm:@supabase/supabase-js@2";

// POST only; server-to-server feed webhooks must supply
// x-bpexch-signature: sha256=<hex HMAC-SHA256 over exact request body>.
Deno.serve(async (request: Request): Promise<Response> => {
  const respond = (status: number, message: string) => new Response(
    JSON.stringify({ success: status >= 200 && status < 300, message }),
    { status, headers: { "content-type": "application/json" } }
  );

  if (request.method !== "POST") return respond(405, "POST required");
  const secret = Deno.env.get("SPORTS_FEED_SIGNING_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !url || !key) return respond(503, "Feed receiver is not configured");

  const signature = request.headers.get("x-bpexch-signature") || "";
  if (!/^sha256=[0-9a-f]{64}$/i.test(signature)) return respond(401, "Invalid signature");
  const body = await request.text();
  if (body.length > 131072) return respond(413, "Payload too large");

  const enc = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
  );
  const bytes = new Uint8Array((signature.slice(7).match(/../g) || [])
    .map((hex) => Number.parseInt(hex, 16)));
  if (!await crypto.subtle.verify("HMAC", signingKey, bytes, enc.encode(body))) {
    return respond(401, "Unauthorized feed");
  }

  let payload: any;
  try { payload = JSON.parse(body); } catch { return respond(400, "Invalid JSON"); }
  if (!payload || typeof payload !== "object" ||
    !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(payload.match_id || "")) ||
    typeof payload.provider_event_id !== "string" || !payload.provider_event_id.trim() ||
    typeof payload.source !== "string" || !payload.source.trim() ||
    typeof payload.emitted_at !== "string" ||
    !Number.isFinite(Date.parse(payload.emitted_at)) ||
    Math.abs(Date.now() - Date.parse(payload.emitted_at)) > 20000 ||
    !["OPEN", "SUSPENDED", "CLOSED"].includes(payload.market_status) ||
    !Array.isArray(payload.markets) ||
    payload.markets.length > 100) {
    return respond(400, "Invalid market payload");
  }
  const odds = (x: any): number | null => {
    if (x === null || x === undefined) return null;
    if (typeof x !== "number" || !Number.isFinite(x) || x <= 1 || x > 1000)
      throw new Error("Invalid odds");
    return x;
  };
  let prices: Array<number | null>;
  try {
    prices = [
      odds(payload.back_odds), odds(payload.lay_odds),
      odds(payload.back_odds2), odds(payload.lay_odds2)
    ];
  } catch { return respond(400, "Invalid prices"); }

  const database = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { error } = await database.rpc("ingest_verified_market_snapshot", {
    p_match_id: payload.match_id,
    p_provider_event_id: payload.provider_event_id,
    p_emitted_at: payload.emitted_at,
    p_source: payload.source,
    p_market_status: payload.market_status,
    p_markets: payload.markets,
    p_score: payload.score || null,
    p_back_odds: prices[0],
    p_lay_odds: prices[1],
    p_back_odds2: prices[2],
    p_lay_odds2: prices[3]
  });
  if (error) {
    console.error("Sports ingestion error", error.code);
    return respond(422, "Verified event could not be applied");
  }
  return respond(200, "Verified market snapshot stored");
});
