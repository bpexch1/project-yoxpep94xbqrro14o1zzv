# BPEXCH1 Independent 32 Cards Engine

Game ID `9010` runs through the BPEXCH1-owned `game32` Supabase Edge Function.
It does not call a reference platform, reuse a captured session, or accept a
browser-computed result.

## Rules implemented

- The deck contains the four suits of ranks 6, 7, 8, 9, 10, Jack, Queen and King.
- Player 8, Player 9, Player 10 and Player 11 each receive one card.
- Total = player base number + the ranks of all cards dealt to that player.
- If the highest total is tied, each tied player receives one extra card.
- Extra-card dealing repeats until one player has the highest total.
- If the deck cannot resolve a tie, the round is void and every reservation is returned.
- Betting remains open for 20 seconds. Cards become public one at a time at
  one-second intervals. The result remains visible for six seconds.

These are BPEXCH1's documented independent rules. Exact parity with any
third-party game remains unverified.

## Prices and accounting scope

Back/Lay odds are fixed per runner in `engine.ts` and checked against the same
constants by the database function. They are **not dynamically generated**,
provider prices, an order book, or matched external exchange orders. The API
does not publish an available-liquidity figure for this internal demo game.
The existing Studio label “Matched Bets” means accepted internal bets only.
No hierarchy P/L distribution is performed: the legacy allocator requires
the legacy `bets` table and its allocation rules have not been mapped to
`game32_bets`. Approval of a documented allocation formula, ancestor shares,
rounding, reversals and audit entries is needed before that integration.

## Randomness and recovery

The Edge Function builds the 32-card deck with Web Crypto
`crypto.getRandomValues` and unbiased rejection sampling, then applies a
Fisher-Yates shuffle. Before the round is written, it stores a SHA-256
commitment over a random 24-byte nonce and the complete deck. The nonce is
returned only after settlement. The complete deck, outcome, deadlines and
commitment are persisted in a server-only RLS table, so a restarted function
continues the same round and does not choose another winner.

## API

All routes require `x-exchange-session`. Bet submission also requires the same
UUID in `x-idempotency-key` and `requestId`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/functions/v1/game32/active` | Active round, public cards, timer, wallet, exposure and current bets |
| GET | `/functions/v1/game32/config` | Server rules, timing, runners and round prices |
| GET | `/functions/v1/game32/last-results` | Last 20 settled rounds and reveal proof |
| GET | `/functions/v1/game32/my-active-bets` | Authenticated account's pending Game32 bets |
| GET | `/functions/v1/game32/my-exposure` | Reserved exposure and available wallet |
| POST | `/functions/v1/game32/place-bet` | Atomic idempotent Back/Lay reservation |
| GET | `/functions/v1/game32/recent-settlements` | Authenticated account's last 50 settled bets |

Example bet body:

```json
{
  "roundId": "uuid",
  "requestId": "uuid",
  "runnerId": "10",
  "side": "back",
  "stake": 100,
  "odds": 3.2
}
```

## Wallet accounting

The reservation locks the account row and consumes wallet buckets in this
order: cash, credit remaining, then P/L downline. The bet stores that split.
On a void or win, the reserved principal returns to the same buckets and any
profit is credited to cash. A loss consumes the reservation. Reservation and
settlement each create an append-only shared ledger row plus a Game32 audit row.
The unique `(client_id, request_id)` constraint and locked replay check prevent
duplicate acceptance. A locked round and pending status prevent duplicate
settlement.

Existing hierarchy P/L distribution is built around the legacy `bets` table.
It is not applied to the independent Game32 tables until a reviewed Game32
allocation rule is approved.

## Staging and rollback

Apply `20261107050000_independent_game32_engine.sql`, deploy the `game32` Edge
Function with JWT verification disabled only because it validates the existing
opaque BPEXCH1 exchange session internally, and set `GAME32_ALLOWED_ORIGINS` to
the exact staging preview origin. To roll back before production, unschedule
`bpexch1-game32-recovery`, undeploy the function, export audit/bet history, then
drop the Game32 functions and tables in dependency order.
