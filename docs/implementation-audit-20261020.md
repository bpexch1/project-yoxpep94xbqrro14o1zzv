# BPEXCH1 implementation audit — 20 October 2026

## Scope and observation

The supplied project brief and ten-page PDF define the requested account,
cricket, exchange, casino, accounting, and comparison workflows. The public
reference redirects to `/Users/Login`; its authenticated dashboard, network
requests, match pages, accounts, reports, and casino were not observable
without an authorized reference account. We did not attempt to bypass login.

At a 1363 × 936 desktop viewport, the public reference login has a centered
blue gradient card, circular mint BP mark, two icon-and-underline fields,
rounded blue login button, and dark patterned background. BPEXCH1's public
login visibly preserves the same main composition. Internal visual parity and
mobile behavior remain unverified against the reference.

## Existing reusable implementation

| Area | Existing code / database | Verification / gap |
| --- | --- | --- |
| React shell and navigation | `src/App.tsx`, `src/pages/UserDashboard.tsx`, account and report routes | Build passes; authenticated browser workflows not yet verified |
| Cricket | DB-backed `Match.list()`, demo quotes, `exchange-api` licensed-feed adapter | New CricketData score read path is separate, with no tradable price; real provider call needs a server secret. Legacy invented fancy/bookmaker prices were removed from the match page. |
| Betting | `exchange_request(placeBet,lockMarket,settle)`, `bets`, `exchange_quotes`, `exchange_audit` | Atomic immediate fills, reserve, Back/Lay settlement, commission, idempotent request replay tested in isolated SQL; unmatched placement and cancellation are not implemented |
| Cash/Credit and hierarchy | `manual_wallet_transfer_session`, `saveClient`, account/share triggers, ledger and reports | Isolated staging SQL suites pass; authenticated UI and concurrency load tests remain |
| Teen Patti Studio | `teenpatti-studio` Edge Function, server-generated outcome, `studio_rounds`, `studio_settle_due`, pg_cron | Round/rule tests and settlement SQL pass; cron active on isolated staging; browser playthrough remains |

## Prioritized checklist

1. **Cricket score phase — code and staging deployment done, live verification pending.** Provider ID mapping, live/upcoming/completed status, score, start time, shared 20-minute cache, stale response, closed/suspended read-only market, and server-only API key are in the feature branch. Configure `CRICKETDATA_API_KEY` on staging, set `CRICKET_ALLOWED_ORIGINS` for its preview origin, then test live/provider failure paths. Licensed odds are absent. Never promote score data as exchange odds.
2. **Betting and settlement — core paths tested, not complete.** Complete unmatched order lifecycle, cancellation, match/cancel races, and automated cricket result ingestion only after a licensed/verified result source and rules exist. Keep cricket score matches suspended meanwhile. Reconcile per-bet P/L, exposure and ledger through the existing wallet.
3. **Account workflows — SQL verified, UI verification pending.** Exercise New User role steps, Load Balance, Cash/Credit, statements, P/L and downline permissions through a staging frontend backed by the isolated project; add concurrency tests around financial operations.
4. **Teen Patti — engine and transaction paths verified, user workflow pending.** Check game selection, cutoff, round history and cron-triggered settlement from an authenticated staging frontend; test repeated and simultaneous requests.
5. **Reference comparison — login observed, protected pages blocked by authorization.** Compare the internal screenshots and behavior only with an authorized reference session or user-provided recordings; preserve current components and avoid proprietary assets.
6. **Migration and deployment gate.** Production has migration-history drift: a version not in the repo and two repo versions not applied there. Reconcile the exact SQL and dependency order before any production migration. No production balances, settlement, main merge, or risky deployment was changed.

## Staging verification

Isolated Supabase project `jfqgoqiqbccemecenudq` has the existing repo schema migrations, cricket cache migration, and demo quote scheduler. Its Edge Functions `exchange-api`, `manual-wallet`, `manual-wallet-session`, `teenpatti-studio`, and `cricket-feed` are active. `teenpatti-demo-settlement` (every minute) and `bpexch-demo-odds-refresh` (every 10 seconds) are active. Three SQL transaction suites passed inside `BEGIN`/`ROLLBACK`; afterwards the two bootstrap fixture accounts remain and the ledger is empty. Cricket cache reads are denied to `anon` and `authenticated` and allowed to `service_role`.

Local gates: TypeScript check and production build passed; lint has zero errors and 11 existing warnings. Cricket normalization 2/2, Teen Patti engine 4/4, accounting validation 3/3, and additional balance tests 9/9 passed. The Vite build reported a large bundle and PDF/XLSX import warnings. These results do not verify an actual CricketData response or a full browser betting journey.
