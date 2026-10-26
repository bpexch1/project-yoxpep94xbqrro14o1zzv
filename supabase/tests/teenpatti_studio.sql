begin;
set local role service_role;
do $qa$
declare root_name text; role_name text; parent_name text; user_name text:='qa_studio_'||substr(replace(gen_random_uuid()::text,'-',''),1,12); player jsonb; conf jsonb; outcome jsonb; state jsonb; bet jsonb; request jsonb; receipt jsonb; balance numeric; sum_pl numeric; denied boolean; kind text; rid uuid; market text; level_no integer:=0; shares numeric[]:=array[85,70,60,10,0];
begin
 select username into root_name from public.clients where lower(role)='company' and status='active' limit 1;
 if root_name is null then raise exception 'No Company root'; end if;
 parent_name:=root_name;
 foreach role_name in array array['superadmin','admin','supermaster','master'] loop
  level_no:=level_no+1;
  insert into public.clients(username,password,role,parent_username,downline_share,can_settle_pl) values(user_name||'_'||role_name,extensions.crypt('SyntheticOnly984!',extensions.gen_salt('bf',4)),role_name,parent_name,shares[level_no],true);
  parent_name:=user_name||'_'||role_name;
 end loop;
 -- This fixture isolates gameplay/wallet math at 0%; the 2% path is covered by commission_rule_2_percent.sql.
 insert into public.clients(username,password,role,parent_username,cash,credit_remaining,betting_allowed,downline_share,can_settle_pl,commission) values(user_name,extensions.crypt('SyntheticOnly984!',extensions.gen_salt('bf',4)),'bettor',parent_name,0,1000,true,shares[5],true,0);
 player:=public.exchange_login(user_name,'SyntheticOnly984!');
 conf:='{"id":"9085","name":"Heads & Tails","rules":"QA","timing":{"bettingSeconds":18,"revealSeconds":2,"resultSeconds":9},"runners":[{"id":"1","name":"Heads","odds":1.95,"layOdds":2.03},{"id":"2","name":"Tails","odds":1.95,"layOdds":2.03}]}'::jsonb;
 foreach kind in array array['win','loss','void'] loop
  outcome:=jsonb_build_object('winner',case kind when 'win' then '1' when 'loss' then '2' else null end,'groups','[]'::jsonb,'summary','QA');
  state:=public.studio_request(player->>'token','state','{"gameId":"9085"}',conf,outcome);
  rid:=(state->'round'->>'id')::uuid;
  -- If a real demo round already exists, use an isolated synthetic game round instead.
  market:='qa-studio-'||gen_random_uuid()::text;
  perform public.exchange_ingest(jsonb_build_array(jsonb_build_object('id',market,'eventId',market,'eventName','QA Studio','sport','casino','name','QA','startTime',clock_timestamp(),'status','OPEN','delayed',false,'observedAt',clock_timestamp(),'runners',conf->'runners','quotes','[{"runnerId":"1","selection":"Heads","side":"back","odds":1.95,"size":10000}]'::jsonb)));
  update public.exchange_markets set is_demo=true where id=market;
  insert into public.studio_rounds(game_id,market_id,config,outcome,closes_at,ends_at) values('9085',market,conf,outcome,clock_timestamp()+interval '20 seconds',clock_timestamp()+interval '30 seconds') returning id into rid;
  if state->'round'->'outcome'<>'null'::jsonb and (state->'round'->>'settled')::boolean is false then raise exception 'Outcome disclosed before close'; end if;
  select cash+credit_remaining+pl_downline into balance from public.clients where username=user_name;
  request:=jsonb_build_object('roundId',rid,'requestId',gen_random_uuid(),'runnerId','1','side','back','stake',100,'odds',1.95);
  bet:=public.studio_request(player->>'token','bet',request);
  receipt:=public.studio_request(player->>'token','bet',request);
  if bet->>'id'<>receipt->>'id' then raise exception 'Duplicate bet'; end if;
  state:=public.studio_request(player->>'token','state','{"gameId":"9085"}',conf,outcome);
  if (state->>'balance')::numeric<>(public.exchange_request(player->>'token','account','{}')->>'availableBalance')::numeric
    or (state->>'exposure')::numeric<>(public.exchange_request(player->>'token','account','{}')->>'exposure')::numeric then raise exception 'Studio and main account diverged after reserve'; end if;
  if jsonb_array_length(state->'matchedBets')<>1 or state->'matchedBets'->0->>'id'<>bet->>'id' or state->'matchedBets'->0->>'round_id'<>rid::text then raise exception 'Accepted bet missing from current Matched Bets'; end if;
  if (state->'matchedBets'->0->>'stake')::numeric<>100 or (state->'matchedBets'->0->>'odds')::numeric<>1.95 or state->'matchedBets'->0->>'bet_type'<>'back' then raise exception 'Matched bet receipt mismatch'; end if;
  if (select cash+credit_remaining+pl_downline from public.clients where username=user_name)<>balance-100 then raise exception 'Reserve mismatch'; end if;
  update public.studio_rounds set closes_at=clock_timestamp()-interval '1 second' where id=rid;
  denied:=false;
  begin
   perform public.exchange_request(player->>'token','placeBet',jsonb_build_object('requestId',gen_random_uuid(),'marketId',market,'runnerId','1','side','back','stake',1,'odds',1.95));
  exception when others then if sqlerrm='Market unavailable or stale' then denied:=true;else raise;end if;end;
  if not denied then raise exception 'Direct endpoint bypassed cutoff'; end if;
  perform public.studio_settle_due();
  if (select settled_at is not null from public.studio_rounds where id=rid) then raise exception 'Heads & Tails settled before its reveal phase ended'; end if;
  update public.studio_rounds set closes_at=clock_timestamp()-interval '3 seconds' where id=rid;
  perform public.studio_settle_due();perform public.studio_settle_due();
  receipt:=public.studio_request(player->>'token','bet',request);
  if bet->>'id'<>receipt->>'id' then raise exception 'Post-settlement replay failed'; end if;
  if (receipt->>'profit')::numeric<>(case kind when 'win' then 95 when 'loss' then -100 else 0 end) then raise exception 'Incorrect result %',kind;end if;
  if (select cash+credit_remaining+pl_downline from public.clients where username=user_name)<>balance+(case kind when 'win' then 95 when 'loss' then -100 else 0 end) then raise exception 'Settlement funds mismatch';end if;
  select coalesce(sum(allocated_pl),0) into sum_pl from public.exchange_pl_allocations where bet_id=(bet->>'id')::uuid;
  if sum_pl<>-(receipt->>'profit')::numeric then raise exception 'P/L mismatch';end if;
  if (select count(*) from public.transactions where client_username=user_name and type='bet_settlement' and description like '%'||rid||'%')<>1 then raise exception 'Duplicate settlement ledger';end if;
  state:=public.studio_request(player->>'token','state','{"gameId":"9085"}',conf,outcome);
  if (state->>'balance')::numeric<>(public.exchange_request(player->>'token','account','{}')->>'availableBalance')::numeric
    or (state->>'exposure')::numeric<>(public.exchange_request(player->>'token','account','{}')->>'exposure')::numeric then raise exception 'Studio and main account diverged after settlement'; end if;
  if jsonb_array_length(state->'matchedBets')<>1 or state->'matchedBets'->0->>'id'<>bet->>'id' then raise exception 'Same-round settled bet disappeared before ROUND OVER ended'; end if;
  if not exists(select 1 from jsonb_array_elements(state->'bets') x where x->>'id'=bet->>'id' and x->>'status'=case kind when 'win' then 'won' when 'loss' then 'lost' else 'void' end) then raise exception 'Settled order missing from historical bets'; end if;
  update public.studio_rounds set ends_at=clock_timestamp()-interval '0.5 second' where id=rid;
  state:=public.studio_request(player->>'token','state','{"gameId":"9085"}',conf,outcome);
  if state->'round'->>'id'=rid::text or jsonb_array_length(state->'matchedBets')<>0 then raise exception 'Next-round Matched Bets retained prior round'; end if;
 end loop;
 -- 32 Cards reveals its four cards from server time, then settles and keeps the
 -- just-finished wager through ROUND OVER. Test data remains in this rollback.
 conf:='{"id":"9010","name":"32 Cards","timing":{"bettingSeconds":20,"resultSeconds":10,"revealSeconds":7},"runners":[{"id":"8","name":"Player 8","odds":3.85,"layOdds":3.93},{"id":"9","name":"Player 9","odds":3.85,"layOdds":3.93},{"id":"10","name":"Player 10","odds":3.85,"layOdds":3.93},{"id":"11","name":"Player 11","odds":3.85,"layOdds":3.93}]}'::jsonb;
 outcome:='{"winner":"10","summary":"Player 10 wins with 23","groups":[{"label":"Player 8","cards":[4],"value":"8 + 6 = 14"},{"label":"Player 9","cards":[17],"value":"9 + 6 = 15"},{"label":"Player 10","cards":[11],"value":"10 + 13 = 23"},{"label":"Player 11","cards":[9],"value":"11 + 11 = 22"}]}'::jsonb;
 market:='qa-studio-'||gen_random_uuid()::text;
 perform public.exchange_ingest(jsonb_build_array(jsonb_build_object('id',market,'eventId',market,'eventName','QA 32 Cards','sport','casino','name','QA 32 Cards','startTime',clock_timestamp(),'status','OPEN','delayed',false,'observedAt',clock_timestamp(),'runners',conf->'runners','quotes','[{"runnerId":"8","selection":"Player 8","side":"back","odds":3.85,"size":10000}]'::jsonb)));
 update public.exchange_markets set is_demo=true where id=market;
 insert into public.studio_rounds(game_id,market_id,config,outcome,closes_at,ends_at) values('9010',market,conf,outcome,clock_timestamp()+interval '20 seconds',clock_timestamp()+interval '30 seconds') returning id into rid;
 request:=jsonb_build_object('roundId',rid,'requestId',gen_random_uuid(),'runnerId','8','side','back','stake',100,'odds',3.85);
 bet:=public.studio_request(player->>'token','bet',request);
 update public.studio_rounds set closes_at=clock_timestamp()-interval '3 seconds',ends_at=clock_timestamp()+interval '7 seconds' where id=rid;
 state:=public.studio_request(player->>'token','state','{"gameId":"9010"}',conf,outcome);
 if (state->'round'->>'settled')::boolean or state->'round'->'outcome'->>'winner' is not null then raise exception '32 Cards winner disclosed before final reveal'; end if;
 if jsonb_array_length(state->'round'->'outcome'->'groups'->0->'cards')<>1 or jsonb_array_length(state->'round'->'outcome'->'groups'->1->'cards')<>0 then raise exception '32 Cards staged reveal count wrong'; end if;
 if jsonb_array_length(state->'matchedBets')<>1 then raise exception '32 Cards bet vanished during reveal'; end if;
 update public.studio_rounds set closes_at=clock_timestamp()-interval '8 seconds',ends_at=clock_timestamp()+interval '2 seconds' where id=rid;
 perform public.studio_settle_due();
 state:=public.studio_request(player->>'token','state','{"gameId":"9010"}',conf,outcome);
 if (state->'round'->>'settled')::boolean is false or state->'round'->'outcome'->>'winner'<>'10' then raise exception '32 Cards final winner missing'; end if;
 if jsonb_array_length(state->'matchedBets')<>1 or state->'matchedBets'->0->>'status'<>'lost' then raise exception '32 Cards ROUND OVER wager missing'; end if;
 update public.studio_rounds set ends_at=clock_timestamp()-interval '1 second' where id=rid;
 state:=public.studio_request(player->>'token','state','{"gameId":"9010"}',conf,outcome);
 if state->'round'->>'id'=rid::text or jsonb_array_length(state->'matchedBets')<>0 then raise exception '32 Cards next round did not reset live panel'; end if;
 if not exists(select 1 from jsonb_array_elements(state->'bets') x where x->>'id'=bet->>'id' and x->>'status'='lost') then raise exception '32 Cards historical bet missing'; end if;
 outcome:='{"winner":"9","summary":"Player 9 wins with 29","groups":[{"label":"Player 8","cards":[11,4],"value":"8 + 13 + 6 = 27"},{"label":"Player 9","cards":[10,6],"value":"9 + 12 + 8 = 29"},{"label":"Player 10","cards":[9,5],"value":"10 + 11 + 7 = 28"},{"label":"Player 11","cards":[8,17],"value":"11 + 10 + 6 = 27"}]}'::jsonb;
 state:=public.studio_public_outcome('9010',outcome,clock_timestamp()-interval '5 seconds',clock_timestamp()+interval '5 seconds',null,clock_timestamp(),7);
 if state->>'winner' is not null or jsonb_array_length(state->'groups'->0->'cards')<>2 or jsonb_array_length(state->'groups'->1->'cards')<>1 or state->'groups'->1 ? 'value' then raise exception '32 Cards tied-player extra-card reveal leaked future result'; end if;
 state:=public.studio_public_outcome('9010',outcome,clock_timestamp()-interval '8 seconds',clock_timestamp()+interval '2 seconds',clock_timestamp(),clock_timestamp(),7);
 if state->>'winner'<>'9' or jsonb_array_length(state->'groups'->1->'cards')<>2 then raise exception '32 Cards tied-player final reveal failed'; end if;
 denied:=false;
 begin perform public.studio_request('invalid-token','state','{"gameId":"9085"}',conf,outcome);
 exception when others then if sqlerrm='Authentication required' then denied:=true;else raise;end if;end;
 if not denied then raise exception 'Unauthenticated access';end if;
 if has_table_privilege('anon','public.studio_rounds','select') or has_function_privilege('authenticated','public.studio_request(text,text,jsonb,jsonb,jsonb)','execute') then raise exception 'Public access to hidden results';end if;
end $qa$;
rollback;
select 'PASS: round-over retention/next-round reset, staged 32 Cards reveal/settlement, authenticated win/loss/void, wallet/ledger/upline P-L. Synthetic data rolled back.' as result;
