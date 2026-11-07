import { createClient } from "npm:@supabase/supabase-js@2.110.4";
import {
  GAME32_BACK_ODDS, GAME32_LAY_ODDS, commitmentFor, revealOutcome,
  resolveGame32, secureDeck, game32VisibleCards,
} from "./engine.ts";

const GAME_ID = "9010";
const RUNNERS = ["8", "9", "10", "11"].map(id => ({
  id,
  name: `Player ${id}`,
  odds: GAME32_BACK_ODDS[id],
  layOdds: GAME32_LAY_ODDS[id],
}));
const CONFIG = {
  id: GAME_ID,
  name: "32 Cards",
  kind: "cards4",
  timing: { bettingSeconds: 20, revealIntervalMs: 1000, resultSeconds: 6 },
  rules: "A 32-card deck uses ranks 6 through King in all four suits. Player 8, 9, 10 and 11 each receive one card. A player's total is its base number plus its dealt card ranks. If the highest total is tied, every tied player receives another card until one highest total remains or the deck is exhausted. An unresolved tie voids all bets.",
  runners: RUNNERS,
};
const allowedOrigins = (Deno.env.get("GAME32_ALLOWED_ORIGINS") || "https://bpexch1.com")
  .split(",").map(value => value.trim()).filter(Boolean);
const previewOrigin = /^https:\/\/project-yoxpep94xbqrro14o1zzv-[a-z0-9-]+-bpexch1-7725s-projects\.vercel\.app$/;
const originAllowed = (origin: string) => allowedOrigins.includes(origin) || previewOrigin.test(origin);

function responseHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    ...(originAllowed(origin) ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,x-exchange-session,x-idempotency-key",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
}
const json = (req: Request, data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: responseHeaders(req) });

async function newRoundMaterial() {
  const deck = secureDeck();
  const nonceBytes = new Uint8Array(24);
  crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes, value => value.toString(16).padStart(2, "0")).join("");
  const commitment = await commitmentFor(deck, nonce);
  const outcome = resolveGame32(deck);
  return { deck, nonce, commitment, outcome };
}

function publicRound(row: any, nowMs: number) {
  const revealAt = Date.parse(row.reveal_at);
  const resultAt = Date.parse(row.result_at);
  const settled = Boolean(row.settled_at);
  const cardCount = row.outcome.groups.reduce((count: number, group: { cards: number[] }) => count + group.cards.length, 0);
  const visible = game32VisibleCards(nowMs, revealAt, cardCount);
  const outcome = revealOutcome(row.outcome, visible, settled && nowMs >= resultAt);
  return {
    id: row.id,
    gameId: GAME_ID,
    phase: nowMs < Date.parse(row.betting_closes_at) ? "BETTING" :
      nowMs < resultAt || !settled ? "REVEALING" : "RESULT",
    closesAt: row.betting_closes_at,
    revealAt: row.reveal_at,
    endsAt: row.next_round_at,
    settled,
    outcome,
    commitment: row.commitment,
    proofNonce: settled ? row.proof_nonce : null,
    revealedCards: outcome.groups.reduce((sum, group) => sum + group.cards.length, 0),
  };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(req) });
  const origin = req.headers.get("origin") || "";
  if (origin && !originAllowed(origin)) return json(req, { error: "Origin not allowed" }, 403);
  const path = new URL(req.url).pathname.replace(/^.*\/game32\/?/, "");
  const token = req.headers.get("x-exchange-session");
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return json(req, { error: "Authentication required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json(req, { error: "Backend unavailable" }, 503);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const auth = await db.rpc("game32_auth", { p_token: token });
    if (auth.error) return json(req, { error: "Authentication required" }, 401);
    if (path === "config" && req.method === "GET") return json(req, CONFIG);

    if (path === "active" && req.method === "GET") {
      const material = await newRoundMaterial();
      const ensured = await db.rpc("game32_ensure_round", {
        p_deck: material.deck,
        p_outcome: material.outcome,
        p_commitment: material.commitment,
        p_proof_nonce: material.nonce,
      });
      if (ensured.error) throw ensured.error;
      const state = await db.rpc("game32_read", { p_token: token, p_kind: "active" });
      if (state.error) throw state.error;
      const now = Date.now();
      return json(req, {
        ...state.data,
        // Internal fixed prices have no exchange order book or quoted liquidity.
        quotes: [],
        round: publicRound(state.data.round, now),
        config: CONFIG,
        serverNow: new Date(now).toISOString(),
      });
    }
    if (path === "last-results" && req.method === "GET") {
      const result = await db.rpc("game32_read", { p_token: token, p_kind: "last-results" });
      if (result.error) throw result.error;
      return json(req, { history: result.data });
    }
    if (path === "my-active-bets" && req.method === "GET") {
      const result = await db.rpc("game32_read", { p_token: token, p_kind: "my-active-bets" });
      if (result.error) throw result.error;
      return json(req, { bets: result.data });
    }
    if (path === "my-exposure" && req.method === "GET") {
      const result = await db.rpc("game32_read", { p_token: token, p_kind: "my-exposure" });
      if (result.error) throw result.error;
      return json(req, result.data);
    }
    if (path === "recent-settlements" && req.method === "GET") {
      const result = await db.rpc("game32_read", { p_token: token, p_kind: "recent-settlements" });
      if (result.error) throw result.error;
      return json(req, { settlements: result.data });
    }
    if (path === "place-bet" && req.method === "POST") {
      const raw = await req.text();
      if (raw.length > 4096) return json(req, { error: "Request too large" }, 413);
      const input = JSON.parse(raw || "{}");
      const requestId = req.headers.get("x-idempotency-key") || input.requestId;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId || "")) {
        return json(req, { error: "Valid idempotency key required" }, 400);
      }
      const result = await db.rpc("game32_place_bet", {
        p_token: token,
        p_round_id: input.roundId,
        p_request_id: requestId,
        p_runner_id: input.runnerId,
        p_side: input.side,
        p_stake: input.stake,
        p_odds: input.odds,
      });
      if (result.error) {
        const permitted = /^(Bettor account required|Round unavailable|Betting closed|Invalid bet parameters|Request ID conflict|Betting is disabled|Insufficient balance)$/;
        return json(req, { error: permitted.test(result.error.message) ? result.error.message : "Bet could not be accepted" }, 400);
      }
      return json(req, result.data, 200);
    }
    return json(req, { error: "Endpoint not found" }, 404);
  } catch {
    return json(req, { error: "Game32 service unavailable" }, 503);
  }
});
