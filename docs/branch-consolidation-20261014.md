# Branch review — 14 October 2026

Baseline: `main` at `a61f4b4`. GitHub had 20 branches including `main` at review time. This is a code/history audit, not a claim that every branch's old implementation is safe for production.

| Branch | Result | Reason |
| --- | --- | --- |
| `bpexch1-patch-1` | Already in `main` | Ancestor; zero commits ahead. |
| `codex/video-321552-admin` | Already in `main` | Ancestor; zero commits ahead. |
| `fix/mobile-dashboard-reference` | Already in `main` | Ancestor; zero commits ahead. |
| Both `v0/aliking7826t-1223-*` | Already in `main` | Same ancestor commit; zero commits ahead. |
| `fix/admin-desktop-video-325861` | Merged | Its CSS and import were already byte-for-byte identical to `main`; merge records the ancestry. |
| `feature/bpexch-v2-aws-supabase-20261010` | Merged as isolated staging foundation | Separate V2 schema and AWS template, optional `/v2/status` diagnostics and regression tests. No production backend switch, migration, AWS deployment, or wallet import. V2 still needs its own backend configuration. |
| `vercel/install-vercel-web-analytics-f-hkl4n2` | Selected behavior integrated | The already installed analytics package is now mounted in `App.tsx`. Its stale 7,807-line npm lockfile was not copied into this Bun-based/no-npm-lock checkout. Branch remains divergent. |
| `backend-setup` | Superseded; not merged | July direct Supabase client authentication conflicts with the current server-verified account session. |
| `chore/ai-gateway-kimi-k3` | Unrelated; not merged | Standalone Kimi holiday example and additional SDK dependency do not serve this website's current workflow. |
| `fix/client-dashboard-reference-alignment-20261008` | Superseded; not merged | Earlier dashboard/CSS variants conflict with later mobile changes and remove current reduced-motion and keyboard handling. |
| `fix/company-superadmin-market-permissions-20261010` | Requires backend reconciliation; not merged | Older account/permission Edge API and SQL must be adapted to current session and role authorization before activation. |
| `fix/deploy-2026-06-19-1400` | Superseded; not merged | Old CI, fetchers and RapidAPI integration conflict with current feed and deployment configuration. |
| `fix/live-data-financial-safety-20261010` | Requires separate migration and accounting review; not merged | 82 ahead commits cover older wager, snapshot, demo, hierarchy and AWS implementations. Many files collide with the current transactional exchange backend; direct merge could change real balances, settlement and auth. |
| `fix/passwordless-wallet-session-20261010` | Requires backend reconciliation; not merged | Old wallet session, login, ledger and migration variants overlap the current financial and authentication implementation. |
| `isko-sahi-karo` | Superseded; not merged | May 2026 dependencies, dashboard and deployment files are obsolete. |
| `manual-wallet-deploy-20261003` | Mostly already present; not merged | Eight proposed files are identical to `main`; remaining integration/config differences predate current Supabase and finance flow. |
| `release/hierarchy-bettor-production-20261010` | Mostly already present; not merged | Seven proposed files are identical to `main`; remaining login/header/create-user and old migration variants predate later releases. |
| `vercel/install-vercel-web-analytics-g12yog` | Superseded; not merged | June 2026 analytics/login/deployment changes predate current app and would regress newer authentication. |

The branch count will not fall just because code is integrated; deleting remote refs is a separate cleanup. No remote branch is deleted in this change. Do not apply `supabase/v2` migrations to the existing production project. Review finance/auth feature branches against the current backend and production data before any further merge.
