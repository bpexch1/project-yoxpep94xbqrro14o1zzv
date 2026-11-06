import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const edge = readFileSync(new URL("../supabase/functions/game32/index.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261107050000_independent_game32_engine.sql", import.meta.url), "utf8");

test("Game32 exposes every required authenticated endpoint", () => {
  for (const endpoint of [
    "active", "config", "last-results", "my-active-bets",
    "my-exposure", "place-bet", "recent-settlements",
  ]) assert.ok(edge.includes('path === "' + endpoint + '"'), endpoint);
  assert.match(edge, /x-exchange-session/);
  assert.match(edge, /x-idempotency-key/);
});

test("wallet writes are atomic server functions with idempotency and row locks", () => {
  assert.match(migration, /unique\(client_id, request_id\)/i);
  assert.match(migration, /for update/i);
  assert.match(migration, /lock table public\.clients/i);
  assert.match(migration, /game32_reserve/);
  assert.match(migration, /game32_settlement/);
  assert.match(migration, /status='pending'/);
});

test("RLS blocks browser table access and only service role executes finance RPCs", () => {
  for (const table of ["game32_rounds", "game32_bets", "game32_audit"]) {
    assert.ok(migration.includes("alter table public." + table + " enable row level security"));
  }
  assert.match(migration, /revoke all on public\.game32_rounds[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /revoke all on function public\.game32_auth[\s\S]*from public,anon,authenticated/i);
  assert.match(migration, /grant execute on function[\s\S]*to service_role/i);
});

test("recovery settlement and immutable audit history are present", () => {
  assert.match(migration, /bpexch1-game32-recovery/);
  assert.match(migration, /game32_settle_due/);
  assert.match(migration, /grant select, insert on public\.game32_audit to service_role/i);
});
