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