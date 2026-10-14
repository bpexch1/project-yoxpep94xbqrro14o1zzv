import { createClient } from "npm:@supabase/supabase-js@2.110.4";
import { fetchLicensedMarkets } from "./feed.ts";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization,apikey,content-type,x-client-info,x-exchange-session",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 16384) return json({ error: "Request too large" }, 413);
    const { action, input = {} } = JSON.parse(raw);
    const url = Deno.env.get("SUPABASE_URL"),
      key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return json({ error: "Backend not configured" }, 503);
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (action === "health")
      return json({
        service: "exchange-api",
        version: 1,
        feedConfigured:
          Deno.env.get("BETFAIR_FEED_LICENSE_CONFIRMED") === "true" &&
          !!Deno.env.get("BETFAIR_APP_KEY") &&
          !!Deno.env.get("BETFAIR_SESSION_TOKEN"),
      });
    if (action === "login") {
      if (
        typeof input.username !== "string" ||
        input.username.length > 100 ||
        typeof input.password !== "string" ||
        !input.password ||
        input.password.length > 72
      )
        return json({ error: "Invalid credentials" }, 400);
      const limit = await db.rpc("reserve_wallet_attempt", {
        p_username: input.username.trim().toLowerCase(),
      });
      if (limit.error)
        return json({ error: "Authentication unavailable" }, 503);
      if (!limit.data)
        return json(
          { error: "Too many attempts. Try again in one minute." },
          429,
        );
      const { data, error } = await db.rpc("exchange_login", {
        p_username: input.username,
        p_password: input.password,
      });
      return error
        ? json({ error: "Invalid username or password" }, 401)
        : json(data);
    }
    const token = req.headers.get("x-exchange-session");
    if (!token || !/^[0-9a-f]{64}$/.test(token))
      return json({ error: "Authentication required; sign in again" }, 401);
    if (action === "syncFeed") {
      const permission = await db.rpc("exchange_request", {
        p_token: token,
        p_action: "authorizeFeed",
        p_input: {},
      });
      if (permission.error)
        return json({ error: "Feed administration permission required" }, 403);
      if (
        input.eventId !== undefined &&
        (typeof input.eventId !== "string" || !/^\d{1,30}$/.test(input.eventId))
      )
        return json({ error: "Invalid event ID" }, 400);
      const appKey = Deno.env.get("BETFAIR_APP_KEY"),
        sessionToken = Deno.env.get("BETFAIR_SESSION_TOKEN");
      if (
        Deno.env.get("BETFAIR_FEED_LICENSE_CONFIRMED") !== "true" ||
        !appKey ||
        !sessionToken
      )
        return json({ error: "Licensed feed is not configured" }, 503);
      const markets = await fetchLicensedMarkets(
        { appKey, sessionToken },
        input.eventId,
      );
      const { data, error } = await db.rpc("exchange_ingest", {
        p_markets: markets,
      });
      if (error) return json({ error: "Feed persistence failed" }, 503);
      return json({
        success: true,
        markets: data,
        observedAt: new Date().toISOString(),
      });
    }
    const actions = [
      "logout",
      "markets",
      "account",
      "betStatus",
      "placeBet",
      "settle",
      "setCommission",
      "reports",
      "commissionHistory",
      "entityRead",
      "walletLedger",
      "saveClient",
      "settlePL",
      "lockMarket",
    ];
    if (!actions.includes(action))
      return json({ error: "Unknown action" }, 400);
    if (action === "markets") {
      const access = await db.rpc("exchange_request", {
        p_token: token,
        p_action: "markets",
        p_input: input,
      });
      if (access.error) return json({ error: "Authentication required" }, 401);
      const appKey = Deno.env.get("BETFAIR_APP_KEY"),
        sessionToken = Deno.env.get("BETFAIR_SESSION_TOKEN");
      if (
        Deno.env.get("BETFAIR_FEED_LICENSE_CONFIRMED") === "true" &&
        appKey &&
        sessionToken
      ) {
        const claim = await db.rpc("exchange_claim_feed_refresh");
        if (!claim.error && claim.data) {
          try {
            const markets = await fetchLicensedMarkets(
              { appKey, sessionToken },
              undefined,
              undefined,
              (access.data || []).filter((m: any) => !m.settled_at && !m.is_demo),
            );
            const write = await db.rpc("exchange_ingest", {
              p_markets: markets,
            });
            if (write.error)
              return json({ error: "Feed persistence failed" }, 503);
          } catch {
            return json(
              {
                error: "Licensed feed disconnected; prices cannot be refreshed",
              },
              503,
            );
          }
        }
      }
    }
    const { data, error } = await db.rpc("exchange_request", {
      p_token: token,
      p_action: action,
      p_input: input,
    });
    if (error) {
      const allowed =
        /^(Authentication required|Permission denied|Bet not found|Invalid bet parameters|Request ID conflict|Betting is disabled|Market unavailable or stale|Odds changed; refresh and confirm|Insufficient quoted liquidity|Insufficient balance|Settlement permission required|Settlement reason and request ID required|Market not found|Market already settled|Suspend or close market before settlement|Invalid winning runner|Market contains accounts outside your downline|Invalid commission parameters|Invalid report range or limit|Invalid report kind|Invalid query|Invalid ledger wallet|Legacy bet lacks funding\/commission snapshot\. Manual review required before settlement|Missing\/invalid P\/L snapshot\. Manual review required|Invalid account parameters|Username already exists|Invalid account share|Self account changes require administrator|Use the dedicated financial service|Password must contain 8 to 72 bytes|Invalid settlement amount|Insufficient P\/L balance)$/;
      return json(
        {
          error: allowed.test(error.message)
            ? error.message
            : "Request could not be completed",
        },
        error.message === "Authentication required" ? 401 : 400,
      );
    }
    return json(data);
  } catch {
    return json({ error: "Invalid request or backend unavailable" }, 400);
  }
});
