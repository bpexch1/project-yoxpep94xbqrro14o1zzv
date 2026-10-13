-- Run as a database administrator against the deployed schema. All synthetic data is rolled back.
begin;
set local role service_role;
do $$
declare parent_name text; prefix text:='qa_'||substr(replace(gen_random_uuid()::text,'-',''),1,12);
 role_name text; child_name text; admin_name text; bettor_name text; admin_session jsonb; bettor_session jsonb;
 market_id text:= 'qa-'||gen_random_uuid()::text; bet_input jsonb; receipt jsonb; result jsonb;
begin
 select username into parent_name from public.clients where lower(role)='company' and status='active' limit 1;
 if parent_name is null then raise exception 'No active root account available for rollback test'; end if;
 foreach role_name in array array['superadmin','admin','supermaster','master','bettor'] loop
  child_name:=prefix||'_'||role_name;
  insert into public.clients(username,password,role,parent_username,cash,can_settle_pl)
   values(child_name,extensions.crypt('SyntheticOnly984!',extensions.gen_salt('bf',4)),role_name,parent_name,case when role_name='bettor' then 1000 else 0 end,true);
  if role_name='superadmin' then admin_name:=child_name; end if;
  parent_name:=child_name;
 end loop;
 bettor_name:=child_name;
 admin_session:=public.exchange_login(admin_name,'SyntheticOnly984!');
 bettor_session:=public.exchange_login(bettor_name,'SyntheticOnly984!');
 perform public.exchange_ingest(jsonb_build_array(jsonb_build_object('id',market_id,'eventId',market_id,'eventName','Rollback test A v B','sport','cricket','name','Match Odds','startTime',now(),'status','OPEN','delayed',false,'observedAt',clock_timestamp(),'runners','[{"id":"11","name":"A"},{"id":"22","name":"B"}]'::jsonb,'quotes','[{"runnerId":"11","selection":"A","side":"lay","odds":4,"size":10000}]'::jsonb)));
 bet_input:=jsonb_build_object('requestId',gen_random_uuid(),'marketId',market_id,'runnerId','11','side','lay','stake',100,'odds',4);
 receipt:=public.exchange_request(bettor_session->>'token','placeBet',bet_input);
 result:=public.exchange_request(bettor_session->>'token','placeBet',bet_input);
 if receipt->>'id'<>result->>'id' then raise exception 'Duplicate receipt'; end if;
 result:=public.exchange_request(bettor_session->>'token','account','{}');
 if (result->>'cash')::numeric<>700 or (result->>'exposure')::numeric<>300 then raise exception 'Reserve mismatch'; end if;
 perform public.exchange_request(admin_session->>'token','lockMarket',jsonb_build_object('requestId',gen_random_uuid(),'marketId',market_id,'locked',true));
 perform public.exchange_request(admin_session->>'token','settle',jsonb_build_object('requestId',gen_random_uuid(),'marketId',market_id,'winnerId','11','reason','Rollback test settlement'));
 result:=public.exchange_request(bettor_session->>'token','account','{}');
 if (result->>'cash')::numeric<>700 or (result->>'exposure')::numeric<>0 then raise exception 'Settlement mismatch'; end if;
 result:=public.exchange_request(bettor_session->>'token','entityRead','{"table":"clients","limit":10}'::jsonb);
 if jsonb_array_length(result)<>1 or (result->0) ? 'password' then raise exception 'Scoped read failed'; end if;
end $$;
rollback;
select 'PASS: server-role login, scoped reads, lay reserve, duplicate replay and settlement; all test data rolled back' as result;
