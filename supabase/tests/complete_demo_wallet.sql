-- Run after migrations as administrator; synthetic accounts and all balance changes roll back.
begin;
set local role service_role;
do $qa$
declare
 prefix text:='qa_'||substr(replace(gen_random_uuid()::text,'-',''),1,10);
 root_name text; parent_name text; child_name text; role_name text; level_no integer:=0;
 admin_name text; master_name text; bettor_name text; actor jsonb; player jsonb;
 child_id uuid; request_id uuid; result jsonb; replay jsonb; bet jsonb; input jsonb;
 market_id text; kind text; expected numeric; denied boolean; allocations numeric; opening numeric;
 rates numeric[]:=array[85,70,60,10,0];
begin
 select username into root_name from public.clients where lower(role)='company' and status='active' limit 1;
 if root_name is null then raise exception 'Missing Company root'; end if;
 parent_name:=root_name;
 foreach role_name in array array['superadmin','admin','supermaster','master','bettor'] loop
  level_no:=level_no+1; child_name:=prefix||'_'||role_name;
  insert into public.clients(username,password,role,parent_username,downline_share,credit_remaining,can_settle_pl)
   values(child_name,extensions.crypt('SyntheticOnly984!',extensions.gen_salt('bf',4)),role_name,parent_name,rates[level_no],case when role_name in ('superadmin','master') then 10000 else 0 end,true);
  if role_name='superadmin' then admin_name:=child_name; end if;
  if role_name='master' then master_name:=child_name; end if;
  parent_name:=child_name;
 end loop;
 bettor_name:=child_name;
 actor:=public.exchange_login(master_name,'SyntheticOnly984!');
 player:=public.exchange_login(bettor_name,'SyntheticOnly984!');
 child_id:=(player->'account'->>'id')::uuid;
 request_id:=gen_random_uuid();
 result:=public.manual_wallet_transfer_session(actor->>'token',child_id,'credit','deposit',1000,'QA credit',request_id);
 replay:=public.manual_wallet_transfer_session(actor->>'token',child_id,'credit','deposit',1000,'QA credit',request_id);
 if replay->>'replayed'<>'true' or replay->>'transactionId'<>result->>'transactionId' then raise exception 'Wallet replay failure'; end if;
 if (select count(*) from public.transactions where client_username=master_name and type='credit')<>1 then raise exception 'Operator ledger missing or duplicated'; end if;
 request_id:=gen_random_uuid();
 perform public.manual_wallet_transfer_session(actor->>'token',child_id,'cash','deposit',100,'QA cash deposit',request_id);
 perform public.manual_wallet_transfer_session(actor->>'token',child_id,'cash','withdraw',1100,'QA credit backed withdrawal',gen_random_uuid());
 result:=public.exchange_request(player->>'token','account','{}');
 if (result->>'cash')::numeric<>-1000 or (result->>'availableBalance')::numeric<>0 then raise exception 'Combined withdrawal mismatch'; end if;
 denied:=false;
 begin
  perform public.manual_wallet_transfer_session(actor->>'token',child_id,'credit','withdraw',1,'QA overdraw',gen_random_uuid());
 exception when others then if sqlerrm='Insufficient credit balance' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Credit withdrawal made combined funds negative'; end if;
 perform public.manual_wallet_transfer_session(actor->>'token',child_id,'cash','deposit',1000,'QA restore virtual funds',gen_random_uuid());
 if (select credit_remaining from public.clients where username=master_name)<>9000 then raise exception 'Cash transfer consumed credit pool'; end if;
 actor:=public.exchange_login(admin_name,'SyntheticOnly984!');
 perform public.exchange_request(actor->>'token','setCommission',jsonb_build_object('requestId',gen_random_uuid(),'clientId',child_id,'rate',10,'reason','QA commission snapshot'));
 foreach kind in array array['back_win','back_loss','lay_win','lay_loss','void'] loop
  market_id:='qa-market-'||gen_random_uuid()::text;
  perform public.exchange_ingest(jsonb_build_array(jsonb_build_object('id',market_id,'eventId',market_id,'eventName','QA A v B','sport','cricket','name','Match Odds','startTime',now(),'status','OPEN','delayed',false,'observedAt',clock_timestamp(),
   'runners','[{"id":"1","name":"A"},{"id":"2","name":"B"}]'::jsonb,'quotes',jsonb_build_array(jsonb_build_object('runnerId','1','selection','A','side',case when kind like 'lay%' then 'lay' else 'back' end,'odds',case when kind like 'lay%' then 4 else 3 end,'size',10000)))));
  input:=jsonb_build_object('requestId',gen_random_uuid(),'marketId',market_id,'runnerId','1','side',case when kind like 'lay%' then 'lay' else 'back' end,'stake',100,'odds',case when kind like 'lay%' then 4 else 3 end);
  bet:=public.exchange_request(player->>'token','placeBet',input);
  replay:=public.exchange_request(player->>'token','placeBet',input);
  if bet->>'id'<>replay->>'id' then raise exception 'Bet duplicate'; end if;
  if (select count(*) from public.exchange_bet_share_snapshot where bet_id=(bet->>'id')::uuid)<>5 then raise exception 'Hierarchy snapshot missing'; end if;
  perform public.exchange_request(actor->>'token','lockMarket',jsonb_build_object('requestId',gen_random_uuid(),'marketId',market_id,'locked',true));
  input:=jsonb_build_object('requestId',gen_random_uuid(),'marketId',market_id,'winnerId',case when kind in ('back_win','lay_loss') then '1' else '2' end,'void',kind='void','reason','QA result settlement');
  result:=public.exchange_request(actor->>'token','settle',input);
  replay:=public.exchange_request(actor->>'token','settle',input);
  if result<>replay then raise exception 'Settlement replay mismatch'; end if;
  expected:=case kind when 'back_win' then 180 when 'back_loss' then -100 when 'lay_win' then 90 when 'lay_loss' then -300 else 0 end;
  if (select profit from public.bets where id=(bet->>'id')::uuid)<>expected then raise exception 'Profit mismatch %',kind; end if;
  select coalesce(sum(allocated_pl),0) into allocations from public.exchange_pl_allocations where bet_id=(bet->>'id')::uuid;
  if allocations<>-expected then raise exception 'P/L allocation does not reconcile %',kind; end if;
  if kind='back_loss' and (select allocated_pl from public.exchange_pl_allocations where bet_id=(bet->>'id')::uuid and account_username=master_name)<>10 then raise exception 'Master share mismatch'; end if;
 end loop;
 result:=public.exchange_request(player->>'token','account','{}');
 if (result->>'availableBalance')::numeric<>870 or (result->>'exposure')::numeric<>0 then raise exception 'Final bettor funds mismatch'; end if;
 result:=public.exchange_request(player->>'token','walletLedger',jsonb_build_object('username',bettor_name,'wallet','combined','from',now()-interval '1 day','to',now()+interval '1 day'));
 if (result->>'openingBalance')::numeric<>0 or (result->'rows'->-1->>'after_balance')::numeric<>870 then raise exception 'Combined ledger mismatch'; end if;
 result:=public.exchange_request(player->>'token','walletLedger',jsonb_build_object('username',bettor_name,'wallet','cash','from',now()-interval '1 day','to',now()+interval '1 day','limit',1));
 if result->>'truncated'<>'true' then raise exception 'Truncation invisible'; end if;
 denied:=false;
 begin
  perform public.exchange_request(player->>'token','walletLedger',jsonb_build_object('username',master_name,'wallet','cash','from',now()-interval '1 day','to',now()+interval '1 day'));
 exception when others then if sqlerrm='Permission denied' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Outside ledger leaked'; end if;
 input:=jsonb_build_object('requestId',gen_random_uuid(),'clientId',(select id from public.clients where username=master_name),'amount',10,'reason','QA P/L to cash');
 perform public.exchange_request(actor->>'token','settlePL',input);
 perform public.exchange_request(actor->>'token','settlePL',input);
 if (select count(*) from public.transactions where client_username=master_name and type='pl_transfer')<>1 then raise exception 'P/L transfer duplicate'; end if;
 result:=public.exchange_request(player->>'token','markets','{}');
 if (select count(*) from public.exchange_markets where is_demo and settled_at is null)<>2 then raise exception 'Demo rounds missing'; end if;
 if exists(select 1 from public.exchange_quotes q join public.exchange_markets m on m.id=q.market_id where m.is_demo and (q.odds<=1 or q.observed_at<clock_timestamp()-interval '15 seconds')) then raise exception 'Demo quotes invalid'; end if;
 if has_function_privilege('anon','public.exchange_wallet_ledger(text,text,timestamptz,timestamptz,integer)','execute') then raise exception 'Public wallet helper'; end if;
end;
$qa$;
rollback;
select 'PASS: cash/credit transfers, operator ledger, duplicate requests, credit-funded Back/Lay win/loss, void, commission, five-level P/L, scoped wallet history, truncation, P/L transfer and demo markets; all synthetic data rolled back' as result;
