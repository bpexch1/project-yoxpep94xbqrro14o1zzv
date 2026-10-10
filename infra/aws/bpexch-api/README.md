# AWS Backend — safe foundation
This is an AWS SAM Node.js 22 Lambda + HTTP API project. It does not create an EC2 instance or database.
**Not deployed.** Requires approval of AWS spend, limits, stack name, exact domain, and an authorized production Supabase project.

## Routes
- `GET /health` : non-sensitive service health and read-only state
- `GET /v1/session`: bearer token verification with existing Supabase Auth (user ID only), not legacy localStorage username
- `GET /v1/markets`, `GET /v1/bets`, `GET /v1/settlement`: 503 until financial services and licensed feeds are provisioned
- All mutation methods: 405

## Deployment checklist (not yet executed)
1. Confirm AWS costs/free-tier credits and set AWS Budget alarms. API Gateway, Lambda and CloudWatch are metered; no forever-free guarantee.
2. Use the existing account region `ap-southeast-2`. Do not repurpose `Openclaw-King` EC2.
3. Validate template: `sam validate --template-file infra/aws/bpexch-api/template.yaml --lint`.
4. Stage tests: `node --test infra/aws/bpexch-api/test/handler.test.cjs`.
5. Deploy with your own authorized AWS credentials using `sam build -t infra/aws/bpexch-api/template.yaml` and `sam deploy --guided` after reviewing CloudFormation cost and IAM changes.
6. Configure exact frontend origin and existing Supabase URL/anon key; do not use service-role key in frontend or chat.
7. Store backend secrets in AWS Secrets Manager / SSM with least privilege before enabling any payment or real wagering.
8. Add domain/CORS and update Vercel `VITE_AWS_API_BASE_URL` only after service health and secure Auth work.
9. Live bets, exposures, order matching and settlement require independent transactional database, idempotency, RLS, compliance review, and integration testing. None is represented as complete here.

The SAM API is currently **read-only** and must not be advertised as an active exchange backend.

## Staging deployment — 2026-10-10 (Sydney)
- AWS CloudFormation stack: `BPEXCH-ReadOnly-API-Staging` — `CREATE_COMPLETE`.
- Health URL: `https://r5vz6m7uhl.execute-api.ap-southeast-2.amazonaws.com/health`.
- REST root: `https://r5vz6m7uhl.execute-api.ap-southeast-2.amazonaws.com`.
- Actual deployed template: `infra/aws/bpexch-api/cloudformation-staging.json` (CloudFormation inline Lambda), with Lambda source duplicated from `src/handler.js`. Update BOTH in future releases, or move to SAM/S3 artifact deploys.
- Vercel preview branch variable `VITE_AWS_API_BASE_URL` is configured only for `fix/live-data-financial-safety-20261010`.
- The admin page `/api-settings` exposes an on-demand **Check AWS Connection** action; there is no continuous polling.
- HTTP API throttles: 2 requests/second, burst 5. The account's Lambda unreserved-concurrency floor prevented per-function reserved concurrency; no reserved concurrency is configured.
- Lambda 128 MB, 8-second timeout; log retention 7 days. No database, server credentials or wager writes.
- AWS Budgets monthly COST threshold: `BPEXCH-Account-Monthly-USD10`. Budgets are *soft alerts*, not hard caps. Email subscribers have not been configured because account primary-email retrieval was denied; request explicit notification email if needed.
- Verified direct Lambda responses: `GET /health -> 200`, unauthenticated `GET /v1/session -> 401`, `GET /v1/markets -> 503`, `POST /v1/bets -> 405`. Public DNS/browser reachability should still be tested externally.
- Prior EC2 Openclaw-King was terminated at the user's explicit direction; do not re-use or revive it.
