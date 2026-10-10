# Role hierarchy / authentication cutover (staged)
The admin and user panel styles, layouts, classNames and route URLs are intentionally unchanged.
Frontend CreateUser displays the single allowed child-role option, using `src/lib/accountHierarchy.ts`.
Rules: Company → SuperAdmin → Admin → SuperMaster → Master → Bettor. Dealer is removed.
Existing database role `client` is a legacy alias displayed as `Bettor`; old rows remain untouched. New accounts use the canonical database role `bettor`.
`tests/account-hierarchy.mjs` exercises the full chain and all forbidden role hops.
Important: frontend checks are UX only, not server authorization. Current public DB grants/RLS can be bypassed using REST requests.

**Unapplied migration:** `supabase/migrations/20261010183000_account_hierarchy_auth_link.sql`
- Adds nullable `auth_user_id` FK to managed Supabase Auth without altering existing 6 clients, balances or transaction rows.
- Rejects insertions not aligned with the immediate parent role; rejects direct role/reparenting updates; leaves financial values unchanged.
- Does not create/convert any Auth users. No sessions are issued by this migration.
- Cannot safely apply before trusted account-creation API and Supabase Auth migration. Existing Company-creation UI must be restricted to trusted bootstrap/provisioning.
- Any account management must use authenticated and permission-scoped backend RPC with a verified identity, a server-checked ancestry path, immutable audit entries and a tested rollback plan.
- The generic `Client.create()` REST write and localStorage role check are insufficient for authorization.
- Existing `clients.password` must stop being publicly SELECT-able before production login is considered secure; migration prepared in earlier security document must be scheduled with replacement login ready.
- No CSS or visual component changed. CreateUser's radio option is role-driven; role labels/redirect conditions now use Bettor. The component CSS, card structure and styling were not changed.

**Production safety:** Not deployed to Supabase because Auth has zero users and current browser login relies on anonymous select of password fields. Database lockdown before migrating sessions would block all existing accounts.

## 2026-10-10 role adjustment
- Removed Dealer from the six-role account-creation chain, admin UI authorization list and displayed role lists.
- `Master` can create `Bettor` directly; `Bettor` has no child-account permissions.
- Legacy `client` and `user` roles normalize to `Bettor` for routing and display only, not new account creation.
- Unapplied SQL hierarchy migration now requires the child of `master` to have role `bettor`.
- This review branch does not change existing `clients.role` records, database balances or transactions. A future production cutover must update/review the deployed manual-wallet RPC's legacy dealer authorization list and revalidate the actual account tree before enabling any new account creation.
