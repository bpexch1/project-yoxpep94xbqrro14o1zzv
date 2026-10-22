begin;
set local role service_role;
do $qa$
declare
  root_name text;
  name1 text := 'qa_commission_' || substr(replace(gen_random_uuid()::text,'-',''),1,12);
  name2 text := 'qa_commission_' || substr(replace(gen_random_uuid()::text,'-',''),1,12);
  uname text;
  player jsonb;
  bet jsonb;
  mid text := 'qa-commission-' || gen_random_uuid()::text;
  rid uuid;
  snap public.bets%rowtype;
  t public.transactions%rowtype;
  existing_rule boolean;
begin
  select username into root_name from public.clients where lower(role)='company' and status='active' limit 1;
  if root_name is null then raise exception 'No active company root'; end if;
  perform public.exchange_ingest(jsonb_build_array(jsonb_build_object(
    'id',mid,'eventId',mid,'eventName','Commission QA','sport','casino','name','Commission QA',
    'startTime',clock_timestamp(),'status','OPEN','delayed',false,'observedAt',clock_timestamp(),
    'runners','[{"id":"1","name":"Win"},{"id":"2","name":"Lose"}]'::jsonb,
    'quotes','[{"runnerId":"1","selection":"Win","side":"back","odds":1.95,"size":10000}]'::jsonb
  )));
  update public.exchange_markets set is_demo=true where id=mid;
  insert into public.studio_rounds (game_id,market_id,config,outcome,closes_at,ends_at)
  values ('9085',mid,'{"name":"Commission QA"}'::jsonb,'{"winner":"1"}'::jsonb,
          clock_timestamp()+interval '20 seconds',clock_timestamp()+interval '30 seconds')
  returning id into rid;
  foreach uname in array array[name1,name2] loop
    insert into public.clients (username,password,role,parent_username,cash,credit_remaining,betting_allowed,downline_share,commission)
    values (uname,extensions.crypt('SyntheticOnly984!',extensions.gen_salt('bf',4)),'bettor',root_name,1000,0,true,0,2);
    existing_rule := uname=name1;
    if existing_rule then
      insert into public.exchange_commission_rules (client_id,rate,actor_id,reason)
      select id,2,id,'QA initial configured commission' from public.clients where username=uname;
    end if;
    player:=public.exchange_login(uname,'SyntheticOnly984!');
    bet:=public.exchange_request(player->>'token','placeBet',jsonb_build_object(
      'marketId',mid,'requestId',gen_random_uuid(),'runnerId','1','side','back','stake',100,'odds',1.95));
    select * into snap from public.bets where id=(bet->>'id')::uuid;
    if snap.commission_rate<>2 or (existing_rule and snap.commission_rule_id is null) then
      raise exception 'Incorrect commission snapshot for %: rate %, rule %',uname,snap.commission_rate,snap.commission_rule_id;
    end if;
  end loop;
  update public.studio_rounds set closes_at=clock_timestamp()-interval '3 seconds' where id=rid;
  perform public.studio_settle_due();
  foreach uname in array array[name1,name2] loop
    select * into snap from public.bets where exchange_market_id=mid and user_email=uname;
    select * into t from public.transactions where client_username=uname and type='bet_settlement' and description like '%' || rid || '%';
    if snap.status<>'won' or snap.commission_rate<>2 or snap.commission_amount<>1.90 or snap.profit<>93.10
       or t.amount<>193.10 or t.description not like '%commission 1.90%'
       or (select cash from public.clients where username=uname)<>1093.10
       or (select coalesce(sum(allocated_pl),0) from public.exchange_pl_allocations where bet_id=snap.id)<>-93.10 then
      raise exception '2 percent settlement mismatch for %',uname;
    end if;
  end loop;
  raise notice 'PASS: rule and fallback both snapshot 2 percent; win fee 1.90, net P/L 93.10, payout 193.10, upline -93.10';
end
$qa$;
rollback;
select 'PASS: 2% commission snapshots, settlement, ledger and upline reconciliation; QA changes rolled back.' as result;
