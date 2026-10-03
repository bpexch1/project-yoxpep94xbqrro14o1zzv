# BPEXCH Admin reference analysis and implementation

Inspected 3 October 2026 through the signed-in bpexch.org Admin account. Read-only inspection; no reference transactions or account changes submitted. Account names, balances and credentials are excluded.

## Measured design

| Element | Observed reference |
| --- | --- |
| Header | Fixed, 55px, white, 8px 16px padding, no shadow |
| Sidebar | 200px; minimized 50px; #2F353A; active #3A4248 |
| Navigation | 48px rows, system font 16px, normal weight |
| Main background | #E4E5E6; text #23282C |
| Content padding | 10px 5px |
| Cards | White, 1px #C8CED3 border, 4px radius, no shadow |
| Card heading | #F0F3F5, 4.8px 20px padding, 16px/24px type |
| Card body | 20px padding |
| Tables | 16px/24px type; compact cells 4.8px; account headers 10px 18px, cells 8px 10px |
| Primary buttons | #00B181, white text, 14px, 6px 12px padding, 4px radius |
| Outline buttons | #20A8D8 |
| Action colors | Edit/primary #00B181; success #4DBD74; info #63C2DE; warning #FFC107; outline-danger #F86C6B |
| Small buttons | 12.25px, 4px 8px, radius 3.2px |
| Inputs | White, #E4E7EA border, #5C6873 text, 16px, 4px radius |
| Effects | Sidebar 0.25s; control colors/focus 0.15s; flat cards |
| Footer | 50px, #F0F3F5, Welcome text |
| Desktop breakpoint | 992px |

## Observed screens

Dashboard: user search and two-column sport highlights with match and amount tables.
Users: report tabs, search, credit/cash/downline P&L/users summary, New User and Account Ledger, option legend, account table, entry selector/search/pagination. Columns: Username, Type, Credit, Balance, Client(P/L), Share, Exposure, Available Balance, Options.
New User: Username, Password, Type, IsActive, Phone, Reference and Submit. This Admin account offers SuperMaster and Bettor; this does not establish other roles' permissions.
Reports: Book Detail, Book Detail2, Daily PL, Daily Report, Final Sheet, Accounts and Commission Report navigation. Date inputs and Submit; some report screens also show Print/Excel/PDF and totals. Initial data and dynamic rendering varied; every report state was not exercised.
Current Position and Bet Lock: navigation inspected; initial content did not establish all states or interactions.

## Applied to this project

The owner confirmed that all dealer roles share the same reference design, with only the header username and role changing. Company, SuperAdmin, Admin, SuperMaster and Master use the shared staff AppLayout. The same measured shell/style therefore applies across them while existing role and data rules stay in their application code. Header, sidebar, dashboard, report tabs, tables, controls and footer were updated. A follow-up inspection corrected desktop header order (logo then hamburger then navigation), normal-weight #73818F header links, #00B181 account table banner, and precise small/default button variants. Users now render all nine columns and inline actions on desktop; mobile retains three columns with expandable details. Entry selection and search always appear, with correct empty/page ranges and Previous/Next controls. Scale and drop-shadow action effects were removed. Desktop collapse and mobile drawer behavior are supported, including resizing from collapsed desktop to mobile. Active report tabs now match the selected route. Header displays the existing fetched balance. A missing pagination prop set and missing report import were fixed.

Player pages retain their separate layout. Reduced-motion preferences and keyboard focus styling are supported. No new authorization rules or reference data were copied.

## Limits and validation

Only the reference Admin account was accessible. Company, SuperAdmin, SuperMaster and Master reference screens were not separately verified. Browser credential privacy protection prevented reference screenshots; matching is based on visible DOM and computed style measurements, not a screenshot comparison. Reference responsive CSS was inspected, but a physical mobile viewport was not tested. The project uses a mobile overlay adaptation below 992px. Existing application content and individual screen structures can differ; this is not a verified complete pixel-perfect clone.

Production build passed; lint has zero errors and 13 existing warnings. Isolated React server-render checks passed for desktop nine-column rows/actions, mobile three-column rows, entry/search controls and empty-state ranges. These are structural checks, not browser screenshot or interactive/mobile verification. Existing TypeScript errors in MatchDetail and UserDashboard remain outside this design change. No live deployment occurred: GitHub writes returned integration permission errors and no connected Supabase project/Vercel team was available.

## Applying this update

This archive contains changed files relative to repository HEAD aba94d0787f4e32ef37895b851a02fc9e87c0eae, plus a tracked-file patch. Overlay the files onto that checkout, install dependencies, and build. Do not both overlay and apply the patch. Untracked added files are included directly; the patch alone is insufficient.

The earlier manual cash/credit implementation is included. Read MANUAL_WALLET_SETUP.md before enabling it; its SQL migration and Edge Function still require deployment to the correct Supabase project. Frontend deployment alone does not deploy them.
