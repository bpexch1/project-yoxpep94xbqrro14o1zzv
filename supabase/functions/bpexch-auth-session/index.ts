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
    if (Number(req.headers.get("content-length") || 0) > 4096) return json(req, { error: "Request too large" }, 413);
    const body = await req.json();
    const db = service();
    if (body?.action === "logout") {
      const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (bearer.length >= 40 && bearer.length <= 128) {
        await db.rpc("bpexch_revoke_session", { p_token_hash: await sha256hex(bearer) });
      }
      return json(req, { success: true });
    }
    if (body?.action !== "login") return json(req, { error: "Invalid request" }, 400);
    const username = body.username, password = body.password;
    if (typeof username !== "string" || username.trim().length < 2 || username.length > 100 ||
        typeof password !== "string" || !password || password.length > 72) {
      return json(req, { error: "Invalid username or password" }, 401);
    }
    const attempt = await db.rpc("reserve_wallet_attempt", { p_username: username.trim() });
    if (attempt.error) return json(req, { error: "Authentication unavailable" }, 503);
    if (!attempt.data) return json(req, { error: "Too many attempts. Retry in one minute" }, 429);
    const token = authToken();
    const { data, error } = await db.rpc("bpexch_open_session", {
      p_username: username.trim(), p_password: password, p_token_hash: await sha256hex(token),
    });
    if (error || !data?.id) return json(req, { error: "Invalid username or password" }, 401);
    return json(req, { success: true, sessionToken: token, expiresInSeconds: 2700, client: data });
  } catch {
    return json(req, { error: "Authentication unavailable" }, 503);
  }
});
