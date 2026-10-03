-- Run only against a disposable test database, inside a rolled-back transaction.
begin;
insert into public.clients(id,username,password,role,cash,credit_remaining,parent_username) values
 ('00000000-0000-4000-8000-000000000001','wallet_test_dealer',extensions.crypt('test-only-password',extensions.gen_salt('bf')),'dealer',500,1000,null),
 ('00000000-0000-4000-8000-000000000002','wallet_test_player','unused','client',100,0,'wallet_test_dealer'),
 ('00000000-0000-4000-8000-000000000003','wallet_test_outside','unused','client',100,0,null);
do $$
declare result jsonb; actual numeric; records integer; denied boolean;
begin
 result := public.manual_wallet_transfer('wallet_test_dealer','test-only-password','00000000-0000-4000-8000-000000000002','cash','deposit',50.25,'test deposit','10000000-0000-4000-8000-000000000001');
 select cash into actual from public.clients where username='wallet_test_player';
 if actual <> 150.25 then raise exception 'Deposit failed'; end if;
 select cash into actual from public.clients where username='wallet_test_dealer';
 if actual <> 449.75 then raise exception 'Dealer deduction failed'; end if;
 result := public.manual_wallet_transfer('wallet_test_dealer','test-only-password','00000000-0000-4000-8000-000000000002','cash','deposit',50.25,'test deposit','10000000-0000-4000-8000-000000000001');
 if (result->>'replayed')::boolean <> true then raise exception 'Replay was not detected'; end if;
 select count(*) into records from public.transactions where operator_username='wallet_test_dealer';
 if records <> 1 then raise exception 'Duplicate ledger record'; end if;
 result := public.manual_wallet_transfer('wallet_test_dealer','test-only-password','00000000-0000-4000-8000-000000000002','credit','deposit',200,'credit','10000000-0000-4000-8000-000000000002');
 denied := false;
 begin
  perform public.manual_wallet_transfer('wallet_test_dealer','test-only-password','00000000-0000-4000-8000-000000000002','cash','withdraw',151,'excess','10000000-0000-4000-8000-000000000003');
 exception when others then denied := true; end;
 if not denied then raise exception 'Cash withdrawal spent credit'; end if;
 denied := false;
 begin
  perform public.manual_wallet_transfer('wallet_test_dealer','wrong','00000000-0000-4000-8000-000000000002','cash','deposit',1,'wrong password','10000000-0000-4000-8000-000000000004');
 exception when others then denied := true; end;
 if not denied then raise exception 'Wrong password accepted'; end if;
 denied := false;
 begin
  perform public.manual_wallet_transfer('wallet_test_dealer','test-only-password','00000000-0000-4000-8000-000000000003','cash','deposit',1,'outside','10000000-0000-4000-8000-000000000005');
 exception when others then denied := true; end;
 if not denied then raise exception 'Outside downline accepted'; end if;
 result := public.manual_wallet_transfer('wallet_test_dealer','test-only-password','00000000-0000-4000-8000-000000000002','cash','withdraw',50.25,'withdraw','10000000-0000-4000-8000-000000000006');
 select cash into actual from public.clients where username='wallet_test_player';
 if actual <> 100 then raise exception 'Withdrawal failed'; end if;
 if has_function_privilege('anon','public.manual_wallet_transfer(text,text,uuid,text,text,numeric,text,uuid)','execute') then raise exception 'Anonymous RPC grant'; end if;
 if has_function_privilege('authenticated','public.manual_wallet_transfer(text,text,uuid,text,text,numeric,text,uuid)','execute') then raise exception 'Browser RPC grant'; end if;
 for records in 1..10 loop
  if not public.reserve_wallet_attempt('wallet_test_rate') then raise exception 'Rate limit too early'; end if;
 end loop;
 if public.reserve_wallet_attempt('wallet_test_rate') then raise exception 'Rate limit missing'; end if;
 -- Force a ledger insert failure and verify client/dealer mutations roll back.
 execute 'create function pg_temp.reject_wallet_ledger() returns trigger language plpgsql as $f$ begin raise exception ''forced ledger failure''; end; $f$';
 execute 'create trigger test_wallet_ledger_failure before insert on public.transactions for each row execute function pg_temp.reject_wallet_ledger()';
 denied := false;
 begin
  perform public.manual_wallet_transfer('wallet_test_dealer','test-only-password','00000000-0000-4000-8000-000000000002','cash','deposit',10,'rollback','10000000-0000-4000-8000-000000000007');
 exception when others then denied := true; end;
 select cash into actual from public.clients where username='wallet_test_player';
 if not denied or actual <> 100 then raise exception 'Atomic rollback failed'; end if;
end;
$$;
rollback;
