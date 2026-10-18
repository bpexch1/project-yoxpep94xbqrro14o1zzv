-- Run only in an isolated database with the synthetic qa_root bootstrap account.
begin;
set local role service_role;
do $qa$
declare
 root_name text:='qa_root'; prefix text:='completion_'||substr(replace(gen_random_uuid()::text,'-',''),1,8);
 fixture_password text:=gen_random_uuid()::text; actor jsonb; next_actor jsonb; player jsonb; child jsonb;
 roles text[]:=array['superadmin','admin','supermaster','master','bettor']; shares numeric[]:=array[85,85,40,25,0];
 ids uuid[]; names text[]; tokens text[]; i int; n numeric; denied boolean; input jsonb; result jsonb; replay jsonb;
 market text; bet jsonb; expected numeric[]:=array[-1691.75,-1015.05,-3045.15,0,-1015.05]; got numeric[]; before_count int;
begin
 if not exists(select 1 from public.clients where username=root_name and role='company') then raise exception 'Synthetic qa_root fixture required; do not run on production'; end if;
 update public.clients set password=extensions.crypt(fixture_password,extensions.gen_salt('bf',4)) where username=root_name;
 actor:=public.exchange_login(root_name,fixture_password); next_actor:=actor;
 for i in 1..5 loop
  names[i]:=prefix||'_'||roles[i];
  child:=public.exchange_request(next_actor->>'token','saveClient',jsonb_build_object('data',jsonb_build_object('username',names[i],'password',fixture_password,'role',roles[i],'parent_username',next_actor->'account'->>'username','status','active','downline_share',shares[i])));
  ids[i]:=(child->>'id')::uuid;
  next_actor:=public.exchange_login(names[i],fixture_password); tokens[i]:=next_actor->>'token';
 end loop;
 player:=next_actor;
 -- Independent sibling allocations: each may receive any 0..100% allocation.
 foreach n in array array[0,50,85,100,92.25]::numeric[] loop
  perform public.exchange_request(actor->>'token','saveClient',jsonb_build_object('data',jsonb_build_object('username',prefix||'_share_'||replace(n::text,'.','_'),'password',fixture_password,'role','superadmin','parent_username',root_name,'status','active','downline_share',n)));
 end loop;
 denied:=false;
 begin perform public.exchange_request(tokens[1],'saveClient',jsonb_build_object('id',ids[2],'data',jsonb_build_object('downline_share',90)));
 exception when others then if sqlerrm='Invalid account share' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Child share escalation allowed'; end if;
 denied:=false;
 begin perform public.exchange_request(tokens[1],'saveClient',jsonb_build_object('id',ids[1],'data',jsonb_build_object('downline_share',100)));
 exception when others then if sqlerrm='Self account changes require administrator' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Self escalation allowed'; end if;
 denied:=false;
 begin perform public.exchange_request(actor->>'token','saveClient',jsonb_build_object('id',ids[1],'data',jsonb_build_object('downline_share',84)));
 exception when others then if sqlerrm='Share reduction would invalidate child allocations' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Invalid parent reduction allowed'; end if;
 denied:=false;
 begin perform public.exchange_request(tokens[4],'saveClient',jsonb_build_object('data',jsonb_build_object('username',prefix||'_dealer','password',fixture_password,'role','dealer','parent_username',names[4],'status','active','downline_share',0)));
 exception when others then if sqlerrm='Invalid account hierarchy' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Dealer creation allowed'; end if;
 if not exists(select 1 from public.clients where username='qa_historical_dealer' and role='dealer' and credit_remaining=123) then raise exception 'Historical dealer changed'; end if;
 -- Exact user-provided fixtures: synthetic Admin only.
 update public.clients set cash=-173740,pl_downline=106783 where id=ids[2];
 input:=jsonb_build_object('requestId',gen_random_uuid(),'clientId',ids[2],'amount',106783,'reason','P/L to Cash transfer');
 result:=public.exchange_request(actor->>'token','settlePL',input);
 replay:=public.exchange_request(actor->>'token','settlePL',input);
 if result<>replay or (result->>'balance')::numeric<>-66957 or (result->>'plDownline')::numeric<>0 then raise exception 'QRT006 fixture failed'; end if;
 if (select count(*) from public.transactions where request_id=(input->>'requestId')::uuid)<>1 then raise exception 'Duplicate P/L cash ledger'; end if;
 update public.clients set cash=-346268.07,pl_downline=47415.98 where id=ids[2];
 result:=public.exchange_request(actor->>'token','settlePL',jsonb_build_object('requestId',gen_random_uuid(),'clientId',ids[2],'amount',10,'reason','P/L to Cash transfer'));
 if (result->>'balance')::numeric<>-346258.07 or (result->>'plDownline')::numeric<>47405.98 then raise exception 'Javed920 fixture failed'; end if;
 update public.clients set cash=-346278,pl_downline=20 where id=ids[2];
 input:=jsonb_build_object('requestId',gen_random_uuid(),'clientId',ids[2],'amount',10,'reason','Ledger reference');
 perform public.exchange_request(actor->>'token','settlePL',input);
 if not exists(select 1 from public.transactions where request_id=(input->>'requestId')::uuid and before_balance=-346278 and amount=10 and after_balance=-346268) then raise exception 'Ledger example failed'; end if;
 update public.clients set cash=100,pl_downline=-50 where id=ids[2];
 result:=public.exchange_request(actor->>'token','settlePL',jsonb_build_object('requestId',gen_random_uuid(),'clientId',ids[2],'amount',-20,'reason','Negative partial transfer'));
 if (result->>'balance')::numeric<>80 or (result->>'plDownline')::numeric<>-30 then raise exception 'Negative partial settlement failed'; end if;
 denied:=false;
 begin perform public.exchange_request(actor->>'token','settlePL',jsonb_build_object('requestId',gen_random_uuid(),'clientId',ids[2],'amount',-31));
 exception when others then if sqlerrm='Insufficient P/L balance' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Over settlement permitted'; end if;
 -- Cash operation is separate from P/L and credit.
 update public.clients set cash=20000,credit_remaining=100 where id=ids[1];
 update public.clients set cash=-19440,balance_upline=-19440,pl_downline=77,credit_remaining=99 where id=ids[2];
 perform public.manual_wallet_transfer_session(tokens[1],ids[2],'cash','deposit',19440,'Cash reference',gen_random_uuid());
 if not exists(select 1 from public.clients where id=ids[2] and cash=0 and balance_upline=0 and pl_downline=77 and credit_remaining=99) then raise exception 'Cash/upline reference failed'; end if;
 perform public.manual_wallet_transfer_session(tokens[1],ids[2],'credit','deposit',50,'Credit allocation',gen_random_uuid());
 perform public.manual_wallet_transfer_session(tokens[1],ids[2],'credit','withdraw',50,'Credit return',gen_random_uuid());
 if (select credit_remaining from public.clients where id=ids[1])<>100 then raise exception 'Credit return mismatch'; end if;
 denied:=false;
 begin perform public.manual_wallet_transfer_session(tokens[1],ids[2],'credit','deposit',101,'Over allocation',gen_random_uuid());
 exception when others then if sqlerrm='Insufficient upline credit limit' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Upline credit exceeded'; end if;
 -- Actual funded bet and cumulative distribution against exact 6767 fixture.
 update public.clients set credit_remaining=10000,cash=0,pl_downline=0 where id=ids[5];
 perform public.exchange_request(actor->>'token','setCommission',jsonb_build_object('requestId',gen_random_uuid(),'clientId',ids[5],'rate',0,'reason','Isolated reference fixture'));
 market:='qa-cumulative-'||gen_random_uuid();
 perform public.exchange_ingest(jsonb_build_array(jsonb_build_object('id',market,'eventId',market,'eventName','Demo QA A v B','sport','cricket','name','Match Odds','startTime',now(),'status','OPEN','delayed',false,'observedAt',clock_timestamp(),'runners','[{"id":"1","name":"A"},{"id":"2","name":"B"}]'::jsonb,'quotes','[{"runnerId":"1","selection":"A","side":"back","odds":2,"size":100000}]'::jsonb)));
 update public.exchange_markets set is_demo=true where id=market;
 bet:=public.exchange_request(tokens[5],'placeBet',jsonb_build_object('requestId',gen_random_uuid(),'marketId',market,'runnerId','1','side','back','stake',6767,'odds',2));
 perform public.exchange_request(actor->>'token','lockMarket',jsonb_build_object('requestId',gen_random_uuid(),'marketId',market,'locked',true));
 input:=jsonb_build_object('requestId',gen_random_uuid(),'marketId',market,'winnerId','1','reason','Demo reference result');
 result:=public.exchange_request(actor->>'token','settle',input);
 replay:=public.exchange_request(actor->>'token','settle',input);
 if result<>replay then raise exception 'Market settlement replay mismatch'; end if;
 select array_agg(allocated_pl order by hierarchy_level) into got from public.exchange_pl_allocations where bet_id=(bet->>'id')::uuid;
 if got<>expected then raise exception 'Cumulative allocation mismatch: %',got; end if;
 result:=public.exchange_request(tokens[5],'account','{}');
 if (result->>'availableBalance')::numeric<>16767 or (result->>'exposure')::numeric<>0 then raise exception 'Funds or exposure mismatch'; end if;
 result:=public.exchange_request(actor->>'token','reports',jsonb_build_object('kind','dailyPL','from',now()-interval '1 hour','to',now()+interval '1 hour'));
 if (select sum((x->>'amount')::numeric) from jsonb_array_elements(result->'rows') x)<>0 then raise exception 'Daily P/L does not reconcile'; end if;
 result:=public.exchange_request(actor->>'token','reports',jsonb_build_object('kind','dailyPL','from',now()-interval '3 days','to',now()-interval '2 days'));
 if jsonb_array_length(result->'rows')<>0 then raise exception 'Report date filter failed'; end if;
 denied:=false;
 begin update public.exchange_audit set action='tamper' where actor_id=(actor->'account'->>'id')::uuid;
 exception when others then if sqlerrm='Accounting history is immutable' then denied:=true; else raise; end if; end;
 if not denied then raise exception 'Audit mutation allowed'; end if;
 result:=public.exchange_request(tokens[5],'markets',jsonb_build_object('matchId',bet->>'match_id'));
 if result->0->'quotes'->0->>'runner_id' is null then raise exception 'Market quote serialization failed'; end if;
end;
$qa$;
rollback;
select 'PASS: six roles; 0/50/85/100/decimal independent shares; parent/child/self guards; Dealer preservation/rejection; exact QRT006/Javed920/ledger fixtures; signed partial P/L; credit limits/return; cash/upline separation; funded bet; cumulative 6767 allocation; exposure release; duplicate settlement; daily P/L/date reconciliation; immutable audit; quote serialization' as result;
