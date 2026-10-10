import { createClient } from "npm:@supabase/supabase-js@2.110.4";

const ALLOWED = new Set(["https://bpexch1.com", "https://www.bpexch1.com"]);
const originHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.has(origin) ? origin : "https://bpexch1.com",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
  };
};
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...originHeaders(req), "Content-Type": "application/json" } });
const service = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SERVICE_UNAVAILABLE");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};
const sha256hex = async (text: string) => Array.from(
  new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))
).map(x => x.toString(16).padStart(2, "0")).join("");
const authToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: originHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  try {
    if (Number(req.headers.get("content-length") || 0) > 8192) return json(req, { error: "Request too large" }, 413);
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!/^[a-zA-Z0-9_-]{43}$/.test(token)) return json(req, { error: "Session expired. Log in again" }, 401);
    const body = await req.json();
    const { clientId, wallet, direction, amount, description, requestId } = body || {};
    if (!["cash", "credit"].includes(wallet) || !["deposit", "withdraw"].includes(direction) ||
        typeof amount !== "string" || !/^\d+(\.\d{1,2})?$/.test(amount) ||
        !Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > 1e9 ||
        typeof clientId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId) ||
        typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId) ||
        typeof description !== "string" || description.length > 500) {
      return json(req, { error: "Invalid transfer parameters" }, 400);
    }
    const db = service();
    const { data, error } = await db.rpc("manual_wallet_transfer_session", {
      p_token_hash: await sha256hex(token), p_client_id: clientId, p_wallet: wallet,
      p_direction: direction, p_amount: amount, p_description: description, p_request_id: requestId,
    });
    if (error) {
      if (error.message.includes("Session expired")) return json(req, { error: "Session expired. Log in again" }, 401);
      const allowed = /^(Administrator permission required|Select a downline account|Target account is disabled|Account is outside your downline|Insufficient (cash|credit) balance|Insufficient operator credit limit|Request ID was already used for a different transfer|Invalid transfer parameters)$/;
      return json(req, { error: allowed.test(error.message) ? error.message : "Transfer could not be completed" }, 400);
    }
    if (!data?.success) return json(req, { error: "Transfer was not confirmed" }, 503);
    return json(req, data);
  } catch {
    return json(req, { error: "Wallet service unavailable" }, 503);
  }
});
