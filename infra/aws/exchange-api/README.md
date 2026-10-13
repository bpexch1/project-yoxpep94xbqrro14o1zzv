# Existing-account exchange API on AWS

This staging Lambda runs the **current production Supabase RPC contract** on AWS. It does not use the separate empty BPEXCH V2 database or import accounts. Login, wallet accounting, bets, settlement, commission and reports continue to be validated by the current database functions; AWS becomes the API execution layer after the preview cutover is verified.

## Build and local checks

The licensed feed adapter is generated from the same TypeScript source used by the Edge Function:

```bash
npm run build:aws-exchange
npm run test:aws-exchange
npm run build
cd infra/aws/exchange-api
zip -j /tmp/bpexch-exchange-handler.zip handler.cjs feed.cjs
```

The Lambda runtime must be `nodejs22.x`. The package contains `handler.cjs` and `feed.cjs` at its root. The CloudFormation stack requires a private artifact bucket in `ap-southeast-2`; never make that bucket public. Template: `cloudformation-staging.json`.

As of 14 October 2026, `BPEXCH-Exchange-API-Staging` is deployed in AWS account `613719615409` (`ap-southeast-2`) at `https://xfb7hm1znb.execute-api.ap-southeast-2.amazonaws.com`. Its private, SSE-S3 encrypted artifact bucket is `bpexch-exchange-artifacts-613719615409-ap-southeast-2`. Live checks returned health 200 with `backendConfigured:false`, financial action 503, and disallowed origin 403. The stack has **no Supabase secret**, so it cannot touch accounts or bets. Its presence does not change the live website.

## Secret and preview configuration

In AWS Secrets Manager, store only a JSON secret with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the **existing production Supabase project**. Optional licensed feed fields are `BETFAIR_FEED_LICENSE_CONFIRMED`, `BETFAIR_APP_KEY` and `BETFAIR_SESSION_TOKEN`. No key belongs in Git, Vercel, the browser bundle or the stack parameters. Set `ConfigSecretArn` to the secret ARN; the Lambda IAM role reads only this secret. Without it, the stage serves health and returns 503 for other actions.

The HTTP API endpoint is `POST /exchange` (`{ "action": "...", "input": {} }`), with `x-exchange-session` for authenticated requests. `AllowedOrigins` must list exact preview/production origins. Enable `VITE_EXCHANGE_AWS_URL` **only for a preview branch** first. There is no automatic Supabase fallback when an AWS request fails, so a pending bet keeps its original request ID on retry.

## Cutover gate

1. Read-only: health, login, existing account, ledger, market availability, reports and role scoping.
2. With an isolated test account and reversible amounts: credit/cash, bet validation, duplicate request ID, settlement, commission and audit entries. Reconcile source-of-truth balances in the existing database. Do not test on customer bets.
3. Confirm CORS, Lambda logs without tokens/passwords, reconnect behavior, error codes and timeout handling on the preview domain.
4. Only after parity, configure `VITE_EXCHANGE_AWS_URL` for production and deploy. Keep the existing Supabase Edge Function available for rollback; switching transport back must not replay financial writes.

This does not move the database to AWS. The separate `infra/aws/bpexch-v2` project is a fresh empty account system and is **not** the production cutover target for existing users.
