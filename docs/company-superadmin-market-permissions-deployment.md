# Company → SuperAdmin and Market Permissions deployment

## Branch scope

* `/accounts/create`: account roles are derived from the signed-in parent's role:
  Company → SuperAdmin/Bettor; SuperAdmin → Admin/Bettor; Admin → SuperMaster/Bettor;
  SuperMaster → Master/Bettor; Master → Dealer/Bettor; Dealer → Bettor.
* Account creation requires the parent's **current password** and goes via the `admin-accounts` Supabase Edge Function. The server RPC independently verifies the actor, requested role and downline share.
* `/bet-lock`: load and save the account's market permission preferences on the server after password confirmation. Reauthentication is required before saving; unchecked markets are stored as not allowed.

## Deployment order — required for a working site

1. Identify and back up the production Supabase database. Confirm it is the project referenced by the Vercel `VITE_SUPABASE_URL` setting.
2. Inspect and apply migration `20261010100000_admin_accounts_market_rules.sql` to that Supabase project. It adds `admin_create_downline`, permissions RPCs and `market_is_allowed`. These functions grant execute only to service_role.
3. Deploy `supabase/functions/admin-accounts/index.ts` as `admin-accounts`. This particular Edge Function uses **custom username/password authentication**, so deploy with JWT verification disabled *for this function only*; all requests are rate limited, verified again in Postgres, and require the current password. The service-role key must stay **server-side**, never in Vite/Vercel public environment variables.
4. Test on a staging environment: Company creates SuperAdmin, cannot create SuperMaster; SuperAdmin creates Admin; invalid actor credentials and excess share are denied. Test market Load/Save/Reload, wrong password, rate limits.
5. Merge the branch, confirm the Vercel production deployment, then retest with the real Company account.

## Limitations and security requirements

**A successful market settings save does NOT independently disable live wagering yet.** The trusted server-side bet placement transaction must call `market_is_allowed(client_username, actual_category, actual_market)` before any balance deduction or bet insert. The *actual* market must be derived from trusted event/market IDs, not the browser's choice of category. If a backend cannot validate it, deny the bet. The current browser code contains direct `Bet.create` / `Client.update` placement paths, and those must be replaced with an atomic, authenticated server bet API before enabling live betting.

Current legacy localStorage sessions are not cryptographic proof of login. The Edge Function therefore never trusts clientSession role or parent username alone. Existing plaintext account passwords, if any, require a reviewed bcrypt migration before these privileged RPCs can authenticate them.

The old optional `NewUserModal` and `CreateCompanyAccount` components still use direct entity creation and must not be exposed as alternative privileged account-creation routes. They need consolidation onto the same verified backend service. Keep the database clients insert policies restrictive.

This branch is **not safe for production merge** until the database migration and Edge Function are deployed and the staging tests pass.
