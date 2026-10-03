import { createClient } from "npm:@supabase/supabase-js@2.110.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const text = await req.text();
    if (text.length > 8192) return json({ error: "Request too large" }, 413);
    const body = JSON.parse(text);
    const { operatorUsername, operatorPassword, clientId, wallet, direction, amount, description, requestId } = body;
    if (typeof operatorUsername !== "string" || !operatorUsername.trim() || operatorUsername.length > 100 ||
        typeof operatorPassword !== "string" || !operatorPassword || operatorPassword.length > 72 ||
        typeof amount !== "string" || !/^\d+(\.\d{1,2})?$/.test(amount) ||
        !Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > 1e9 ||
        !["cash","credit"].includes(wallet) || !["deposit","withdraw"].includes(direction) ||
        typeof clientId !== "string" || typeof requestId !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(clientId) || !/^[0-9a-f-]{36}$/i.test(requestId) ||
        typeof description !== "string" || description.length > 500) return json({ error: "Invalid transfer parameters" }, 400);
    const url = Deno.env.get("SUPABASE_URL");
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !secret) return json({ error: "Wallet service is not configured" }, 503);
    const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    // Separate committed RPC: failed password validation cannot roll back this rate limit.
    const attempt = await db.rpc("reserve_wallet_attempt", { p_username: operatorUsername });
    if (attempt.error) return json({ error: "Wallet service unavailable" }, 503);
    if (!attempt.data) return json({ error: "Too many attempts. Try again in one minute." }, 429);
    const { data, error } = await db.rpc("manual_wallet_transfer", {
      p_operator: operatorUsername, p_password: operatorPassword, p_client_id: clientId,
      p_wallet: wallet, p_direction: direction, p_amount: amount,
      p_description: description, p_request_id: requestId,
    });
    if (error) {
      const allowed = /^(Invalid administrator credentials|Administrator permission required|Select a downline account|Target account is disabled|Account is outside your downline|Insufficient (cash|credit) balance|Insufficient dealer credit limit|Request ID was already used for a different transfer|Invalid transfer parameters)$/;
      return json({ error: allowed.test(error.message) ? error.message : "Transfer could not be completed" }, 400);
    }
    return json(data);
  } catch {
    return json({ error: "Invalid request or wallet service unavailable" }, 400);
  }
});
