# Manual deposit and withdrawal

Both the account Cash/Credit page and modal now call `manual-wallet` instead of directly writing balances. Staff confirm each operation using their existing username account's password; the server verifies its bcrypt hash and database role. Plaintext legacy passwords are deliberately rejected and must be reset to bcrypt before using this feature.

Cash and Credit stay separate. Withdrawals cannot spend the other wallet. The existing funding model is retained: deposits consume dealer credit; cash transfers also move dealer cash. Only the company role is allowed to issue funds without a remaining-credit limit. Cash/credit movement does not settle P/L.

The database verifies the target is below the operator, serializes transfers against current balances and writes the ledger in the same transaction. A request UUID prevents duplicate application when the same screen retries identical details. Failed verification, insufficient funds or ledger failure leaves balances unchanged. New ledger records include the operator, timestamp, before/after balance and request UUID. Passwords are never stored in localStorage or ledger records.

## Deployment prerequisites

1. Apply `supabase/migrations/20261003141624_manual_wallet_transactions.sql` to the same Supabase database used by the website. Run the SQL tests only against a disposable database.
2. Deploy `supabase/functions/manual-wallet/index.ts` as `manual-wallet`. Its `verify_jwt = false` setting is intentional because this website currently has custom username login: the handler performs password reauthentication server-side. The financial RPC itself is executable only by `service_role`; browser/anonymous roles are denied.
3. The Edge Function needs its platform-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never place the service role key in Vite environment variables. Frontend requires its existing Supabase URL and anon/publishable key.
4. Validate a staff deposit, withdrawal, failed password, outsider account, insufficient funds, duplicate retry and ledger record on a staging deployment before release.

## Validation and limits

PostgreSQL-compatible PGlite with the real pgcrypto extension passed the migration and SQL tests for decimal cash transfer, dealer deductions, credit separation, replay prevention, password rejection, outside-downline denial, RPC grants, rate limiting and atomic rollback on ledger failure. This is an isolated database test, not verification of the live Supabase deployment. Transfers take a table lock to keep hierarchy and financial mutations consistent; high-volume systems should migrate to carefully ordered row locks.

Per-operator rate limiting caps requests at ten per minute. Existing clients must have unique, correctly linked username hierarchy records. Username login still needs the broader authentication redesign described in the audit. Other generic entity mutations, public-read policies, odds and bet settlement were not rewritten by this change and are not certified safe. A pending request key is retained while the screen stays mounted; after a network interruption, keep the same screen/details when retrying and check the ledger before restarting the operation elsewhere.

Build passes. Lint retains thirteen existing warnings. Five pre-existing TypeScript diagnostics outside the changed wallet screens remain; the wallet page's missing `cn` import was fixed. The connected Supabase account returned no projects, so the migration and Edge Function have not been applied to a live database.
