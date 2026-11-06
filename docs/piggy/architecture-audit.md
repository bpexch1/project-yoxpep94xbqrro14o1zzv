# Piggy game: initial audit (feature disabled)

Audited main at 8209b60. Source evidence: supplied 113.68s recording and Piggy_Bank_Video_Analysis_Developer_Report.pdf. It shows three number reels, a special reel, up to three upper bonus levels and stake-specific gates. Original artwork, probabilities, RTP, full feature paths and provider math are not established by that evidence.

## Integration points

* Casino cards: `src/components/user/CasinoSection.tsx`; routes: `src/App.tsx`; existing game page and components: `src/pages/TeenPattiStudio.tsx`, `src/features/teenpatti/`.
* The game API uses `exchangeSessionToken` in `x-exchange-session`, validated by server-side database logic, not a standard Supabase Auth player JWT. `teenpatti-studio` invokes a service-role-only `studio_request` RPC. Piggy must derive identity from this server session, not a supplied user ID or `auth.uid()` assumption.
* `clients` holds cash, credit_remaining and pl_downline. Current Bettor available balance is their sum; exposure derives from pending bets. Placement checks combined balance but updates cash, storing combined snapshots in `transactions`. Existing wallet procedures serialize mutations with a `clients` table lock. Respect established lock ordering.
* `bets` and `transactions` underpin ledger and reports. Placement snapshots hierarchy with `exchange_snapshot_bet_shares`; settlement distributes via `exchange_distribute_bet_pl`, both keyed by a real `bets` row. Simply adding independent round ledger entries would omit reporting and multi-level P/L. Integration requires an explicitly validated representation compatible with those contracts, including commission and rounding.
* `studio_rounds` represents shared timed market rounds; a private per-player slot is not equivalent. Existing RLS denies direct access and grants service role only. Owner-authorized history should be returned via server-session-validated RPC.
* Staging project `BPEXCH1-Security-Staging` is active and has relevant wallet/studio migrations plus later staging-specific migration. No migrations have been executed as part of this change. Confirm function bodies and schema drift before implementing and applying a staging migration.
* Build uses Node built-in tests plus Vite; React, Vite and TypeScript are present. PixiJS and Playwright are not declared. Dependencies must be pinned and installed before use.

## Status and gates

Only pure concatenation, stake gates and checked integer accumulation are implemented. These helpers do not generate random outcomes, determine final payouts, touch the wallet, expose a route, or enable play. The reference doesn't specify weights, award values, conversion from token strings to credit prizes, respin limits, max payout, or full bonus distributions. An original complete math model, exact expected value and simulations must be authored and approved before gameplay activation; no JDB math is claimed here.

Remaining work: design and test transactional exactly-once settlement with session authentication, wallet revision, hierarchy and history; versioned capped RNG model and statistical verification; migration and Edge Function; Pixi renderer and controls; recovery, integration/security and visual tests; staging deployment and reconciliation. Do not treat these helpers as a complete game or production-ready settlement.
