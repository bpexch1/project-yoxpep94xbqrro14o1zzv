# bpexch.org Ledger + Cash/Credit inspector screenshots — comparison and repairs

User-supplied original browser-inspector screenshots on 10 Oct 2026 show:
- Body `background-color: rgb(236,236,237)`, `color: rgb(33,37,41)`, Roboto Condensed, `font-size:16px`, `font-weight:400`.
- Original page structure `body.app.menu-collapsed > main.main > .container-fluid (padding 0 15px) > .animated.fadeIn`.
- Ledger Report Filter date/time input with date + clock + AM/PM + calendar trigger, and separate `/css/all.css`, `/css/ledger.css`, `datatables.min.css` references.
- `client-locales.js` converts local report dates to UTC; the original also uses moment.js and Tempus Dominus. This is a behavior reference, not a mandate to load jQuery into React.
- The original ledger page contains `popup_report(vid,aid)` that opens `/Accounts/Statements?VID=...&AID=...` in a named 700×500 popup.

Repairs in **draft PR #19 only**:
1. `AppLayout` correctly treats `/Accounts/Cash/:username`, `/Accounts/Credit/:username`, `/Accounts/Cr/:username`, `/Accounts/CashCredit/:username`, `/accounts/cash-credit/:username`, and ledger aliases as standalone pages. No User Dashboard or normal Admin panel layout edits.
2. Scoped standalone and Ledger typography/background/container padding align to the computed reference values. Scoped Cash/Credit styling uses original-style thin white tables and blue/green/red cards; `Roboto Condensed` now applied to standalone pages.
3. `LedgerDateTimeField` recreates the date/12-hour time/AM-PM/calendar composition without jQuery. `ledgerDateTime.ts` validates >= 2026-01-01 and rejects invalid dates and DST-skipped times. On Submit, local date/time becomes ISO UTC and filters use the returned epoch values.
4. Ledger All/Parent/Settlements filters, transaction search, pagination, export, expandable mobile entries, sortable Date/Description/Amount/Balance, and standalone fadeIn with reduced-motion support.
5. Parent filter compares transaction operator with actual client's `parent_username`; settlement filter considers recorded type/description.
6. Existing ledger balances remain recorded values only. No fabricated opening balances or external odds data.

Not yet implemented / release blockers:
- Market Statements popup cannot be correctly populated because current `transactions` table lacks reference `VID`, `AID`, market/outcome IDs, and the `matches` table has zero events. No unsupported `/Accounts/Statements` fake report was created. Requires verified backend record linkage and role-scoped financial API.
- PR #19 includes an unfinished passwordless wallet session bridge. Supabase production currently has permissive anonymous financial table grants and user login bypasses managed Supabase Auth; **do not merge PR #19** until complete authenticated API read/write replacement, anonymous RLS lockdown, account verification, financial concurrency tests, and rollback process.
- Old browser-side wallet's second-password behavior is still deployed to production. No wallet settlement, bet or balance was changed by this design work.
- Vercel deployment is rate-limited; CI/build state must be checked against the **latest commit**, not a previous READY preview.
- Side-by-side pixel parity still requires updated mobile screenshots at reference 411px viewport, currently not certified.
