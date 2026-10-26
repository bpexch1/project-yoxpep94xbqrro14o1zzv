# Integrated fixes — 26 October 2026

Base: production main af2be68212b95912badd5b121660d86df4786466.

## Changes
- Integrated PR 30 security work: remove browser provider credentials/direct diagnostics and persistent account snapshots.
- Integrated PR 39 Accounts responsive typography/layout changes.
- Integrated PR 34 Studio round feedback while preserving newer production lobby, winning amount, slip layout and demo-only labels.
- Removed duplicate session implementation so hook logout follows the shared server logout path.
- Repaired local SQL test runner: multiline cron statements are excluded only in WASM (scheduler unsupported), migrations run chronologically, commission and Studio suites included.
- Corrected wallet regression assertion to check freshness of unsettled demo market quotes; historical settled quotes are allowed to age.

## Verified
- Combined production build passes; TypeScript passes; ESLint: zero errors, 11 warnings.
- Local isolated PostgreSQL: accounting, complete demo wallet, commission, Studio suites pass.
- Hosted security staging jfqgoqiqbccemecenudq: same four SQL suites pass with synthetic rows rolled back.
- Staging pg_cron 1.6.4 exists; no missing extension installation needed.
- Accounting suite covers six roles, parent/child/self guards, shares, QRT006/Javed920, P/L, credit, ledger, audit and exposure.
- Wallet suite covers cash/credit, negative-cash credit-backed withdrawals, overdraft rejection, Back/Lay win/loss/void, idempotency, commission and hierarchy reconciliation.

## Remaining limits
- No authenticated browser login, screenshot pixel parity or mobile wager recording verified in this turn.
- No production database migration, production gameplay test, production deployment or main merge performed.
- Existing PR 27 legacy fixture cannot create Company directly under current hierarchy guard; current complete_demo_wallet suite tests current schema instead. PR 27 remains open.
- Historical exposed RapidAPI credential still requires provider-side revocation/rotation; source removal cannot revoke it.
- Missing provider credentials/licensed Back-Lay feed, cricket result verification and unavailable games remain unresolved. No placeholder mechanics certified complete.
- Local runner does not test scheduler execution; hosted SQL results do not establish browser/API end-to-end behavior.
