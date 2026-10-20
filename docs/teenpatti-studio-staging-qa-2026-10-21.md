# BPEXCH1 TeenPatti Studio — staging QA and incomplete work
Date: 2026-10-21. Scope: **free-coin demo only**. Status: **PARTIAL IMPLEMENTATION — NOT RELEASE-READY**.

## Repository and test environment
- Main branch inspected at commit `0a2fbea79261020ea19f2af2d4efc86f76e5a12a`.
- Changes are isolated on `fix/teenpatti-current-round-bets-20261021`; **not merged into main or deployed to production**.
- Preview build: Vercel `dpl_VbVrMPZj5YUi5yx7jPMXfsJYPHcY` from `8e6fa50...`, READY. Subsequent commit only expands SQL QA tests.
- Isolated staging database: Supabase project `BPEXCH1-Security-Staging` (`jfqgoqiqbccemecenudq`). Its existing `studio_request` RPC already returns `matchedBets` (current round only); this is now preferred by the frontend, with fallback to client-side filtering for earlier deployments.
- The PRD comparison is based on 336712.mp4 and 336713.mp4 and screenshots embedded in the supplied 12-page report. Their full original/provider rule documents are not available here.

## Implemented in this branch
1. **Current-round matched bets**: Game displays only matching round ID with pending/matched status. My Bets retains history, including settled losses. Active heading is computed from same filtered data.
2. **Accepted receipt**: After server returns a wager with `id`, prepend its row to the query cache without creating a second bet, then refetch. Unconfirmed requests continue to reuse their session-stored request ID.
3. **Settlement display**: On server-reported status change, display brief WON/LOST/VOID/P-L notice; remove settled rows from the active table but keep history. Order ID, round ID and BACK/LAY side are shown.
4. **32 Cards demo UI**: Player labels 8,9,10,11 and win/lose/void visual verdicts added. It **still does not implement verified original 32-card mechanics or runner-specific odds**.
5. Scoped CSS only in TeenPatti Studio, no changes to shared dashboard/login/wallet code.
6. Added pure regression filter tests and repaired/enlarged existing SQL QA fixture.

## Evidence and test statuses
| Check | Result | Evidence or qualification |
|---|---|---|
| Vercel preview build | **PASS** | READY; Vite built output. Existing build tests ran; warnings about chunk size and dynamic jsPDF/xlsx imports are non-blocking. |
| Backend accepted bet appears in `matchedBets` | **PASS (staging SQL)** | SQL assertion verifies bet ID and round ID, count=1, after accepted server receipt. |
| Settled bet removed from `matchedBets` | **PASS (staging SQL)** | SQL assertion count=0 after server settlement. |
| Settled bet retained in history | **PASS (staging SQL)** | Query verifies same bet ID in `bets` with won/lost/void status. |
| BACK and LAY reservation + win/loss/void math | **PASS (staging SQL)** | 6 synthetic scenario combinations, liability and expected P/L assertions. |
| Duplicate request replay | **PASS (staging SQL)** | Same request ID returns same bet; no second reserve. |
| Cutoff bypass prevention | **PASS (staging SQL)** | Direct exchange API bet after deadline rejected. |
| One ledger settlement and upline allocations | **PASS (staging SQL)** | Single settlement row per wager; sum of allocated P/L equals negative net bettor P/L. |
| Staging test residual data | **PASS** | All synthetic QA writes executed in a transaction and rolled back. No production finance data changed. |
| Frontend active row on Android without refresh | **NOT VERIFIED** | Preview build is not a browser-interaction test. |
| Before/after screenshots (360/390/420px) | **NOT CAPTURED** | No authenticated browser session/screenshots produced in this run. |
| End-to-end gameplay recording | **NOT CAPTURED** | No recorded UI bet→result→history session. |
| Per-game lifecycle timers and crash/chicken cashout | **FAIL / NOT IMPLEMENTED** | Existing universal 20-second betting + 10-second results and prediction placeholders remain. |
| Genuine reference game mechanics and feeds | **NOT VERIFIED** | Full provider-authorized gameplay rules/timings and feed absent. |
| Two-tab/multiuser UI race and disconnect tests | **NOT RUN** | Separate browser automation required. |
| Non-studio visual regression | **NOT RUN** | Isolated source diff and successful build only, no screenshots. |

Staging SQL test file: `supabase/tests/teenpatti_studio.sql`. Regression test: `tests/teenpatti-active-bets.test.mjs`. Neither is a substitute for live Android UI testing.

## Remaining release blockers
- Replace hardcoded global round timing with server-owned, authenticated, **verified per-game** lifecycle configuration and transition tests. Do not invent timings from short videos.
- 32 Cards: verify authorized dealing rules, runner probabilities, odds, phases, and settle/reveal against reference; independent four-runner high-card demo is **not authentic parity**.
- Chicken Road 2: genuine player-controlled progression, hazard resolution, cashout API with exactly-once wallet settlement and bust behavior.
- Aviator, AviatorX, BlastOff, CricketX: server-run multiplier/crash state, pre-bet windows, atomic cashout, latency/replay tests and verified math.
- Validate the remaining individual game families, their art, odds and settlement policy; retain clear independent-demo labeling or disable when appropriate.
- Verify refresh/reconnect, two tabs, simultaneous users, credit/cash/exposure, admin shares and settlement chronology in browser-connected staging.
- Deliver Android before/after screenshot pairs and captured end-to-end gameplay video; do not mark any unresolved AT-01..AT-18 item completed.

## 34-game catalog audit (current main engine plus changes)
**NOT RUN** in the last column means no individual end-to-end browser gameplay was verified in this task. All existing outcomes are server-side **independent simulations**, not licensed provider results.

| Game ID | Name | Kind | Mechanics status | Individual UI E2E |
|---|---|---|---|---|
| 9301 | Chicken Road 2 | arcade | BLOCKED: route prediction only; no GO/step/cashout engine | NOT RUN |
| 9022 | Aviator | crash | BLOCKED: multiplier-band prediction; no crash cashout engine | NOT RUN |
| 9040 | AviatorX | crash | BLOCKED: multiplier-band prediction; no crash cashout engine | NOT RUN |
| 9023 | BlastOff | crash | BLOCKED: multiplier-band prediction; no crash cashout engine | NOT RUN |
| 9100 | CricketX | crash | BLOCKED: multiplier-band prediction; no crash cashout engine | NOT RUN |
| 9035 | Dream Catcher | wheel | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9001 | TeenPatti T20 | teen | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9005 | TeenPatti ODI | teen3 | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9030 | Auto Roulette | roulette | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9006 | Muflis TeenPatti | muflis | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9021 | Poker | cards | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9015 | Sic-Bo | dice | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9002 | AndarBahar | andar | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9003 | HiLo | hilo | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9007 | 7UpDown | seven | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9008 | Ammar Akbar Anthony | cards3 | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9009 | Super Over OneDay | sports | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9011 | Super Over T20 | sports | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9010 | 32 Cards | cards4 | PARTIAL: Player 8–11 labels/results; authentic 32-card rules/odds NOT VERIFIED | NOT RUN |
| 9012 | Bollywood Casino | cards3 | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9016 | Race To 17 | sports | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9017 | High Card | cards | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9018 | Casino War | cards | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9019 | Lucky 7 | lucky | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9020 | Center Card | hilo | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9045 | TRIO | cards3 | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9050 | TRAP | cards | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9055 | One Card 20-20 | cards | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9065 | Queen Race | cards3 | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9070 | Dus Ka Dum | hilo | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9075 | Side Bet city | dice | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9080 | Lottery | lottery | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9085 | Heads & Tails | coin | Independent simulated round; reference parity UNVERIFIED | NOT RUN |
| 9105 | Fortune Gems | slots | Independent simulated round; reference parity UNVERIFIED | NOT RUN |

## Release gate
**DO NOT MERGE** this branch into `main` or label "ALL DONE" until the remaining mechanics and real staging browser/regression evidence meet PRD acceptance criteria. Production wallet balances, account IDs, historical bets and ledger records must remain untouched.
