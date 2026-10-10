# BPEXCH code corrections & backend integration staging — 2026-10-10

## Target
Repository: `bpexch1/project-yoxpep94xbqrro14o1zzv`. Changes are isolated to this review branch.
Production `main` and live financial data are not modified by these commits.

## Original website scripts vs the existing React stack
- `login.min.js` -> migrate browser-side password checks to Supabase Auth/session and DB-issued role authorization; **NOT COMPLETE**.
- `api-client.js`, `site.min.js`, `bof.js` -> explicit source-validated adapters; original compiled code was not copied.
- Vue/Vuex -> existing React, TanStack React Query.
- `signalr.js` -> `src/services/realtime.ts` and `src/components/MarketRealtimeBootstrap.tsx`. Optional `VITE_REALTIME_HUB_URL`, requires a first-party authorized SignalR hub and Supabase Auth access token.
- User compiled bundle / match detail JS -> existing `UserDashboard`, `MatchDetail`, `FootballMatchDetail`, `TennisMatchDetail`.
- `ReportViewer.js`, DataTables, JSZip/pdfmake -> existing report components and `ExportButtons.tsx` (jspdf/xlsx); report parity and exports not certified.

## Changes made
1. Remove static cricket and football elapsed clocks. Clock displays only when genuine start timestamps exist.
2. Dynamic dashboard event counts, no production default list or fake matched amount/start time.
3. No server-less success acknowledgements for wallet mutation or settlement.
4. Remove production mock odds/score feeds and cricket scoreboard graphics/fancy items based on hardcoded fixture data. Suppress synthetic football prices, sizes, goals markets, and TV availability.
5. Route four betting screens to `src/lib/bettingService.ts`, which requires a valid Supabase Auth session and `place_bet_atomic` PostgreSQL RPC. No more direct `Bet.create` then `Client.update` in those screens.
6. Atomic wager SQL includes server-side fresh provider price check, account row serialization, replay prevention by request_id, bet + debit + ledger in one database transaction, and initially **BACK ONLY**. Other market types are disabled until their liability, commission and odds mappings are implemented.
7. Added signed, timestamped ingest endpoint and database snapshot ingestion RPC. The provider's event ID must match the internal match ID; caller must be service_role. An external licensed feed is **NOT connected**.
8. Connect React Query sports reads to max 15-second-old DB snapshots; added optional first-party SignalR invalidation/reconnect adapter.
9. Profit/Loss defaults to today's PKT date, date selection is validated, report query is date-scoped and paginated, and winning P/L uses stored net profit (not net minus stake).
10. Removed suspicious compiled default API key from `src/lib/apiManager.ts`. **Rotate/revoke it if active**, and remove any other live provider secrets from browser config.

## Blockers before production enablement
- Connected Supabase integration lists **zero projects**. The migrations and Edge Function in this branch are not deployed.
- Existing login uses local username sessions and client-side password hash comparison. Implement secure server authentication, map clients.auth_user_id to auth.users IDs, and enforce RLS. Without it the new bet RPC intentionally rejects wagers.
- Existing RLS/public_clients access must be audited; browser use of `clients` and `bets` must not permit unauthenticated user enumeration or cross-account reads/writes.
- Existing `functions/settle-bets.ts` is legacy MongoDB/Superdev code and was not connected. Settlement UI is fail-closed. Need verified result ingestion and idempotent auditable PostgreSQL settlement before enabling.
- Licensed provider agreement, verified source ID mappings, signed webhook sender, and optional authenticated SignalR hub must be provisioned. Never reuse unauthorized third-party keys or sessions.
- Complete regression and load tests required: concurrent bets, stale price reject, duplicate requestId, insufficient balance, negative exposure, disconnect/reconnect, multi-account isolation, profit calculation, report pagination, timezone, rollback.
- Approval must include latest Vercel preview build/TypeScript checks, DB staging migration/rollback review, and role-by-role UI tests. Vite's `build` script does **not** run TypeScript typecheck.
- No live Vercel production deployment or main merge should occur until the above prerequisites are verified.

## Staging migration order
1. Existing exchange schema migrations, auth tables & RLS verification.
2. `supabase/migrations/20261010130000_atomic_authenticated_bet_placement.sql`.
3. `supabase/migrations/20261010131000_verified_sports_market_snapshots.sql`.
4. Edge Function `supabase/functions/ingest-sports-snapshot`; secret `SPORTS_FEED_SIGNING_SECRET` server-side only. Configure external vendor to sign each JSON payload with HMAC-SHA256 and include UTC `emitted_at`.
5. Verify migrations in staging, roll-forward and rollback plans, then audit business rules.

## What has *not* been claimed
- Production feed parity with `bpexch.org`.
- Confirmed live bets, balance mutation, live settlement or original matching-engine integration.
- Successful Supabase production migrations.
- Exact compiled script identity or CSS/animation parity.
