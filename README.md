# BPEXCH

Sports trading admin and bettor app: accounts, cash/credit wallets, ledger, and live markets.

Account line: Company → SuperAdmin → Admin → SuperMaster → Master → Bettor.

## Run locally

```bash
npm install
npm run test:wallet
npm run dev
```

`npm run build` also runs the hierarchy, V2, and wallet checks before Vite builds.

Copy `.env.example` to the environment used by Vite. Never put the Supabase service-role key in a `VITE_` variable.

## Wallet rules

- Cash and Credit ledgers stay separate, but a cash withdrawal may use combined available balance (cash + credit + P/L).
- After that withdrawal, issued credit that is covering negative cash cannot be withdrawn again. Doing so would drive combined balance below zero.
- A dealer cash deposit cannot exceed the dealer's own cash. Only Company can issue cash without holding it.
- The browser shows these limits as a preview. `manual_wallet_transfer_session` enforces them again.
- Transfers use the login session (`manual-wallet-session`). The same request id is safe to retry.

Migration `supabase/migrations/20261014224500_fix_wallet_overdraw.sql` is the server half of this rule. It does not change old ledger rows. Apply it to a disposable database and replay deposit, withdraw, insufficient funds, and duplicate request cases before production.

## What this repo does not certify

Browser screens still read and update some account rows directly. Do not revoke those table grants until every screen goes through `exchange-api`. Open draft pull requests overlap; do not merge them on top of `main` without a fresh diff.
