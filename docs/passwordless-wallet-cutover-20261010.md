# Staged passwordless Cash/Credit transfer — 2026-10-10

## Report
The original `client-locales.js` supplied by the user is only a jQuery/moment local-time report formatter. It does **not** authenticate or authorize a Cash/Credit transfer.
The user's mobile screenshots show `Invalid administrator credentials` and an unwanted `Your administrator password` box. Existing wallet RPC checks a second password even though the page has a client-localStorage login.

## Review-branch changes (not deployed to production)
- Leave Cash/Credit cards, colors, fonts, input fields, amount table, and overall admin/user layout styles untouched. Remove the extra administrator password box from both the CashCreditPage and CashCreditModal.
- Login invokes **server-side** `bpexch-auth-session`: rate-limited bcrypt hash check without returning password hash to the browser; returns random 256-bit bearer and clean account metadata.
- Opaque token stored in tab-scoped `sessionStorage` with 45-minute expiry; DB stores SHA-256 token digest and password digest. Logout revokes the DB session.
- Wallet operations use token in Authorization bearer header. Service-role-only SQL procedure `manual_wallet_transfer_session` resolves the real operator identity from token, checks role, active account, target downline, balance and transfer idempotency. No caller-provided role/username/password is trusted.
- New separate `bpexch_login_sessions` table has RLS enabled and grants only to service_role. Browser `anon` cannot read or mutate it. No existing client IDs/passwords/balances/ledger rows mutated by the staged migration.
- Edge Functions must deploy with **verify_jwt=false** *because they validate a custom high-entropy opaque session on the server*. Do not confuse this with unauthenticated access. They also validate method, input shape and constraints.

## Mandatory production cutover blockers
1. The live Supabase public `clients`, `bets`, `transactions` and `matches` tables currently allow `anon` broad SELECT/INSERT/UPDATE/DELETE. In particular, `clients.password` is readable through the legacy login path. **Never enable token-based money writes until anonymous financial access is removed and UI read models use secure backend auth.**
2. `auth.users` currently has 0 records. This design is a custom password-auth session bridge, not Supabase Auth. Prefer migrating to managed Supabase Auth over retaining a custom token architecture long term.
3. Stage a reversible maintenance window with backups; migrate existing staff/client reads, wallet ledger and hierarchy DB access to verified identity before revoking legacy RLS. Test re-login, side-menu/admin access, two simultaneous transfers, retries, expiry, revocation, wrong client, client cannot transfer and all transaction sum invariants.
4. Ensure `Admin1` (current screenshot) has cash=0 and credit_remaining=0. Do not invent credit, silently transfer funds, or claim an amount was deposited unless the RPC commits.
5. Inspect actual original cash/credit screen/video before claiming 99%/pixel-perfect visual parity. The timezone script provides no evidence about wallet card styling.

## Validation
Run `npm run test:wallet-session` and `npm run build` on the review branch. These are contract/build tests, not end-to-end financial security certification.

Production `main`, Vercel domain and Supabase DB are deliberately unchanged by the current passwordless draft.
