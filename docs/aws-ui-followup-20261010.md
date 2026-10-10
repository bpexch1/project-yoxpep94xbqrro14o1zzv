# 2026-10-10 — AWS + reference-design follow-up

## Completed on PR #16 review branch
- AWS staging HTTP API and Lambda are deployed at `https://r5vz6m7uhl.execute-api.ap-southeast-2.amazonaws.com`, CloudFormation `BPEXCH-ReadOnly-API-Staging`.
- Direct Lambda health response verified as 200; missing bearer auth 401; financial POST disabled 405; unconfigured markets 503.
- Admin API Diagnostics includes on-demand AWS health check. Vercel `VITE_AWS_API_BASE_URL` is scoped to the review branch.
- The AWS budget `BPEXCH-Account-Monthly-USD10` was **deleted at user request**; there is **no AWS spending cap**. API stage throttling (2 requests/second, burst 5) and CloudWatch 7-day retention remain configured. Charges may still accrue.
- User Dashboard `Inplay` filters only live events; `SportsBook` displays uncompleted fixtures. Sidebar All Sports goes to SportsBook.
- Pending/verified market status remains authoritative: no fake odds, odds open only on freshly verified snapshots. Pre-match verified markets can be open without being in-play.
- Corrected bet slip to send the user-visible stake **and** edited odds to secure RPC validation. Server must reject stale/mismatched prices; no silent repricing.
- Horse/greyhound fixture bars retain their layout but display `Race schedule unavailable` in production instead of invented times. Sidebar race submenu no longer routes to dummy casino feed.
- Frontend market query errors show an explicit unavailability notice rather than implying no fixtures are scheduled.

## Blocking real exchange features
1. Supabase connector currently lists 0 projects. Vercel encrypted environment variables are returned as base64-encoded ciphertext, **not the plaintext URL or key**; cannot validate from the connector response. This is not proof that production environment values are wrong.
2. Current browser login uses legacy username/password/session logic. Secure Supabase Auth account mapping and DB RLS have not been verified.
3. Licensed sports feed, real matching, LAY risk engine, transaction ledger and official result settlement are not provisioned. AWS staging endpoints are read-only and fail closed.
4. Product/UI visual parity with original remains approximate; original service-side code and private logic are not available.
5. No production main merge or production deployment should occur until authenticated end-to-end checks and accounting concurrency tests pass.

## Next integration
- Connect the existing Supabase project to ChatGPT (rather than creating a replacement DB), or supply non-secret project reference and authorize the connector access.
- Verify account mapping and real RLS policies against the actual schema, and migrate login to Supabase Auth.
- Add AWS server-side session verification after genuine Supabase URL and public anon key are available through an authorized source.
- Integrate verified provider data with signed ingestion; only then enable market writes after tests.
