# Commission 2% staging verification — 2026-10-22

## Cause
In production, `DemoBettor1018` has `clients.commission = 2`, while `exchange_commission_rules` had zero rows. The placement RPC selected the latest rule and snapshotted `coalesce(rule.rate,0)`, so every observed Studio bet carried `commission_rate = 0`. Winning bets of gross profit 950 and 18,800 were therefore settled with `commission_amount = 0`.

## Change
- Backfill a versioned rule for each account that has a valid configured commission and no existing rule. Keep existing rules authoritative.
- Change the placement fallback from zero to the account's configured commission for a direct-created account missing a rule.
- Leave already snapshotted and settled bets, cash, P/L allocations and ledger untouched.
- Keep the original gameplay fixture at an explicit 0% rate; add an independent 2% settlement test.

## Staging evidence
Supabase staging project `jfqgoqiqbccemecenudq`: migration applied successfully. Seven rules restored; zero configured accounts remain without a rule; existing synthetic Bettor rule is 2%. RPC still executable by service_role.

A rolled-back SQL transaction placed two 100 BACK bets at 1.95, one with a versioned 2% rule and one exercising the missing-rule fallback. Both captured 2%; each win produced gross P/L 95, fee 1.90, net P/L 93.10, payout ledger amount 193.10, closing cash 1093.10 from 1000, and upline P/L -93.10. The Teen Patti gameplay fixture also passed authenticated win/loss/void, wallet, ledger, and upline checks. Test users, wagers and cash changes were rolled back.

## Production gate
The production database `hbaronayzunrrhzujujy` was read only. Do not back-charge earlier settled bets. Apply the migration after approval, then read back the Bettor's latest 2% rule and verify a newly placed isolated bet snapshots 2%. This change does not establish live provider gameplay or validate all casino games.
