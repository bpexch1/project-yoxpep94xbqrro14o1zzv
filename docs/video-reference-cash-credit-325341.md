# bpexch.org Cash / Credit walkthrough (original video: 325341.mp4)
Reviewed all 69.57 seconds, vertical 720×1600 at 60fps; representative 1-second frames inspected 0–69.

## Observed chronological workflow
- **0–4s** original `/Accounts/Cash` screen: 2 flat tabs, blue active Cash and green inactive Credit. Single white account summary card, no operator password. Summary columns: Credit / Balance / Max Withdraw. Separate green Deposit and crimson Withdraw cards. Labels Description, Amount (Rs.), Submit.
- **4–6s** switch to Credit. Summary columns Credit limit / account Credit / account Available Balance. Green Deposit Credit and red Withdraw Credit cards, same geometry.
- **6–10s** admin /Accounts/Chart user list with Cash/Credit yellow icon, Edit teal, Ledger cyan and Active green. Selecting cash credit opens account page.
- **11–21s** Cash page, default descriptions like `Cash payment to [parent] from [child]` (deposit) and `Cash payment to [child] from [parent]` (withdraw). Amount starts at 0. No second password field or confirmation modal.
- **22–25s** excessive cash deposit rejected in UI, pink alert `Max cash deposit is 422,602` for this PARTICULAR parent's available cash 422,602. Form resets input to 0. **No transfer success claimed**.
- **27–32s** enter 10,000 cash deposit, press Submit once.
- **33–39s** automatically loads `/Accounts/Ledger`, with Report Filter, start/end date/time, All/Parent/Settlements radio filter, Cash - Account Ledger, 100 entries/page, Print/Excel/PDF, Search, expanding mobile rows. Recorded sample shows Opening Balance 190,000 followed by a +10,000 cash transfer resulting in 200,000.
- **40–46s** return to Cash and enter 10,000 withdrawal. After successful Submit, open ledger.
- **47–52s** Cash ledger includes -10,000 reversal with resulting balance 190,000 (3 rows total: opening/+10k/-10k).
- **53–60s** Cash/Credit tabs again, with initial available funds restored. Unusually high amount stays subject to cap.
- **61–69s** account list with Bettor labels, parent account summaries and familiar compact action buttons.

## UI geometry (approximate relative to 720px captured pixels)
- Base page light grey; summary outer white card x~28..692, internal title at x~61; deposit/withdraw cards x~54..666.
- Top tabs live within the summary white card; blue active rectangular button 290px wide, ~43px high, green inactive text.
- Thin white row table, subtle grey 1px borders, compact ~12px CSS text, ~17px CSS account name.
- Green deposit header ~31 CSS px high, matching action button; crimson/red withdrawal header and button.
- Content form body insets ~18 CSS px; Description, then Amount with grey Rs. prefix, right-aligned Submit.
- No password control or extra authentication card in original mobile recording.

## Implemented in PR #19 (review/staging only)
- Original mobile-aligned account summary, tabs, thin table, compact cards, green/red styles scoped ONLY to Cash/Credit page.
- Descriptions use real parent and child usernames.
- Dynamic cap sourced from operator `cash` for Cash and `credit_remaining` for Credit; oversized amount yields the reference-style pink warning. NO hardcoded 422,602.
- Withdrawal cap read from target's available cash/credit.
- Summary separates `credit_received`, `credit_remaining`, and cash max withdrawal to avoid mixing distinct balances.
- On **confirmed backend success only**, navigate to account Ledger with `?wallet=cash|credit`. No success claims for failed writes.
- Ledger supports wallet filtering and All/Parent/Settlements radio selection; keeps real transaction history, export controls and mobile details. Opening balances are never fabricated from missing ledger events.
- Draft wallet session bridge removes visible administrator password prompt but verifies 256-bit token server-side; no arbitrary client username or role is trusted for transfer.

## Why not merged / production
- Public anonymous database grants/RLS allow direct financial modification; this must be locked down with a replacement authenticated data layer across the whole site. A passwordless UI alone is NOT authorization.
- Edge Function code and new session SQL are staged only. They are not deployed to the production Supabase DB or Edge Function runtime.
- Vercel build-rate limits can prevent the latest build being marked ready. An old READY preview does NOT prove the newest commit. Netlify checks may differ by environment.
- Pixel-perfect parity is not a proven end-to-end browser comparison until the updated mobile preview can be rendered at 360×800 and compared against extracted original frames.
- No real-money deposit, withdrawal or settlement was performed during inspection/testing.
