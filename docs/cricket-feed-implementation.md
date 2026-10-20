# Cricket score feed phase

- Source: CricketData `currentMatches`. The free plan advertises 100 requests/day; the shared database cache refreshes no more often than every 20 minutes under ordinary traffic. Request failures back off for 20 minutes. A provider key must be configured as the `CRICKETDATA_API_KEY` Edge Function secret.
- `cricket-feed` requires an active exchange session. Provider IDs are prefixed `cricketdata:` and displayed on a separate read-only detail route. Score records never carry exchange odds, and the market is always suspended.
- The existing Back/Lay demo market engine remains separate. There is no automatic mapping from a CricketData score ID to an exchange market; mapping by team name would risk settling the wrong event.
- An empty provider response is a valid empty fixture list. A provider error shows a cached snapshot as delayed for up to 24 hours, then fails closed.
- A 20-minute free-tier refresh cannot provide minute-by-minute live scores. A larger licensed quota and a provider contract are needed before claiming that level of freshness or live tradable odds.
- `supabase/migrations/20261020103849_cricket_feed_cache.sql` is server-only and does not change wallets. Deploy migration, set secret, set allowed preview origins, deploy `cricket-feed`, then use a staging test account to verify the real provider response, cache behavior, listing, and detail route. No production keys or balance tests are required for that read-only verification.

## Staging activation check (20 October 2026)

- Isolated Supabase staging project: `jfqgoqiqbccemecenudq`. The `cricket-feed` function and cache migration are present. `CRICKET_ALLOWED_ORIGINS` is configured for the current branch preview origin.
- The dashboard contains a secret named `CricketData.org`; the function requires **`CRICKETDATA_API_KEY`**. Supabase does not reveal saved secret values, so the API owner must enter the key again under the required name in staging's Edge Function Secrets. Do not add it to Vite variables, Git, browser storage, or this report.
- After the secret is saved, use a staging test-account exchange session to call `GET cricket-feed`. Check that the returned `source` is `CricketData`, `oddsAvailable` is `false`, `stale` is `false`, and the cache `fetched_at` advances. Then verify the listing, score and detail navigation in the branch preview. Until this succeeds, the live provider connection is **unverified**.
- CricketData's published terms say commercial use requires purchased credits and an API key. Confirm the provider's terms for this application before any production use.
