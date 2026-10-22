# TeenPatti Studio round-boundary QA — 21 October 2026

**Status: INCOMPLETE.** This document does not certify demo betting, settlement, wallet reconciliation, mobile parity, or the 19 unavailable games.

## Reproduction and cause

Authenticated production browser showed DemoBettor1018 with 750 available free coins. TeenPatti T20 loaded, counted down, revealed a result, and reset to a new round. A 100-coin bet slip was opened with about 1–2 seconds remaining. The round ended before the browser's separate submit action reached the page. The old slip disappeared on round transition; no accepted bet receipt was observed, and no production bet was placed. This was a missed interaction window, not a proven backend rejection.

The reference recording at R1 01:02 shows a new T20 round with 25 seconds. The existing demo T20 policy is also 25 seconds. Extending it would be an unverified deviation.

The old UI calculated countdown from `serverNow` and React Query completion time, omitting HTTP transit time. On a slow connection it could display more time than remained at the server. This change subtracts the measured full request duration conservatively and explains when a slip disappears because the round advanced. The server cutoff and idempotent bet handling remain unchanged.

## Original-site inspection

- R1 00:56–01:12: T20 uses MAIN and PLUS markets, Player A/B, back/lay cells, matched-bet counter, and a modal with odds adjustment and stake presets.
- R1 00:24: Chicken Road 2 shows a PLAY action, wager input and 2,000/5,000/10,000/25,000 presets. Current browser inspection observed these controls, but no real-money wager was made.
- Original 32 Cards (GameId 9010) remained on Loading in the authenticated cloud browser. Console logs repeatedly reported SignalR negotiation `Failed to fetch` and connection not connected. This is browser-session evidence, not proof of a server-wide outage. R2 01:36–02:00 is the available gameplay reference.

## Verification

- Local TypeScript check: pass.
- Studio engine tests: 7 pass.
- Full local build and all repository test scripts: pass.
- Preview branch: `fix/studio-round-boundary-feedback`, isolated staging Supabase configuration.
- Staging DemoBettor1018: absent. Existing staging QA bettor is a separate synthetic account.
- Authenticated staging bet → Matched Bets → WIN/LOSS/VOID → wallet/ledger: **not yet verified for this commit**.
- Mobile before/after screenshots and gameplay recording: **not yet captured**.
- 19 unavailable games: **remain unavailable**. No generic placeholder is declared complete.

Production data, SQL migrations, Edge Functions and unrelated pages were not changed by this branch.
