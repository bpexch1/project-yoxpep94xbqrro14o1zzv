# Production Supabase security audit — 2026-10-10

**Do not execute** the staged SQL while legacy login is active. It would disrupt the existing website.

Verified on existing Supabase project `hbaronayzunrrhzujujy` (ACTIVE_HEALTHY, Mumbai):
- `clients` 6 records; `bets` 1; `transactions` 45; `matches` 0.
- Supabase Auth: **0** users.
- `clients` has a `password` column, and browser-side login fetches it directly.
- Broad RLS policies give `anon` (as well as `authenticated`) SELECT/INSERT/UPDATE on clients; SELECT/INSERT/UPDATE/DELETE on bets, transactions and matches; table grants also include TRUNCATE and other privileges.
- Prior migrations `create_exchange_schema` and `manual_wallet_transactions`; no live verified sports markets or `place_bet_atomic` RPC present.

## Controlled migration steps
1. Set maintenance window and obtain backups/restoration point; inform active account holders.
2. Define server-only credential verification or mapped Supabase Auth identities; preserve all 6 existing client rows, UUIDs, usernames, balances, parent relationships, and all transactions without writing passwords to logs.
3. Remove direct browser password queries, legacy localStorage authorization and front-end role-based access. Introduce server-issued auth session / Supabase Auth and test all staff/client roles.
4. Implement RLS owner/upline policy and scoped read model; audit admin actions, secure wallet RPCs and ledger.
5. After successful staging migration, execute `supabase/migrations/20261010180000_lock_down_legacy_public_access.sql` under an approved production maintenance window. **This migration is not applied.**
6. Validate logged-out users have no account, password, bet or transaction access; verify authenticated role isolation and that all account/ledger rows are unchanged.
7. Only after verified licensed market feed and settlement system are provisioned, assess enabling production wagering.

## Why no instant switch
Grant revocation and policy removal immediately breaks current legacy site. Since `auth.users` is empty, no existing account currently has a tested replacement identity. A migration that silently invents credentials, deletes accounts, or trusts browser role claims would be unsafe.

## Immediate risk
Do not put additional real money or sensitive identity data into this system before remediation. Existing public credentials should be considered potentially exposed pending access-log review and password rotation.
