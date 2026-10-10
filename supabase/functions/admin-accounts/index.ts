import { createClient } from "npm:@supabase/supabase-js@2.110.4";

// This function uses username+password reauthentication; deploy with verify_jwt=false.
// Do not confuse the browser's editable clientSession object with authenticated identity.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const safeErrors = new Set([
  "Invalid administrator credentials", "Role not permitted for this account",
  "Invalid new account details", "Username already exists",
  "Downline share exceeds parent limit", "Invalid market permissions",
]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);
  try {
    const raw = await request.text();
    if (raw.length > 16000) return response({ error: "Request too large" }, 413);
    const body = JSON.parse(raw);
    const action = body?.action;
    const operator = body?.operatorUsername;
    const operatorPassword = body?.operatorPassword;
    if (!["create_user", "get_market_permissions", "set_market_permissions"].includes(action)
      || typeof operator !== "string" || !/^[A-Za-z0-9_@]{3,64}$/.test(operator)
      || typeof operatorPassword !== "string" || operatorPassword.length < 1
      || operatorPassword.length > 72) return response({ error: "Invalid request" }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRoleKey) return response({ error: "Admin service is not configured" }, 503);
    const db = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Rate limiting is a separate committed RPC, so rejected credentials count as attempts.
    const attempt = await db.rpc("reserve_admin_attempt", { p_username: operator });
    if (attempt.error) return response({ error: "Admin service migration is not deployed" }, 503);
    if (!attempt.data) return response({ error: "Too many attempts. Try again in one minute." }, 429);

    let result: { data: unknown; error: { message: string } | null };
    if (action === "create_user") {
      if (typeof body.username !== "string" || !/^[A-Za-z0-9_@]{3,64}$/.test(body.username)
        || typeof body.password !== "string" || body.password.length < 8 || body.password.length > 72
        || typeof body.role !== "string"
        || !["superadmin","admin","supermaster","master","dealer","client"].includes(body.role)
        || typeof body.downlineShare !== "number" || !Number.isFinite(body.downlineShare)
        || body.downlineShare < 0 || body.downlineShare > 100
        || typeof body.isActive !== "boolean"
        || typeof body.phone !== "string" || body.phone.length > 32
        || typeof body.reference !== "string" || body.reference.length > 100
        || typeof body.notes !== "string" || body.notes.length > 1000)
        return response({ error: "Invalid new account details" }, 400);
      result = await db.rpc("admin_create_downline", {
        p_operator: operator, p_operator_password: operatorPassword,
        p_username: body.username, p_password: body.password,
        p_role: body.role, p_share: body.downlineShare, p_active: body.isActive,
        p_phone: body.phone, p_reference: body.reference, p_notes: body.notes,
      });
    } else if (action === "get_market_permissions") {
      result = await db.rpc("admin_get_market_permissions", {
        p_operator: operator, p_password: operatorPassword,
      });
    } else {
      if (!Array.isArray(body.rules) || body.rules.length > 100
        || body.rules.some((x: unknown) => !x || typeof x !== "object"))
        return response({ error: "Invalid market permissions" }, 400);
      result = await db.rpc("admin_set_market_permissions", {
        p_operator: operator, p_password: operatorPassword, p_rules: body.rules,
      });
    }
    if (result.error) {
      return response({ error: safeErrors.has(result.error.message)
        ? result.error.message : "Admin operation could not be completed" }, 400);
    }
    return response({ ok: true, result: result.data });
  } catch {
    return response({ error: "Invalid request or admin service unavailable" }, 400);
  }
});
