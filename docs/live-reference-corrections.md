# Live reference corrections — 4 October 2026

Supersedes assumptions in the earlier video-only notes.

- Restored Report Type above Search-Users and its visible card heading.
- Users start with unloaded balances. Load Balance refreshes records, handles failure, and expands mobile details on success.
- Removed the data-dependent component key so polling preserves table interaction state.
- Bettor names remain dark text; staff names are accessible green navigation buttons.
- Desktop report tabs use left alignment, 14px type and 6px/12px padding. Compact mobile wrapping remains scoped to mobile.
- Cash/Credit and Ledger render without staff chrome while retaining the existing AppLayout role guard.
- Cash/Credit active tabs are blue; desktop forms use side-by-side labels and fields.
- Ledger restores five desktop columns, inline date filters, horizontal controls, and 100/250/500/1000 entry options; mobile keeps stacked amounts.
- Desktop dashboard search sizing no longer inherits the mobile minimum height.

Validation: Vite production build passed. App TypeScript check retains the three existing errors in MatchDetail.tsx and UserDashboard.tsx. Visual browser verification of this new code has not been completed; exact pixel parity and full backend feature parity are not claimed. No production financial actions performed. Not deployed.
