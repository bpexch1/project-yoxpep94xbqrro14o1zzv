begin;
set local role service_role;
do $qa$
declare root_name text; role_name text; parent_name text; user_name text:='qa_studio_'||substr(replace(gen_random_uuid()::text,'-',''),1,12); player jsonb; conf jsonb; outcome jsonb; state jsonb; bet jsonb; request jsonb; receipt jsonb; balance numeric; sum_pl numeric; denied boolean; kind text; rid uuid; market text;
begin
 select username into root_name from public.clients where lower(role)='company' and status='active' limit 1;
 if root_name is null then raise exception 'No Company root'; end if;
 parent_name:=root_name;
 foreach role_name in array array['superadmin','admin','supermaster','master'] loop
  insert into public.clients(username,password,role,parent_username,downline_share) values(user_name||'_'||role_name,extensions.crypt('SyntheticOnly984!',extensions.gen_salt('bf',4)),role_name,parent_name,50);
  parent_name:=user_name||'_'||role_name;
 end loop;
 insert into public.clients(username,password,role,parent_username,cash,credit_remaining,betting_allowed,downline_share) values(user_name,extensions.crypt('SyntheticOnly984!',extensions.gen_salt('bf',4)),'bettor',parent_name,0,1000,true,0);
 player:=public.exchange_login(user_name,'SyntheticOnly984!');
 conf:='{"id":"9085","name":"Heads & Tails","rules":"QA","runners":[{"id":"1","name":"Heads","odds":1.95,"layOdds":2.03},{"id":"2","name":"Tails","odds":1.95,"layOdds":2.03}]}'::jsonb;
 foreach kind in array array['win','loss','void'] loop
  outcome:=jsonb_build_object('winner',case kind when 'win' then '1' when 'loss' then '2' else null end,'groups','[]'::jsonb,'summary','QA');
  state:=public.studio_request(player->>'token','state','{"gameId":"9085"}',conf,outcome);
  rid:=(state->'round'->>'id')::uuid;
  -- If a real demo round already exists, use an isolated synthetic game round instead.
  market:='qa-studio-'||gen_random_uuid()::text;
  perform public.exchange_ingest(jsonb_build_array(jsonb_build_object('id',market,'eventId',market,'eventName','QA Studio','sport','casino','name','QA','startTime',clock_timestamp(),'status','OPEN','delayed',false,'observedAt',clock_timestamp(),'runners',conf->'runners','quotes','[{"runnerId":"1","selection":"Heads","side":"back","odds":1.95,"size":10000}]'::jsonb)));
  update public.exchange_markets set is_demo=true where id=market;
  update public.matches set is_demo=true,status='live' where id=(select match_id from public.exchange_markets where id=market);
  insert into public.studio_rounds(game_id,market_id,config,outcome,closes_at,ends_at) values('9085',market,conf,outcome,clock_timestamp()+interval '20 seconds',clock_timestamp()+interval '30 seconds') returning id into rid;
  if state->'round'->'outcome'<>'null'::jsonb and (state->'round'->>'settled')::boolean is false then raise exception 'Outcome disclosed before close'; end if;
  select cash+credit_remaining+pl_downline into balance from public.clients where username=user_name;
  request:=jsonb_build_object('roundId',rid,'requestId',gen_random_uuid(),'runnerId','1','side','back','stake',100,'odds',1.95);
  bet:=public.studio_request(player->>'token','bet',request);
  receipt:=public.studio_request(player->>'token','bet',request);
  if bet->>'id'<>receipt->>'id' then raise exception 'Duplicate bet'; end if;
  if (select cash+credit_remaining+pl_downline from public.clients where username=user_name)<>balance-100 then raise exception 'Reserve mismatch'; end if;
  update public.studio_rounds set closes_at=clock_timestamp()-interval '1 second' where id=rid;
  denied:=false;
  begin
   perform public.exchange_request(player->>'token','placeBet',jsonb_build_object('requestId',gen_random_uuid(),'marketId',market,'runnerId','1','side','back','stake',1,'odds',1.95));
  exception when others then if sqlerrm='Market unavailable or stale' then denied:=true;else raise;end if;end;
  if not denied then raise exception 'Direct endpoint bypassed cutoff'; end if;
  perform public.studio_settle_due();perform public.studio_settle_due();
  receipt:=public.studio_request(player->>'token','bet',request);
  if bet->>'id'<>receipt->>'id' then raise exception 'Post-settlement replay failed'; end if;
  if (receipt->>'profit')::numeric<>(case kind when 'win' then 95 when 'loss' then -100 else 0 end) then raise exception 'Incorrect result %',kind;end if;
  if (select cash+credit_remaining+pl_downline from public.clients where username=user_name)<>balance+(case kind when 'win' then 95 when 'loss' then -100 else 0 end) then raise exception 'Settlement funds mismatch';end if;
  select coalesce(sum(allocated_pl),0) into sum_pl from public.exchange_pl_allocations where bet_id=(bet->>'id')::uuid;
  if sum_pl<>-(receipt->>'profit')::numeric then raise exception 'P/L mismatch';end if;
  if (select count(*) from public.transactions where client_username=user_name and type='bet_settlement' and description like '%'||rid||'%')<>1 then raise exception 'Duplicate settlement ledger';end if;
  update public.studio_rounds set ends_at=clock_timestamp()-interval '0.5 second' where id=rid;
 end loop;
 denied:=false;
 begin perform public.studio_request('invalid-token','state','{"gameId":"9085"}',conf,outcome);
 exception when others then if sqlerrm='Authentication required' then denied:=true;else raise;end if;end;
 if not denied then raise exception 'Unauthenticated access';end if;
 if has_table_privilege('anon','public.studio_rounds','select') or has_function_privilege('authenticated','public.studio_request(text,text,jsonb,jsonb,jsonb)','execute') then raise exception 'Public access to hidden results';end if;
end $qa$;
rollback;
select 'PASS: authenticated rounds, private outcomes, credit-backed reserve, duplicate replay, cutoff bypass rejection, win/loss/void, single ledger settlement and upline P/L. Synthetic data rolled back.' as result;
