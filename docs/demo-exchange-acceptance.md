# BPEXCH Test Lab — acceptance checklist (simulation)

Preview route: `/demo/exchange` (the PR preview only).
**No money, official odds, live feed, production accounts or production database.**

## Interactive acceptance cases
1. **Initial state:** simulated client cash 5,000; example market `OPEN`; separate seeded counterparty offers.
2. **BACK matched:** choose Falcons BACK at 2.16, stake 100; submit. Order is matched, collateral reserved 100, available = 4,900, demo cash remains 5,000 pre-settlement.
3. **Partial match:** after reset, choose Falcons BACK at 2.16, stake 500. Only 350 of the seeded opposite order are available. Matched = 350, unmatched = 150, full 500 collateral is reserved. Cancel unmatched: reserved decreases to 350; matched portion remains.
4. **LAY liability:** after reset, choose Falcons LAY at 2.16, stake 100. Liability = 116, not 100. Opposite side example BACK order matches.
5. **Suspend market:** admin demo status toggled SUSPENDED. New order submission rejects without account or ledger mutation.
6. **Disable betting permission:** toggle client permission off. A new order rejects.
7. **Stake/limit:** stake below 10, above 1,000, invalid odds or available collateral overflow rejects.
8. **Settle example winner:** after BACK 100 at 2.16 is matched, simulate Falcons result. Client gross P/L +116, commission 2.32, net client gain +113.68, example company/agent commission split 1.97/0.35.
9. **Reconcile balances:** across simulated client, counterparty, company and agent, total cash remains 25,000 before/after settlement. No duplicate settlement allowed.
10. **Reset:** returns all simulated accounts, market flags, order book and ledger to the example baseline.

## Automated test
`bun run test:exchange` or `npm run test:exchange`.
The package build script now runs the acceptance assertions before Vite compilation.

## Deliberate limitations
- Matching is exact-price FIFO only. Real exchange price improvement and market-depth semantics are not modeled.
- Authentication and permissions in this sandbox are simulated; they are **not** real access control.
- No authoritative official result, provider feed, payouts, withdrawals or bank transactions.
- P/L commission and 85/15 share are *example configuration*, not independently verified business terms.
- Do not migrate sandbox state into `clients`, `bets` or `transactions` production tables.
- Live betting and real settlement remain disabled until Supabase project access, auth redesign, RLS, licensed feed, integration tests, and legal/compliance checks are complete.
