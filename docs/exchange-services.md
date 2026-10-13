# Exchange backend services

The browser services use one authenticated Supabase Edge Function (`exchange-api`) and transactional PostgreSQL RPCs. Username passwords are verified on the server with bcrypt; random 256-bit tokens expire after eight hours and are hashed at rest. Tokens are kept in sessionStorage, and browser roles, usernames and balances never authorize a transaction. Existing users must sign in again after this release. Password changes invalidate sessions. Anonymous access to account, bet and ledger tables is revoked.

| Service | Implemented behavior |
| --- | --- |
| marketFeed | Official Betfair catalogue/book adapter, stable event/market/runner IDs, normalized decimal odds and sizes, delayed/stale rejection, persisted quotes |
| realtime | Supabase quote change subscription, reconnect with bounded backoff, offline/online handling, cleanup and visible connection status |
| bettingApi | Atomic server validation, active bettor and market checks, exact price, 15-second freshness, liability reservation, quoted size check, idempotent receipt and scoped status lookup |
| accounting | Scoped cash/available balance, conservative reserved exposure, credit and ledger reads |
| settlement | Authorized market lock, atomic result/void settlement, ledger entries, idempotency, duplicate-settlement rejection; separate atomic P/L-to-cash transfer |
| commission | Versioned rules with actor/reason, per-bet rate snapshot, settlement charge stored alongside realized profit |
| reports | Server hierarchy scope, date/status/match/account filters, bounded queries, CSV export with formula protection and explicit overflow rejection |

## Financial conventions

Cash is available cash. Placement deducts a reserve: back stake or lay stake × (odds − 1), rounded upward to cents for liability. Exposure reports the sum of outstanding reserves, without offsetting opposing selections. Settlement returns the reserve plus realized gross P/L minus commission. Void returns the reserve. Ledger reservation plus settlement reconciles to cash movement. Commission is a configured percentage of each winning bet's positive profit, not market-net profit; the rule is frozen at placement. Existing account rates are migrated to auditable initial rules. Account creation defaults to the existing 2% rate. No upline profit-sharing engine is implied by this commission model.

These are internal platform bets against the platform wallet. A receipt is **not** a Betfair exchange order or proof of exchange matching. The adapter reads prices; it does not call Betfair `placeOrders`. Provider liquidity is checked against the current quote snapshot and local consumption. This is not a guarantee of execution on an external exchange.

Manual result entry is restricted to company/superadmin (with settlement permission for superadmin), requires a locked or provider-closed market, and is audited. Provider result corrections, dead heats, partial wins, external exchange execution, automated result confirmation and legacy-bet migration are not implemented. Legacy pending bets without `exchange_market_id` are deliberately excluded from this new settlement path.

## Provider setup

Configure server-only Supabase secrets `BETFAIR_APP_KEY`, `BETFAIR_SESSION_TOKEN`, and `BETFAIR_FEED_LICENSE_CONFIRMED=true` only after obtaining the appropriate licensed data rights. Never place these in VITE variables. The app key must permit live data; delayed books cannot accept bets. Refresh/rotate the provider session token before expiry. Missing/expired credentials fail closed; they do not enable demo odds. Scorecard and TV providers are separate and currently unavailable.

Authenticated market reads refresh a maximum 40-market batch, at most once per five seconds globally. Official catalogue requests cover football, tennis and cricket MATCH_ODDS markets over the configured seven-day window. There is no unattended scheduler: without viewers, quotes expire and betting stops. Supabase Realtime reports connection to the database, not a healthy external feed; every bet independently checks freshness. A production streaming worker is needed for broader coverage or continuous ingestion. The backend rejects ambiguity when old UI selection names map to more than one market.

## Deployment and verification

1. Apply the additive `exchange_services` migration, deploy `supabase/functions/exchange-api` and the frontend, then apply `exchange_lockdown`. The second migration intentionally revokes legacy anonymous financial access after the compatible frontend is ready.
2. Set `verify_jwt=false` for this Edge Function because it implements custom session authentication; **do not** remove the session check. The service-role key stays inside the function.
3. Run `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`, and the SQL invariant suite:
   `EXCHANGE_PGLITE_ROOT=/path/to/@electric-sql/pglite node tests/exchange-backend.mjs`.
4. Check deployed function authentication rejection and database privileges before enabling feed credentials.

Tests use an isolated PostgreSQL-compatible PGlite database with pgcrypto and synthetic accounts, never live customer balances. Export limits are 10,000 rows/366 days; narrower queries are required when truncated. Server money uses PostgreSQL numeric; UI numbers are display values only. Existing manual-wallet remains a separate password-reauthenticated atomic transfer service. Generic client-side match deletion and financial edits are blocked; provider ingestion and dedicated financial APIs own those writes.
