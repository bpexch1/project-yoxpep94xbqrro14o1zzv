# BPEXCH V2 — isolated AWS + Supabase foundation

## Provisioned on 2026-10-10 (confirmed by user)
- **NEW V2 Supabase project:** `BPEXCH-V2`, ID `xnmzkoczfrnjfdoxvdlz`, region `ap-southeast-2`, status `ACTIVE_HEALTHY`, organization `bpexch1's Org`.
- Cost was quoted `$0/month` for this project on the organization Free plan; overage or external AWS costs are separate.
- Applied migration **successfully**: `bpexch_v2_fresh_auth_hierarchy_wallet_ledger` (version `20261010145431`). All 5 `v2_*` tables created, RLS enabled; there are **no grants** to `anon` or `authenticated` for these tables. Service-role-only wallet and login functions confirmed.
- Validated fresh state: 0 profiles, 0 wallets, 0 transfers, 0 ledger entries, 0 Auth users.
- OLD project `hbaronayzunrrhzujujy` is unchanged: 6 client accounts, 58 transactions and 1 bet at last audit. The V2 schema must never be reapplied to the old project.
- Security advisor reports five informational `rls_enabled_no_policy` findings; expected for intentional deny-by-default service-only V2 tables. <https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy>
- **AWS V2 not yet deployed or connected.** Existing read-only AWS staging stack remains in place. Need controlled AWS Secrets Manager setup and approval of potential pay-as-you-go AWS charges before new AWS resources are provisioned. Don't paste service-role keys in chat.

## Scope and operational state
- New feature branch from `main`. **No production domain change. NEW Supabase migration applied to V2 ONLY; no AWS V2 CloudFormation stack created.**
- Existing BPEXCH Admin/User dashboard routes/components/styles preserved, with only a separate `/v2/status` diagnostic route added.
- Old production Supabase (`hbaronayzunrrhzujujy`) and its accounts, bets and transaction history **unchanged**. NEVER run these new migrations there.
- Fresh V2 project starts with **zero identities, zero wallets, zero financial transfers**. All wallets start at 0. Never fabricate or import balances.
- V2 role chain: `company -> superadmin -> admin -> supermaster -> master -> bettor`. No dealer. Server derives permitted child role from verified Auth identity.

## Provisioning gates
1. **Completed:** User confirmed organization and $0/month quoted cost, new project `xnmzkoczfrnjfdoxvdlz` created and V2 schema migrated. Do not create another project. **Free Supabase allowance and AWS pay-as-you-go usage are not hard cost ceilings.** AWS Budget had been explicitly deleted at user request; do not restore without permission.
2. **Completed:** New V2 Supabase is located in Sydney (`ap-southeast-2`) beside existing AWS staging. Old project retained unchanged; do not delete financial records without reviewing retention obligations.
3. **Completed:** `supabase/v2/20261010_01_secure_fresh_schema.sql` successfully applied using `apply_migration` ONLY on V2 project.
4. Provision new **Company** identity securely using Supabase Auth admin dashboard/operator-only bootstrap, then insert matching `public.v2_profiles` row with `role='company'`, `parent_id=null` under trusted service-role admin access. Do not create a public bootstrap route or embed an initial password.
5. For production, require verified recovery email for Auth identities, MFA for privileged staff, server-side login rate limiting/WAF, password reset procedures, audit and access logging, disabled open public signup, and recovery testing.

## AWS V2 staging infrastructure
- Source: `infra/aws/bpexch-v2/src/handler.cjs`.
- Template: `infra/aws/bpexch-v2/cloudformation-staging.json`.
- Use Node.js 22 and a ZIP containing `handler.cjs` at archive root, upload to a private S3 bucket in `ap-southeast-2`. CloudFormation accepts `PackageBucket`, `PackageKey`, `ConfigSecretArn`, and `AllowedOrigins`.
- Secret in AWS Secrets Manager: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Restrict Lambda IAM `GetSecretValue` to exactly this secret ARN. Never commit, print or pass these secrets to the frontend/Vercel client.
- Prior legacy AWS stack `BPEXCH-ReadOnly-API-Staging` remains running and untouched; the new V2 stack is isolated.
- Until secret configured, `GET /v2/health` reports `backendConfigured:false`, other V2 operations return HTTP 503.
- Gateway throttled 2 req/sec burst 5; 7-day CloudWatch logs. This **is not a hard AWS spending cap**. Costs are incurred on use/storage.
- For AWS integrations use direct HTTPS calls via Lambda backend. Frontend Vite env `VITE_V2_API_BASE_URL` is a non-secret API URL, assigned to preview target first, never implicitly to production.

## V2 API contract
- `GET /v2/health` (no secrets; staging mode)
- `POST /v2/auth/login` takes `{username,password}`; DB login-attempt throttle, username lookup, then Supabase Auth verified password, returns Auth JWT. No login via browser-supplied client role or plaintext DB password.
- `GET /v2/me` returns verified identity + own wallet.
- `GET /v2/accounts/children` lists up to 100 direct children after permission checks.
- `POST /v2/accounts` requires valid JWT, username, email, password and display name. AWS derives `role` and `parent_id` from authenticated user; creates Auth account, inserts guarded profile; attempts Auth account rollback if profile insert fails. No public Company bootstrap.
- `POST /v2/wallet/transfer` requires JWT and `requestId`, target direct-child UUID, wallet cash/credit, deposit/withdraw, amount string with <=2 decimals and description; server derives actor UUID, invokes atomic DB RPC.
- `GET /v2/ledger?accountId=...&limit=...` permits own/direct child ledger reads only.
- All underlying public V2 tables have RLS enabled, anon/authenticated grants revoked; only service-role backend has restricted table reads and RPC execution.

## Financial behavior & known blockers
- Atomic parent/child movement uses 2 opposing ledger entries. Deterministic row locking, non-negative wallet constraints, arithmetic CHECK, request UUID idempotency and immutable ledger trigger.
- There is intentionally **no open funding/minting endpoint**, no initial company balance and no accepted live bets or settlement endpoint. Funds cannot be moved from an unfunded company.
- No real-money betting, settlement, credit creation, payout processing or production WAF/verified provider integrations until licensed operator policies and comprehensive end-to-end tests are met.
- User Dashboard design is intentionally preserved, but it still uses legacy backend services: switching production to V2 requires a complete adapter cutover for login, account lists, reports, realtime feeds and ledger; DO NOT redirect live production while old direct-Supabase writes remain.
- Auth JWT is temporarily held in **tab memory only** by the V2 client adapter. After a reload the operator must sign in again; never put the refresh token in localStorage. Future production custom domain can use HttpOnly SameSite Secure refresh cookies with CSRF checks.

## Required validation before user-visible release
- Run `npm run test:hierarchy`, `npm run test:v2`, `npm run build`.
- Exercise Lambda without a configured secret (health and fail-closed routes).
- On the fresh test database, test hierarchy, 0 starting accounts, permissions, account creation, login throttling, invalid/revoked tokens, credit/cash transfer and idempotency, simultaneous writes, immutable ledger, and rollback on failed user provisioning.
- Confirm all old user/admin dashboard views remain unchanged at 411×911 and wider viewports.
- Verify Supabase security advisor and ensure anon/authenticated REST cannot SELECT passwords/financial records or mutate wallets/ledgers.
- Only then selectively migrate frontend routes in small reviewed PRs and schedule protected production release.

## Deployment example (after secure user/org confirmation)
```bash
cd infra/aws/bpexch-v2/src
zip -j /tmp/bpexch-v2-handler.zip handler.cjs
aws s3 cp /tmp/bpexch-v2-handler.zip s3://YOUR_PRIVATE_STAGING_ARTIFACT_BUCKET/v2/handler.zip --region ap-southeast-2
aws cloudformation deploy --region ap-southeast-2 \
  --stack-name BPEXCH-V2-API-Staging --capabilities CAPABILITY_IAM \
  --template-file ../cloudformation-staging.json \
  --parameter-overrides PackageBucket=YOUR_PRIVATE_STAGING_ARTIFACT_BUCKET \
   PackageKey=v2/handler.zip ConfigSecretArn=YOUR_APPROVED_SECRET_ARN \
   AllowedOrigins=https://bpexch1.com
```
No credentials are stored in source code. Do not paste real keys in chat.
