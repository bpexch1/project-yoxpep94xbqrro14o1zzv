"use strict";

// AWS transport for the existing production exchange RPCs. The database stays
// in the current Supabase project; only server-side API execution moves to AWS.
const { fetchLicensedMarkets } = require("./feed.cjs");
const ACTIONS = new Set([
  "logout", "markets", "account", "betStatus", "placeBet", "settle",
  "setCommission", "reports", "commissionHistory", "entityRead",
  "saveClient", "settlePL", "lockMarket",
]);
const SAFE_ERROR = /^(Authentication required|Permission denied|Bet not found|Invalid bet parameters|Request ID conflict|Betting is disabled|Market unavailable or stale|Odds changed; refresh and confirm|Insufficient quoted liquidity|Insufficient balance|Settlement permission required|Settlement reason and request ID required|Market not found|Market already settled|Suspend or close market before settlement|Invalid winning runner|Market contains accounts outside your downline|Invalid commission parameters|Invalid report range or limit|Invalid report kind|Invalid query|Invalid account parameters|Username already exists|Invalid account share|Self account changes require administrator|Use the dedicated financial service|Password must contain 8 to 72 bytes|Invalid settlement amount|Insufficient P\/L balance)$/;
let cachedConfig;
let cachedUntil = 0;

function response(statusCode, data, origin = "") {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "vary": "Origin",
  };
  if (origin) headers["access-control-allow-origin"] = origin;
  return { statusCode, headers, body: JSON.stringify(data) };
}
function allowedOrigin(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (!origin) return "";
  const allowed = (process.env.EXCHANGE_ALLOWED_ORIGINS || "https://bpexch1.com")
    .split(",").map(s => s.trim());
  return allowed.includes(origin) ? origin : null;
}
async function getConfig() {
  if (cachedConfig && Date.now() < cachedUntil) return cachedConfig;
  if (!process.env.EXCHANGE_CONFIG_SECRET_ARN) throw Error("CONFIGURATION_UNAVAILABLE");
  const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
  const reply = await new SecretsManagerClient({}).send(
    new GetSecretValueCommand({ SecretId: process.env.EXCHANGE_CONFIG_SECRET_ARN }),
  );
  const config = JSON.parse(reply.SecretString || "{}");
  const key = config.SUPABASE_SECRET_KEY || config.SUPABASE_SERVICE_ROLE_KEY;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.SUPABASE_URL || "") ||
      typeof key !== "string" || !key ||
      (config.SUPABASE_SECRET_KEY && !key.startsWith("sb_secret_")))
    throw Error("CONFIGURATION_UNAVAILABLE");
  cachedConfig = config;
  cachedUntil = Date.now() + 300000;
  return config;
}
async function dbRpc(config, name, args) {
  const key = config.SUPABASE_SECRET_KEY || config.SUPABASE_SERVICE_ROLE_KEY;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 8000);
  try {
    const res = await fetch(config.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/rpc/" + name, {
      method: "POST", cache: "no-store", signal: abort.signal,
      headers: {
        "apikey": key,
        ...(key.startsWith("sb_secret_") ? {} : { "authorization": "Bearer " + key }),
        "content-type": "application/json",
      },
      body: JSON.stringify(args),
    });
    const data = await res.json().catch(() => null);
    return { data: res.ok ? data : null, error: res.ok ? null : data?.message || "Backend unavailable" };
  } finally { clearTimeout(timer); }
}
function parseRequest(event) {
  if (event.isBase64Encoded) throw Object.assign(Error("Unsupported encoding"), { status: 415 });
  const raw = event.body || "";
  if (raw.length > 16384) throw Object.assign(Error("Request too large"), { status: 413 });
  let body;
  try { body = JSON.parse(raw); } catch { throw Object.assign(Error("Invalid JSON"), { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !body.input || typeof body.input !== "object" || Array.isArray(body.input))
    throw Object.assign(Error("Invalid request"), { status: 400 });
  return body;
}

async function route(event, deps = {}) {
  const origin = allowedOrigin(event);
  if (origin === null) return response(403, { error: "Origin forbidden" });
  const method = (event.requestContext?.http?.method || event.httpMethod || "GET").toUpperCase();
  const path = event.rawPath || event.path || "/exchange";
  if (method === "OPTIONS") {
    const r = response(204, {}, origin);
    r.headers["access-control-allow-methods"] = "POST,OPTIONS";
    r.headers["access-control-allow-headers"] = "content-type,x-exchange-session";
    r.headers["access-control-max-age"] = "600";
    r.body = "";
    return r;
  }
  if (path !== "/exchange" || method !== "POST") return response(404, { error: "Not found" }, origin);
  const { action, input } = parseRequest(event);
  if (action === "health") {
    const configured = !!process.env.EXCHANGE_CONFIG_SECRET_ARN || !!deps.config;
    const status = configured ? (deps.config || await getConfig()) : {};
    return response(200, {
      service: "exchange-api-aws", version: 1, backendConfigured: configured,
      feedConfigured: status.BETFAIR_FEED_LICENSE_CONFIRMED === "true" &&
        !!status.BETFAIR_APP_KEY && !!status.BETFAIR_SESSION_TOKEN,
    }, origin);
  }
  if (!process.env.EXCHANGE_CONFIG_SECRET_ARN && !deps.config)
    return response(503, { error: "Backend not configured" }, origin);
  const config = deps.config || await getConfig();
  const rpc = deps.rpc || ((name, args) => dbRpc(config, name, args));
  if (action === "login") {
    if (typeof input.username !== "string" || input.username.length > 100 ||
        typeof input.password !== "string" || !input.password || input.password.length > 72)
      return response(400, { error: "Invalid credentials" }, origin);
    const limit = await rpc("reserve_wallet_attempt", { p_username: input.username.trim().toLowerCase() });
    if (limit.error) return response(503, { error: "Authentication unavailable" }, origin);
    if (!limit.data) return response(429, { error: "Too many attempts. Try again in one minute." }, origin);
    const login = await rpc("exchange_login", { p_username: input.username, p_password: input.password });
    return login.error ? response(401, { error: "Invalid username or password" }, origin)
      : response(200, login.data, origin);
  }
  const token = event.headers?.["x-exchange-session"] || event.headers?.["X-Exchange-Session"];
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token))
    return response(401, { error: "Authentication required; sign in again" }, origin);
  if (action === "syncFeed") {
    const permission = await rpc("exchange_request", { p_token: token, p_action: "authorizeFeed", p_input: {} });
    if (permission.error) return response(403, { error: "Feed administration permission required" }, origin);
    if (input.eventId !== undefined && (typeof input.eventId !== "string" || !/^\d{1,30}$/.test(input.eventId)))
      return response(400, { error: "Invalid event ID" }, origin);
    if (config.BETFAIR_FEED_LICENSE_CONFIRMED !== "true" || !config.BETFAIR_APP_KEY || !config.BETFAIR_SESSION_TOKEN)
      return response(503, { error: "Licensed feed is not configured" }, origin);
    const markets = await (deps.feed || fetchLicensedMarkets)(
      { appKey: config.BETFAIR_APP_KEY, sessionToken: config.BETFAIR_SESSION_TOKEN }, input.eventId,
    );
    const stored = await rpc("exchange_ingest", { p_markets: markets });
    if (stored.error) return response(503, { error: "Feed persistence failed" }, origin);
    return response(200, { success: true, markets: stored.data, observedAt: new Date().toISOString() }, origin);
  }
  if (!ACTIONS.has(action)) return response(400, { error: "Unknown action" }, origin);
  if (action === "markets") {
    const access = await rpc("exchange_request", { p_token: token, p_action: "markets", p_input: input });
    if (access.error) return response(401, { error: "Authentication required" }, origin);
    if (config.BETFAIR_FEED_LICENSE_CONFIRMED === "true" && config.BETFAIR_APP_KEY && config.BETFAIR_SESSION_TOKEN) {
      const claim = await rpc("exchange_claim_feed_refresh", {});
      if (!claim.error && claim.data) {
        try {
          const markets = await (deps.feed || fetchLicensedMarkets)(
            { appKey: config.BETFAIR_APP_KEY, sessionToken: config.BETFAIR_SESSION_TOKEN },
            undefined, undefined, (access.data || []).filter(m => !m.settled_at),
          );
          const write = await rpc("exchange_ingest", { p_markets: markets });
          if (write.error) return response(503, { error: "Feed persistence failed" }, origin);
        } catch {
          return response(503, { error: "Licensed feed disconnected; prices cannot be refreshed" }, origin);
        }
      }
    }
  }
  const result = await rpc("exchange_request", { p_token: token, p_action: action, p_input: input });
  if (result.error) return response(result.error === "Authentication required" ? 401 : 400,
    { error: SAFE_ERROR.test(result.error) ? result.error : "Request could not be completed" }, origin);
  return response(200, result.data, origin);
}

exports.handler = async event => {
  try { return await route(event); }
  catch (e) {
    if (e?.status >= 400 && e.status < 500) return response(e.status, { error: e.message }, allowedOrigin(event) || "");
    return response(503, { error: "Backend unavailable" }, allowedOrigin(event) || "");
  }
};
exports.__test = { route, dbRpc };
