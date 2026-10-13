import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
const require = createRequire(import.meta.url);
const { handler, __test } = require("../infra/aws/exchange-api/handler.cjs");
const token = "a".repeat(64);
const config = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-only" };
const request = (action, input = {}, headers = {}) => ({
  rawPath: "/exchange", requestContext: { http: { method: "POST" } },
  headers, body: JSON.stringify({ action, input }),
});
const payload = reply => JSON.parse(reply.body);

test("unconfigured stage is healthy but fails closed for finance actions", async () => {
  delete process.env.EXCHANGE_CONFIG_SECRET_ARN;
  assert.deepEqual(payload(await handler(request("health"))), {
    service: "exchange-api-aws", version: 1, backendConfigured: false, feedConfigured: false,
  });
  assert.equal((await handler(request("placeBet", {}, { "x-exchange-session": token }))).statusCode, 503);
});

test("preflight restricts origins, methods and headers", async () => {
  const event = { rawPath: "/exchange", requestContext: { http: { method: "OPTIONS" } },
    headers: { origin: "https://bpexch1.com" } };
  const good = await __test.route(event);
  assert.equal(good.statusCode, 204);
  assert.equal(good.headers["access-control-allow-origin"], "https://bpexch1.com");
  assert.equal((await __test.route({ ...event, headers: { origin: "https://evil.example" } })).statusCode, 403);
});

test("login is rate-limited before password verification", async () => {
  const calls = [];
  const rpc = async (name, args) => {
    calls.push({ name, args });
    return name === "reserve_wallet_attempt" ? { data: false } : { data: null };
  };
  const reply = await __test.route(request("login", { username: " Book ", password: "password123" }), { config, rpc });
  assert.equal(reply.statusCode, 429);
  assert.deepEqual(calls, [{ name: "reserve_wallet_attempt", args: { p_username: "book" } }]);
});

test("bet and settlement send the server session to existing transaction RPC", async () => {
  const calls = [];
  const rpc = async (name, args) => { calls.push({ name, args }); return { data: { success: true } }; };
  for (const action of ["placeBet", "settle"]) {
    const input = { requestId: "same-on-retry", amount: "100" };
    const reply = await __test.route(request(action, input, { "x-exchange-session": token }), { config, rpc });
    assert.equal(reply.statusCode, 200);
    assert.deepEqual(payload(reply), { success: true });
  }
  assert.deepEqual(calls, ["placeBet", "settle"].map(action => ({
    name: "exchange_request", args: { p_token: token, p_action: action,
      p_input: { requestId: "same-on-retry", amount: "100" } },
  })));
  assert.equal((await __test.route(request("placeBet"), { config, rpc })).statusCode, 401);
});

test("market read preserves authorization and strips unexpected database errors", async () => {
  const calls = [];
  const rpc = async (name, args) => {
    calls.push(args.p_action);
    return calls.length === 1 ? { data: [] } : { error: "raw SQL/private data" };
  };
  const reply = await __test.route(request("markets", {}, { "x-exchange-session": token }), { config, rpc });
  assert.equal(reply.statusCode, 400);
  assert.equal(payload(reply).error, "Request could not be completed");
  assert.deepEqual(calls, ["markets", "markets"]);
});

test("feed actions require licensing and permission", async () => {
  const rpc = async () => ({ data: true });
  const reply = await __test.route(request("syncFeed", {}, { "x-exchange-session": token }), { config, rpc });
  assert.equal(reply.statusCode, 503);
  assert.equal(payload(reply).error, "Licensed feed is not configured");
});

test("AWS to database transport sends the service key only server-side and parses RPC rejection", async () => {
  const original = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ message: "Insufficient balance" }), { status: 400 });
    };
    const response = await __test.dbRpc(config, "exchange_request", { p_action: "placeBet" });
    assert.equal(response.error, "Insufficient balance");
    assert.equal(calls[0].url, "https://example.supabase.co/rest/v1/rpc/exchange_request");
    assert.equal(calls[0].options.headers.apikey, "test-only");
    assert.equal(calls[0].options.headers.authorization, "Bearer test-only");
    assert.deepEqual(JSON.parse(calls[0].options.body), { p_action: "placeBet" });
  } finally { globalThis.fetch = original; }
});

test("new Supabase secret key uses apikey without invalid bearer token", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.headers.apikey, "sb_secret_test_only");
      assert.equal(options.headers.authorization, undefined);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };
    const response = await __test.dbRpc({ SUPABASE_URL: config.SUPABASE_URL,
      SUPABASE_SECRET_KEY: "sb_secret_test_only" }, "exchange_request", {});
    assert.deepEqual(response, { data: { success: true }, error: null });
  } finally { globalThis.fetch = original; }
});
