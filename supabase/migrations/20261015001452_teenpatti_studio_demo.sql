-- Additive free-coin studio; the outcome is private until betting closes.
set local lock_timeout='7s';
set local statement_timeout='60s';
create table public.studio_rounds (
 id uuid primary key default gen_random_uuid(), game_id text not null,
 market_id text not null unique references public.exchange_markets(id),
 config jsonb not null, outcome jsonb not null,
 created_at timestamptz not null default clock_timestamp(),
 closes_at timestamptz not null, ends_at timestamptz not null,
 settled_at timestamptz, check(ends_at>closes_at)
);
create index studio_rounds_game_idx on public.studio_rounds(game_id,created_at desc);
create index studio_rounds_due_idx on public.studio_rounds(closes_at) where settled_at is null;
alter table public.studio_rounds enable row level security;
revoke all on public.studio_rounds from public,anon,authenticated;
grant select,insert,update on public.studio_rounds to service_role;

create function public.studio_settle_due() returns integer language plpgsql security invoker set search_path='' as $$
declare r public.studio_rounds%rowtype; b public.bets%rowtype; c public.clients%rowtype;
 pnl numeric; fee numeric; payout numeric; combined numeric; winner text; is_void boolean; n integer:=0;
begin
 -- Same lock order as every other wallet mutation in this application.
 lock table public.clients in share row exclusive mode;
 for r in select * from public.studio_rounds where settled_at is null and closes_at<=clock_timestamp() order by closes_at,id limit 100 for update loop
  perform 1 from public.exchange_markets where id=r.market_id for update;
  winner:=r.outcome->>'winner'; is_void:=winner is null;
  for b in select * from public.bets where exchange_market_id=r.market_id and status='pending' order by id for update loop
   if b.reserved is null or b.commission_rate is null then raise exception 'Missing bet snapshot'; end if;
   pnl:=case when is_void then 0 when b.bet_type='back' then case when b.runner_id=winner then round(b.stake*(b.odds-1),2) else -b.stake end
    else case when b.runner_id=winner then -b.reserved else b.stake end end;
   fee:=round(greatest(pnl,0)*b.commission_rate/100,2);payout:=b.reserved+pnl-fee;
   select * into c from public.clients where username=b.user_email for update;
   combined:=coalesce(c.cash,0)+coalesce(c.credit_remaining,0)+coalesce(c.pl_downline,0);
   update public.clients set cash=cash+payout where id=c.id;
   update public.bets set status=case when is_void then 'void' when pnl>0 then 'won' else 'lost' end,profit=pnl-fee,commission_amount=fee,updated_at=clock_timestamp() where id=b.id;
   insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,operator_username,combined_before_balance,combined_after_balance)
    values(c.username,'bet_settlement',payout,'Studio demo '||(r.config->>'name')||' / '||r.id||'; commission '||fee,c.cash,c.cash+payout,c.username,combined,combined+payout);
   if not is_void then perform public.exchange_distribute_bet_pl(b.id,pnl-fee,c.username); end if;
  end loop;
  update public.exchange_markets set status='CLOSED',settled_at=clock_timestamp(),settled_result=jsonb_build_object('winnerId',winner,'void',is_void,'source','studio-demo') where id=r.market_id;
  update public.matches set status='completed' where id=(select match_id from public.exchange_markets where id=r.market_id);
  update public.studio_rounds set settled_at=clock_timestamp() where id=r.id;
  n:=n+1;
 end loop;
 return n;
end $$;
revoke all on function public.studio_settle_due() from public,anon,authenticated;
grant execute on function public.studio_settle_due() to service_role;

create function public.studio_request(p_token text,p_action text,p_input jsonb,p_config jsonb default null,p_outcome jsonb default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a jsonb; r public.studio_rounds%rowtype; gid text:=p_input->>'gameId'; mid text; stamp timestamptz; history jsonb; mine jsonb; result jsonb; existing public.bets%rowtype;
begin
 if p_action not in ('state','bet') then raise exception 'Unknown studio action'; end if;
 lock table public.clients in share row exclusive mode;
 a:=public.exchange_request(p_token,'account','{}');
 if lower(a->>'role') not in ('bettor','client','user') then raise exception 'Bettor account required'; end if;
 perform public.studio_settle_due();
 if p_action='bet' then
  select * into r from public.studio_rounds where id=(p_input->>'roundId')::uuid for update;
  if r.id is null then raise exception 'Round unavailable'; end if;
  -- Replay the exact receipt even if the original round has already closed.
  select * into existing from public.bets where user_email=a->>'username' and request_id=(p_input->>'requestId')::uuid;
  if existing.id is null and (clock_timestamp()>=r.closes_at or r.settled_at is not null) then raise exception 'Betting closed'; end if;
  if existing.id is null then
   update public.exchange_markets set observed_at=clock_timestamp() where id=r.market_id;
   update public.exchange_quotes set observed_at=clock_timestamp() where market_id=r.market_id;
  end if;
  result:=public.exchange_request(p_token,'placeBet',jsonb_build_object('marketId',r.market_id,'requestId',p_input->>'requestId','runnerId',p_input->>'runnerId','side',p_input->>'side','stake',p_input->'stake','odds',p_input->'odds'));
  return result;
 end if;
 if gid is null or p_config is null or p_outcome is null or p_config->>'id' is distinct from gid then raise exception 'Game unavailable'; end if;
 if gid not in ('9001','9005','9006','9030','9002','9004','9007','9017','9018','9019','9055','9085') then raise exception 'Game unavailable'; end if;
 if p_outcome->>'winner' is not null and not exists(select 1 from jsonb_array_elements(p_config->'runners') x where x->>'id'=p_outcome->>'winner') then raise exception 'Invalid studio outcome'; end if;
 perform pg_advisory_xact_lock(hashtextextended('studio:'||gid,0));
 select * into r from public.studio_rounds where game_id=gid order by created_at desc limit 1 for update;
 stamp:=clock_timestamp();
 if r.id is null or r.ends_at<=stamp then
  mid:='studio-'||gid||'-'||gen_random_uuid()::text;
  perform public.exchange_ingest(jsonb_build_array(jsonb_build_object('id',mid,'eventId',mid,'eventName','Demo: '||(p_config->>'name'),'sport','casino','name',p_config->>'name','startTime',stamp,'status','OPEN','delayed',false,'observedAt',stamp,
   'runners',(select jsonb_agg(jsonb_build_object('id',x->>'id','name',x->>'name')) from jsonb_array_elements(p_config->'runners') x),
   'quotes',(select jsonb_agg(jsonb_build_object('runnerId',x->>'id','selection',x->>'name','side','back','odds',x->'odds','size',1000000)) from jsonb_array_elements(p_config->'runners') x))));
  update public.exchange_markets set is_demo=true where id=mid;
  update public.matches set is_demo=true,status='live' where id=(select match_id from public.exchange_markets where id=mid);
  insert into public.studio_rounds(game_id,market_id,config,outcome,closes_at,ends_at) values(gid,mid,p_config,p_outcome,stamp+interval '20 seconds',stamp+interval '30 seconds') returning * into r;
 end if;
 if r.settled_at is null and r.closes_at>clock_timestamp() then
  update public.exchange_markets set observed_at=clock_timestamp() where id=r.market_id;
  update public.exchange_quotes set observed_at=clock_timestamp() where market_id=r.market_id;
 end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into history from (
  select id,game_id,settled_at,outcome from public.studio_rounds where game_id=gid and settled_at is not null order by created_at desc limit 20
 ) x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into mine from (
  select b.id,b.request_id,b.selection,b.bet_type,b.stake,b.odds,b.status,b.profit,b.created_at,s.id as round_id
  from public.bets b join public.studio_rounds s on s.market_id=b.exchange_market_id
  where b.user_email=a->>'username' and s.game_id=gid order by b.created_at desc limit 50
 ) x;
 a:=public.exchange_request(p_token,'account','{}');
 return jsonb_build_object('round',jsonb_build_object('id',r.id,'gameId',r.game_id,'closesAt',r.closes_at,'endsAt',r.ends_at,'settled',r.settled_at is not null,'outcome',case when r.settled_at is not null then r.outcome else null end),
  'config',r.config,'history',history,'bets',mine,'balance',a->'availableBalance','exposure',a->'exposure','serverNow',clock_timestamp());
end $$;
revoke all on function public.studio_request(text,text,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.studio_request(text,text,jsonb,jsonb,jsonb) to service_role;

-- Other exchange endpoints cannot bypass a studio round's deadline or override its result.
do $patch$
declare body text; anchor text;
begin
 select pg_get_functiondef('public.exchange_request(text,text,jsonb)'::regprocedure) into body;
 anchor:='  if m.id is null or m.status<>''OPEN''';
 if (length(body)-length(replace(body,anchor,'')))/length(anchor)<>1 then raise exception 'Exchange placement anchor changed'; end if;
 body:=replace(body,anchor,'  if exists(select 1 from public.studio_rounds where market_id=m.id and closes_at<=clock_timestamp()) then raise exception ''Market unavailable or stale''; end if;'||chr(10)||anchor);
 anchor:=' elsif p_action=''settle'' then';
 if (length(body)-length(replace(body,anchor,'')))/length(anchor)<>1 then raise exception 'Exchange settlement anchor changed'; end if;
 body:=replace(body,anchor,anchor||chr(10)||'  if exists(select 1 from public.studio_rounds where market_id=p_input->>''marketId'') then raise exception ''Studio rounds settle automatically''; end if;');
 execute body;
end $patch$;

-- Complete pending demo rounds even when the player closes their browser.
create extension if not exists pg_cron;
select cron.schedule('teenpatti-demo-settlement','* * * * *','select public.studio_settle_due();');
