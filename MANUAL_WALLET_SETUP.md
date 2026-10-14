# Manual deposit and withdrawal

Cash and Credit screens call the `manual-wallet-session` Edge Function. The operator is taken from the existing login session (`x-exchange-session`). There is no second password box. The function checks the session with `manual_wallet_transfer_session`, then writes the ledger in the same transaction.

Cash and Credit stay in separate ledger rows. A cash withdrawal may use combined available balance (cash + remaining credit + downline P/L) and can leave cash negative while credit stays issued. A later credit withdrawal cannot take that pledged credit: combined balance is not allowed to go below zero. Credit withdrawal also cannot exceed remaining credit.

Dealer funding:

- Credit deposit still consumes the operator's credit, except Company.
- Cash deposit moves the operator's cash and does not touch their credit. If the operator is not Company, the deposit is rejected when their cash is lower than the amount.
- Cash and credit movement does not settle P/L.

The database checks that the target is in the operator's downline, locks the client table, and stores a request UUID. Repeating the same request returns the original ledger row. A different transfer with that same UUID is rejected. A failed check leaves balances unchanged.

Passwords are not sent by this flow and are not written to the ledger.

## Apply the latest rule

1. Review `supabase/migrations/20261014201000_cash_credit_reference_329811.sql` (already the previous function) and `supabase/migrations/20261014224500_fix_wallet_overdraw.sql`.
2. Apply `20261014224500_fix_wallet_overdraw.sql` on a disposable database first. Do not run it against production until the cases below pass there.
3. `manual-wallet-session` must stay deployed with `verify_jwt` suitable for the custom session header. The RPC itself is granted only to `service_role`.
4. The function needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the function environment only.

## Cases to replay before production

- Bettor: 50,000 cash + 50,000 credit + 1,007 P/L, withdraw 100,000 cash, credit remains 50,000, combined available is 1,007.
- That same account then rejects a credit withdrawal above 1,007.
- SuperMaster: 10,000 cash + 50,000 credit withdraws 60,000 cash, then cannot withdraw the 50,000 credit while combined available is 0.
- Dealer with less cash than the deposit amount is rejected. Company is not.
- Wrong session, outside downline, disabled target, and a repeated request id do not double-post.
