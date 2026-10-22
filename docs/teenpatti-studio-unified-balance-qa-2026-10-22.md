# TeenPatti Studio unified balance QA · 22 October 2026

**Status: incomplete; draft PR #34 only.** No production database, accounts, balances, or main branch changed.

## Implementation review

- The existing login calls `exchange-api` `login`, stores the exchange session token, and Studio reuses that token. There is no second Studio registration or authentication table.
- Studio `state` reads `exchange_request('account')`; the main site calls the same account action. Both report `availableBalance` from `cash + credit_remaining + pl_downline` for Bettors, plus pending-bet `exposure`.
- Studio `bet` delegates to `exchange_request('placeBet')`. It locks the market and account, validates available balance, reserves BACK stake or LAY liability, persists the request ID, `bets`, a `bet_reserve` transaction and hierarchy share snapshot in one database transaction. Replaying the same request ID returns the prior bet; conflicting reuse fails.
- `studio_settle_due` settles through the existing betting and accounting records. It credits the reserve plus net result on WIN, retains the reserve on LOSS, returns the reserve on VOID, releases pending exposure and records P/L allocations. Existing round/market locks and settled status prevent a second settlement.
- Frontend labels now describe the existing account balance and simulated game outcomes accurately. Smaller stake presets permit testing a 1,000-balance staging account. The server continues to own all odds, deadlines, outcomes and wallet mutations. No extra wallet or ledger was added.

## Executed evidence

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Typecheck, 31 local tests and Vite build | PASS | `npx tsc --noEmit`; `npm run build`. These are code checks, not mobile gameplay. |
| Isolated staging SQL fixture | PASS | `supabase/tests/teenpatti_studio.sql` ran on staging `jfqgoqiqbccemecenudq` in a rolled-back transaction. Added explicit Studio/main-account available balance and exposure equality after reserve and after each WIN/LOSS/VOID settlement. Existing assertions cover immediate Matched Bets, replay, cutoff, one settlement, ledger, upline P/L, 32 Cards staged reveal, next-round active clearing and retained historical bets. |
| Existing staging Bettor reconciliation | PASS, read-only | `qa_studio_edge_mvhaqg8i_bettor`: cash/available 1,385; credit and P/L 0; exposure 0; five historical bets and ten reserve/settlement ledger rows. These predate this change. |
| Staging Edge Function | DEPLOYED | `teenpatti-studio` v14 changes only rules wording; preserves v13 authenticated request and outcome logic. `verify_jwt=false` is unchanged because the function validates its own exchange session token. |
| Browser username/password login | BLOCKED | Staging has no supplied, user-known credential for the existing synthetic Bettor or a privileged parent. A previous browser attempt returned 401 with a different request length than the successful API fixture. We cannot equate those credentials or use a production password in staging. No bypass or credential reset was performed. |
| Actual mobile 32 Cards/T20 bet, result, screenshot and recording | NOT RUN | Requires a genuine authenticated staging browser session. Browser wager submission also requires the user to perform the final action under the browser handoff policy. No gameplay video or after screenshot is claimed. |
| Remaining 19 unavailable games | OPEN | Generic outcome labels do not implement provider-specific controls, crash cashout or Chicken Road step/bust. They remain unavailable. |

## Release gate

Create an isolated staging Bettor through the authenticated `saveClient` workflow and fund its **existing** account through the normal financial service, with a user-controlled password supplied securely in browser handoff. Verify normal preview login, mobile bet placement, settlement, wallet/ledger reconciliation and each game before marking any game complete. Production release requires explicit approval.
