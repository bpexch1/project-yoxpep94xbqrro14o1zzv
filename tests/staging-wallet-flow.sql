-- Wallet / ledger / bet-settlement integration test.
-- ONLY for a disposable, independently provisioned Supabase staging database.
-- Intended invocation: PGOPTIONS="-c app.wallet_staging_test=confirmed" psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/staging-wallet-flow.sql
-- Never supply either existing project (hbaronayzunrrhzujujy or xnmzkoczfrnjfdoxvdlz).
-- This script rolls back ALL fixture rows, and deliberately fails closed if staging guard is absent.
BEGIN;

DO $wallet_test$
DECLARE
  guard text := current_setting('app.wallet_staging_test', true);
  operator_name text := 'stga_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  bettor_name text := 'stgb_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  outsider_name text := 'stgo_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  operator_id uuid;
  bettor_id uuid;
  outsider_id uuid;
  operator_token text := encode(extensions.gen_random_bytes(32), 'hex');
  bettor_token text := encode(extensions.gen_random_bytes(32), 'hex');
  cash_deposit_id uuid := gen_random_uuid();
  cash_withdraw_id uuid := gen_random_uuid();
  credit_deposit_id uuid := gen_random_uuid();
  bet_request_id uuid := gen_random_uuid();
  settle_request_id uuid := gen_random_uuid();
  exchange_match_id uuid;
  exchange_market_id text := 'wallet-test-' || replace(gen_random_uuid()::text, '-', '');
  exchange_bet_id uuid;
  result jsonb;
  available numeric;
  cash_balance numeric;
  credit_balance numeric;
  account_count integer;
BEGIN
  IF guard IS DISTINCT FROM 'confirmed' THEN
    RAISE EXCEPTION 'STAGING ONLY: app.wallet_staging_test=confirmed must be supplied externally';
  END IF;

  -- Disposable hierarchy. Never use production login accounts.
  INSERT INTO public.clients(username, password, role, status, credit_remaining, cash, commission)
  VALUES(operator_name, extensions.crypt('Staging-Only-1234!', extensions.gen_salt('bf', 10)),
         'company', 'active', 1000000, 0, 0)
  RETURNING id INTO operator_id;
  INSERT INTO public.clients(username, password, role, parent_username, status, cash, credit_remaining, pl_downline, commission, betting_allowed)
  VALUES(bettor_name, extensions.crypt('Staging-Only-1234!', extensions.gen_salt('bf', 10)),
         'bettor', operator_name, 'active', 0, 0, 1007, 0, true)
  RETURNING id INTO bettor_id;
  INSERT INTO public.clients(username, password, role, parent_username, status)
  VALUES(outsider_name, extensions.crypt('Staging-Only-1234!', extensions.gen_salt('bf', 10)),
         'bettor', 'unrelated-upline', 'active')
  RETURNING id INTO outsider_id;

  INSERT INTO public.exchange_sessions(token_hash, client_id, expires_at)
  VALUES (encode(extensions.digest(operator_token, 'sha256'), 'hex'), operator_id, now() + interval '30 minutes'),
         (encode(extensions.digest(bettor_token, 'sha256'), 'hex'), bettor_id, now() + interval '30 minutes');

  result := public.manual_wallet_transfer_session(operator_token, bettor_id, 'cash', 'deposit', 50000, 'Staging cash deposit', cash_deposit_id);
  IF result->>'success' <> 'true' THEN RAISE EXCEPTION 'Cash deposit failed: %', result; END IF;
  result := public.manual_wallet_transfer_session(operator_token, bettor_id, 'credit', 'deposit', 50000, 'Staging credit issued', credit_deposit_id);
  IF result->>'success' <> 'true' THEN RAISE EXCEPTION 'Credit deposit failed: %', result; END IF;
  SELECT cash, credit_remaining, cash+credit_remaining+pl_downline
    INTO cash_balance, credit_balance, available FROM public.clients WHERE id=bettor_id;
  IF cash_balance <> 50000 OR credit_balance <> 50000 OR available <> 101007
    THEN RAISE EXCEPTION 'Expected cash=50000 credit=50000 available=101007; got %, %, %', cash_balance, credit_balance, available; END IF;

  result := public.manual_wallet_transfer_session(operator_token, bettor_id, 'cash', 'withdraw', 100000, 'Staging cash withdrawal', cash_withdraw_id);
  IF result->>'success' <> 'true' THEN RAISE EXCEPTION 'Combined cash withdrawal failed: %', result; END IF;
  SELECT cash, credit_remaining, cash+credit_remaining+pl_downline
    INTO cash_balance, credit_balance, available FROM public.clients WHERE id=bettor_id;
  IF cash_balance <> -50000 OR credit_balance <> 50000 OR available <> 1007
    THEN RAISE EXCEPTION 'Expected cash=-50000 credit=50000 available=1007; got %, %, %', cash_balance, credit_balance, available; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.transactions
    WHERE client_username=bettor_name AND request_id=cash_withdraw_id
      AND type='cash' AND amount=-100000
      AND combined_before_balance=101007 AND combined_after_balance=1007
  ) THEN RAISE EXCEPTION 'Cash withdrawal ledger snapshot missing or inconsistent'; END IF;

  -- No wallet is allowed to overdraw combined Bettor funds.
  BEGIN
    PERFORM public.manual_wallet_transfer_session(operator_token, bettor_id, 'credit', 'withdraw', 1008, 'Should reject credit overdraft', gen_random_uuid());
    RAISE EXCEPTION 'Expected credit overdraft to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Insufficient credit balance' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.manual_wallet_transfer_session(operator_token, bettor_id, 'cash', 'withdraw', 1008, 'Should reject cash overdraft', gen_random_uuid());
    RAISE EXCEPTION 'Expected cash overdraft to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Insufficient cash balance' THEN RAISE; END IF;
  END;

  result := public.manual_wallet_transfer_session(operator_token, bettor_id, 'credit', 'withdraw', 500, 'Staging credit withdrawal', gen_random_uuid());
  IF result->>'success' <> 'true' THEN RAISE EXCEPTION 'Credit withdrawal failed'; END IF;
  result := public.manual_wallet_transfer_session(operator_token, bettor_id, 'credit', 'deposit', 500, 'Staging credit redeposit', gen_random_uuid());
  IF result->>'success' <> 'true' THEN RAISE EXCEPTION 'Credit redeposit failed'; END IF;

  -- A retry with the same request UUID must replay without a second debit.
  result := public.manual_wallet_transfer_session(operator_token, bettor_id, 'cash', 'deposit', 50000, 'Staging cash deposit', cash_deposit_id);
  IF result->>'replayed' <> 'true' THEN RAISE EXCEPTION 'Wallet idempotency failed'; END IF;
  SELECT count(*) INTO account_count FROM public.transactions WHERE request_id=cash_deposit_id AND client_username=bettor_name;
  IF account_count <> 1 THEN RAISE EXCEPTION 'Duplicate ledger entry for replay'; END IF;

  -- Actor cannot transfer money to an account outside their downline.
  BEGIN
    PERFORM public.manual_wallet_transfer_session(operator_token, outsider_id, 'cash', 'deposit', 10, 'Should reject outsider', gen_random_uuid());
    RAISE EXCEPTION 'Expected outsider transfer to fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Account is outside your downline' THEN RAISE; END IF;
  END;

  -- Bettor can reserve stakes against combined issued credit, even with negative cash.
  INSERT INTO public.matches(title, sport, status) VALUES('Staging A vs B', 'cricket', 'upcoming') RETURNING id INTO exchange_match_id;
  INSERT INTO public.exchange_markets(id, event_id, match_id, name, status, runners, observed_at, delayed, betting_locked)
  VALUES(exchange_market_id, 'staging-event', exchange_match_id, 'Match Odds', 'OPEN',
    '[{"id":"runner-a","name":"A"},{"id":"runner-b","name":"B"}]'::jsonb, clock_timestamp(), false, false);
  INSERT INTO public.exchange_quotes(market_id, runner_id, selection, side, odds, size, observed_at)
  VALUES(exchange_market_id, 'runner-a', 'A', 'back', 2, 2000, clock_timestamp());

  result := public.exchange_request(bettor_token, 'placeBet', jsonb_build_object(
    'marketId', exchange_market_id, 'runnerId','runner-a','side','back',
    'stake',500,'odds',2,'requestId',bet_request_id
  ));
  exchange_bet_id := (result->>'id')::uuid;
  IF exchange_bet_id IS NULL THEN RAISE EXCEPTION 'Bet placement did not return bet ID: %', result; END IF;
  SELECT cash+credit_remaining+pl_downline INTO available FROM public.clients WHERE id=bettor_id;
  IF available <> 507 THEN RAISE EXCEPTION 'Bet reserve did not reduce combined available 1007 -> 507: %',available; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.transactions WHERE client_username=bettor_name
     AND type='bet_reserve' AND request_id=bet_request_id AND combined_after_balance=507
  ) THEN RAISE EXCEPTION 'Bet reservation ledger record missing'; END IF;

  UPDATE public.exchange_markets SET status='CLOSED',betting_locked=true WHERE id=exchange_market_id;
  result := public.exchange_request(operator_token,'settle',jsonb_build_object(
    'marketId',exchange_market_id,'requestId',settle_request_id,
    'reason','Staging verified winning market','winnerId','runner-a'
  ));
  IF result->>'success' <> 'true' THEN RAISE EXCEPTION 'Bet settlement failed: %',result; END IF;
  SELECT cash+credit_remaining+pl_downline INTO available FROM public.clients WHERE id=bettor_id;
  IF available <> 1507 THEN RAISE EXCEPTION 'Winning bet did not settle available 507 -> 1507: %',available; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.bets WHERE id=exchange_bet_id AND status='won'
  ) THEN RAISE EXCEPTION 'Bet winning status missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.transactions WHERE client_username=bettor_name
     AND type='bet_settlement' AND combined_after_balance=1507
  ) THEN RAISE EXCEPTION 'Settlement ledger record missing'; END IF;

  RAISE NOTICE 'PASS: staged cash and credit transfers, limits, hierarchy, retry, combined ledger, bet reservation and winning settlement';
END
$wallet_test$;

-- Persistent production data never changes: even staging fixture accounts are rolled back.
ROLLBACK;
