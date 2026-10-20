# TeenPatti Studio staging test report · 21 October 2026

**Overall status: INCOMPLETE.** The tested 32 Cards demo round and the existing wallet path passed the checks below. Browser gameplay, the requested before/after screenshots and video, and genuine mechanics for the other listed games remain open. No production merge or deploy was made.

## Sources and build

- Repository: `bpexch1/project-yoxpep94xbqrro14o1zzv`, branch `fix/teenpatti-round-state-gameplay`; existing frontend, Edge Function, migrations and betting engine were extended.
- New reference material: `BPEXCH1_Original_Studio_Videos_Agent_Implementation_PRD_2026-10-21.md` and `BPEXCH1_Original_Studio_Videos_Design_Gameplay_PRD_2026-10-21.pdf`, describing R1 `Screen_Recording_20261015_053509.mp4` and R2 `Screen_Recording_20261015_053747.mp4`. The video files themselves were not available in this workspace for direct playback. In particular, the PRD says settled rows remain visible through ROUND OVER and clear on the next round.
- Isolated Supabase staging project: `jfqgoqiqbccemecenudq`; Edge Function `teenpatti-studio` v9; additive migrations `20261021000100` and `20261021000200`. Production project `hbaronayzunrrhzujujy` was not changed.
- 34 lobby entries are retained: 13 independent free-coin simulations labeled **LIMITED** and 21 unsupported entries labeled **UNAVAILABLE**. No game is labeled READY. Aviator, AviatorX, BlastOff, CricketX and Chicken Road 2 are unavailable for betting because the original cashout/step mechanics are not implemented.

## Executed checks

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Local suite and build | PASS | `npm run build`: 31 tests and Vite build passed; `git diff --check` passed. This does not replace browser QA. |
| Staging SQL fixture | PASS | `supabase/tests/teenpatti_studio.sql` ran inside a rolled-back transaction: authenticated accept, immediate current-round Matched Bets, idempotent replay, win/loss/void, cutoff, 32 Cards staged reveal, ROUND OVER retention, next-round clearing, wallet, ledger, upline P/L, and hidden-outcome access checks. |
| Actual Edge bet and immediate state | PASS | On the longer staging QA round `c5cf2a58-022e-41c1-bd19-17aec90628d6`, request `682657fd-0dbd-4e09-893f-c663914429ad` accepted a 100-coin BACK bet on Player 10 at 3.85. The subsequent Edge `state` response returned the same bet `72f18029-5266-400b-964b-ea25af58d424` in `matchedBets` with `pending` status; available balance moved 900 → 800, exposure 0 → 100. The QA window was extended to 120 seconds solely to observe the state across network latency. |
| Staged 32 Cards reveal | PASS at SQL RPC layer | Three seconds after forced close, only Player 8's card and `8 + 6 = 14` appeared, the other three groups had hidden cards, winner was null, the accepted bet remained visible and exposure was 100. This used server-side QA time manipulation; no browser frame was captured. |
| Win settlement and ROUND OVER | PASS at SQL RPC layer | The same QA round was moved beyond the seven-second reveal; `studio_settle_due()` produced winner Player 10 with totals 14/15/23/22. Same-round `state` returned `won`, P/L +285, balance 1,185, exposure 0, and still included the settled row in Matched Bets. |
| Next round, history and accounting | PASS at SQL RPC layer | After the QA round end, next state returned a new round `7817f3a0-6f16-41fb-b609-512c8f22d849`, zero Matched Bets, historical bet retained, balance 1,185 and exposure 0. Exactly one `bet_settlement` ledger entry existed and the allocated upline P/L totaled −285 for that bet. The earlier live Edge loss case, request `06a9aece-7993-4a50-bd1e-98dadb551302`, also settled once at −100 with one ledger entry. |
| Browser gameplay, screenshots and recording | BLOCKED | The preview reaches the BPEXCH app sign-in, but the available app login was rejected. No authenticated mobile UI state or gameplay video has been captured. |
| Original provider parity for 34 games | NOT VERIFIED | The independent demo uses server-owned outcomes and market quote snapshots. Provider deck composition, ties, schedules and live feeds were not established by the PRD. T20 PLUS market, crash cashout, Chicken step/bust, roulette/wheel chips and the remaining distinct mechanics are still absent. |

## Acceptance coverage

- **Passed in staging:** AT-01, AT-04, AT-06, AT-07, AT-08 and AT-09 for the demonstrated bets and SQL fixture. These are backend results; no browser acceptance is implied.
- **Partial / unverified:** AT-02, AT-03, AT-05, AT-10, AT-11, AT-12 (the observed 32 Cards scoring and reveal case passed, provider tie/deck rules remain unknown), AT-18 (BACK tested, LAY needs staging parity), AT-19 (upline allocation tested, configured commission variations need staging parity), AT-20, AT-21, AT-23, AT-24. There is no complete browser or concurrent workload evidence.
- **Open:** AT-13 through AT-17 where the original game mechanics are absent; AT-22 mobile 360/390/412 screenshots; AT-25 per-game playable audit and user-visible demo video. No missing test is counted as a pass.

## Release decision

Keep the branch in review. The verified backend fixes do not establish complete original-video parity. Obtain an authenticated staging browser session, the original video files and authoritative rules for each unsupported game, implement those mechanics in the existing system, then run the full acceptance suite and capture the requested artifacts before considering production release.
