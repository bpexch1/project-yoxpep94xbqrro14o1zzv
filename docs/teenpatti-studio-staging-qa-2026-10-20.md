# TeenPatti Studio staging QA report

**Status: staging backend checks pass; overall acceptance is incomplete.** This report records tested behavior and remaining verification gaps. It does not mark untested game parity or browser gameplay as complete.

## Build under test

- Repository branch: `fix/teenpatti-round-state-gameplay`
- Git commit: `336b6e92caddece27dd06937565cf40a63a3b72e`
- Vercel preview deployment: `dpl_88ACwBZ4LzaMnE4HZupYmJQo9gcL` (READY)
- Supabase staging project: `jfqgoqiqbccemecenudq`
- Staging migration: `teenpatti_active_round_and_timing`
- Staging Edge Function: `teenpatti-studio`, version 8 (ACTIVE)

Production Supabase was not changed. The staging test used an isolated synthetic account and free demo coins. Its test bet, settlement and ledger rows were retained; no history or financial records were deleted.

## Test results

| Check | Result | Evidence |
| --- | --- | --- |
| Frontend and server unit/build suite | PASS | `npm run build`: hierarchy 4, V2 foundation 8, wallet/P&L 9, studio 7, accounting 3; Vite production build succeeded. |
| Round-scoped matched bet helper | PASS | Studio unit test confirms pending/matched bets are scoped to the active round while settled results remain separately available. |
| Staging SQL settlement contract | PASS | Authenticated synthetic transaction tested matched bet visibility, settlement clearing, retained history, credit-backed reserve, replay protection, win/loss/void, one settlement ledger entry and upline P/L; transaction rolled back. |
| Staging Edge Function bet-to-settlement flow | PASS (one case) | Placed a 100-coin BACK bet on 32 Cards “Player 8” at 3.85 odds. The accept response immediately included the correct matched bet and round. Tie settled as void; active list became empty; history retained the void bet; available balance returned to 1,000, credit and exposure were 0, and one 100-coin settlement ledger entry existed. |
| Round game setup | PASS (32 Cards case) | Persisted round showed Player 8–11 groups, distinct cards from the 32-card deck, and 20s betting / 10s result timings. Tie outcome matched the displayed result. |
| Browser gameplay and screenshots/video | BLOCKED AT APP SIGN-IN | The authenticated Vercel preview renders the latest BPEXCH login page. The supplied app login attempt was rejected as `Username/Password Incorrect.` No gameplay UI, post-change screenshots, or gameplay recording were captured. |
| Original provider game rules/timings across all games | NOT VERIFIED | The attached upload contains the PRD and developer instructions, but not the referenced `336712.mp4` and `336713.mp4` videos. The short video references also do not establish authoritative rules/timings for every provider game. |

## Scope and limitations

The current implementation keeps the existing demo wallet, credit, exposure, ledger, settlement and multi-level P/L path. The staging end-to-end result verifies one actual Edge Function round and the SQL contract verifies settlement variants in a rolled-back fixture.

32 Cards currently runs an explicitly labeled independent free-coin demo: four cards are dealt from a 32-card deck and highest card wins; ties are void. The timers in the demo engine are policy values by game family, not verified original provider timings. This testing does not establish parity for Chicken Road 2, Aviator, or the other casino games. Those mechanics must not be represented as complete based on this report.

No after-change screenshot or gameplay video is attached. The preview is reachable, but BPEXCH app authentication is still required. The app login must succeed before UI betting, settlement, screenshots, or gameplay recording can be verified.

## Release decision

**Do not mark the requested full correction complete or release-ready.** Backend acceptance for immediate matched bet visibility and settlement/history/wallet reconciliation has staging evidence. Browser UI behavior, before/after screenshots, gameplay recording, and genuine per-game mechanic parity remain open until a valid staging login is available and the reference videos/game rules are verified.
