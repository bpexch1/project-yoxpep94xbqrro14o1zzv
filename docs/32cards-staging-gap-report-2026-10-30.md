# 32 Cards staging gap report — 2026-10-30

Scope: game 9010 on `fix/32cards-remaining-20261030`, based on production `main` commit `8209b60b279c65a9b37416011ba8e6c82ddf71ad`. PR #42 is already merged in that base.

## Evidence and changes

The supplied PRD V4 measured a roughly 390 × 337 px stage at a 415 px mobile viewport, four 146.5 × 68 px card boxes and 46 × 57 px card wrappers scaled to 90%. The supplied 29-second target recording shows betting open, suspended reveal and round over. It does not show an accepted bet or a ledger reconciliation. The current production page redirects an unauthenticated browser to `/login`, so an authenticated production screenshot was unavailable.

The already merged layout had the compact header, one-row tabs, 50 px timer, 68 px boxes, 46 × 57 px wrappers, market and matched-bets section. This branch narrows the mobile stage to 390 px, the card grid to 301 px (146.5 px per seat with an 8 px gap), and keeps the round status visible at <=420 px. The frontend presents each server-public card in deal order at 450 ms intervals and holds the winner/result until all public cards have appeared. Game 9010's server-owned betting window is changed from 30 to 20 seconds. Other game timings and accounting code are untouched.

## Verification so far

| Check | Result |
| --- | --- |
| 32 Cards deterministic deck, ties, positions, matched-bet lifecycle, sequential reveal and 20-second config | 10/10 local tests pass |
| TypeScript | `npx tsc --noEmit` passes |
| Full build and existing hierarchy, V2, wallet, studio and accounting suites | Pass |
| Production deployment | Vercel `main` deployment at `8209b60` is READY; live page redirects to login without a session |
| Staging backend | Separate Supabase project `jfqgoqiqbccemecenudq`; deployed `teenpatti-studio` v18 with the 20-second config after confirming its only difference from v17 was that one timing value |
| Mobile/desktop Playwright and visual before/after | Blocked: local Playwright Chromium executable absent; browser download returned a truncated archive; authenticated page redirects to login |
| Genuine accepted bet, immediate Matched Bets, wallet/exposure, WIN/LOSS/VOID, ledger, round clearing | Not verified against an authenticated staging bettor session; unit tests cover only deterministic mechanics |
| Gameplay video | Not produced because a real authenticated run was unavailable |

## Remaining acceptance work

Use a staging-only demo bettor account and credit to test a real order, then capture response order ID, state and ledger before bet, after acceptance, after WIN/LOSS/VOID settlement and after the next round. Capture same-size reference and staging mobile views plus desktop, verify the timer/card animation and betting modal with a working Chromium/Playwright executable, and record gameplay. Preview must point to the isolated staging Supabase project; a Vercel frontend deployment alone does not deploy the changed Edge Function timing. Do not merge or deploy production based solely on the local checks.
