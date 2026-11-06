-- Independent BPEXCH1 32 Cards engine (Game ID 9010).
-- Staging first. No production deployment is implied by this migration.
set local lock_timeout = '7s';
set local statement_timeout = '60s';

create table public.game32_rounds (
  id uuid primary key default gen_random_uuid(),
  game_id text not null default '9010' check (game_id = '9010'),
  deck jsonb not null check (jsonb_typeof(deck) = 'array' and jsonb_array_length(deck) = 32),
  outcome jsonb not null check (jsonb_typeof(outcome) = 'object'),
  commitment text not null check (commitment ~ '^[0-9a-f]{64}$'),
  proof_nonce text not null check (proof_nonce ~ '^[0-9a-f]{48}$'),
  created_at timestamptz not null default clock_timestamp(),
  betting_closes_at timestamptz not null,
  reveal_at timestamptz not null,
  result_at timestamptz not null,
  next_round_at timestamptz not null,
  settled_at timestamptz,
  check (created_at < betting_closes_at and betting_closes_at <= reveal_at and
         reveal_at < result_at and result_at < next_round_at)
);
create index game32_rounds_timeline_idx on public.game32_rounds(created_at desc);
create index game32_rounds_due_idx on public.game32_rounds(result_at) where settled_at is null;

create table public.game32_bets (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.game32_rounds(id),
  client_id uuid not null references public.clients(id),
  username text not null,
  request_id uuid not null,
  runner_id text not null check (runner_id in ('8','9','10','11')),
  side text not null check (side in ('back','lay')),
  stake numeric(18,2) not null check (stake > 0 and stake <= 1000000),
  odds numeric(12,2) not null check (odds > 1 and odds <= 1000),
  reserved numeric(18,2) not null check (reserved > 0),
  reserved_cash numeric(18,2) not null check (reserved_cash >= 0),
  reserved_credit numeric(18,2) not null check (reserved_credit >= 0),
  reserved_pl numeric(18,2) not null check (reserved_pl >= 0),
  status text not null default 'pending' check (status in ('pending','won','lost','void')),
  profit numeric(18,2),
  payout numeric(18,2),
  created_at timestamptz not null default clock_timestamp(),
  settled_at timestamptz,
  unique(client_id, request_id)
);
create index game32_bets_round_status_idx on public.game32_bets(round_id,status);
create index game32_bets_client_created_idx on public.game32_bets(client_id,created_at desc);

create table public.game32_audit (
  id bigint generated always as identity primary key,
  round_id uuid references public.game32_rounds(id),
  client_id uuid references public.clients(id),
  action text not null,
  request_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);
create index game32_audit_round_idx on public.game32_audit(round_id,id);

alter table public.game32_rounds enable row level security;
alter table public.game32_bets enable row level security;
alter table public.game32_audit enable row level security;
revoke all on public.game32_rounds, public.game32_bets, public.game32_audit from public, anon, authenticated;
grant select, insert, update on public.game32_rounds, public.game32_bets to service_role;
grant select, insert on public.game32_audit to service_role;
grant usage, select on sequence public.game32_audit_id_seq to service_role;

create or replace function public.game32_auth(p_token text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare account jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Authentication required'; end if;
  account := public.exchange_request(p_token,'account','{}'::jsonb);
  if account is null then raise exception 'Authentication required'; end if;
  return account;
end $$;

create or replace function public.game32_settle_due()
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  round_row public.game32_rounds%rowtype;
  bet_row public.game32_bets%rowtype;
  client_row public.clients%rowtype;
  winner text;
  is_void boolean;
  pnl numeric;
  payout_amount numeric;
  cash_return numeric;
  settled_count integer := 0;
begin
  lock table public.clients in share row exclusive mode;
  for round_row in
    select * from public.game32_rounds
    where settled_at is null and result_at <= clock_timestamp()
    order by result_at,id limit 100 for update
  loop
    winner := round_row.outcome->>'winner';
    is_void := winner is null;
    for bet_row in
      select * from public.game32_bets
      where round_id=round_row.id and status='pending'
      order by id for update
    loop
      select * into client_row from public.clients where id=bet_row.client_id for update;
      if client_row.id is null then raise exception 'Game32 account missing'; end if;
      pnl := case
        when is_void then 0
        when bet_row.side='back' and bet_row.runner_id=winner then round(bet_row.stake*(bet_row.odds-1),2)
        when bet_row.side='back' then -bet_row.stake
        when bet_row.runner_id=winner then -bet_row.reserved
        else bet_row.stake
      end;
      payout_amount := bet_row.reserved + pnl;
      cash_return := case when payout_amount>0 then bet_row.reserved_cash+greatest(pnl,0) else 0 end;
      update public.clients set
        cash=cash+cash_return,
        credit_remaining=credit_remaining+case when payout_amount>0 then bet_row.reserved_credit else 0 end,
        pl_downline=pl_downline+case when payout_amount>0 then bet_row.reserved_pl else 0 end
      where id=client_row.id;
      update public.game32_bets set
        status=case when is_void then 'void' when pnl>0 then 'won' else 'lost' end,
        profit=pnl,payout=payout_amount,settled_at=clock_timestamp()
      where id=bet_row.id;
      insert into public.transactions(
        client_username,type,amount,description,before_balance,after_balance,
        operator_username,combined_before_balance,combined_after_balance
      ) values (
        client_row.username,'game32_settlement',payout_amount,
        '32 Cards settlement / round '||round_row.id,
        client_row.cash,client_row.cash+cash_return,client_row.username,
        coalesce(client_row.cash,0)+coalesce(client_row.credit_remaining,0)+coalesce(client_row.pl_downline,0),
        coalesce(client_row.cash,0)+coalesce(client_row.credit_remaining,0)+coalesce(client_row.pl_downline,0)+payout_amount
      );
      insert into public.game32_audit(round_id,client_id,action,payload)
      values(round_row.id,client_row.id,'settle_bet',jsonb_build_object(
        'betId',bet_row.id,'status',case when is_void then 'void' when pnl>0 then 'won' else 'lost' end,
        'profit',pnl,'payout',payout_amount
      ));
    end loop;
    update public.game32_rounds set settled_at=clock_timestamp() where id=round_row.id;
    insert into public.game32_audit(round_id,action,payload)
    values(round_row.id,'settle_round',jsonb_build_object('winner',winner,'void',is_void));
    settled_count := settled_count+1;
  end loop;
  return settled_count;
end $$;

create or replace function public.game32_ensure_round(
  p_deck jsonb,p_outcome jsonb,p_commitment text,p_proof_nonce text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  current_round public.game32_rounds%rowtype;
  stamp timestamptz := clock_timestamp();
  public_cards integer;
begin
  perform public.game32_settle_due();
  perform pg_advisory_xact_lock(hashtextextended('bpexch1:game32:round',0));
  select * into current_round from public.game32_rounds order by created_at desc limit 1 for update;
  if current_round.id is not null and current_round.next_round_at>stamp then return current_round.id; end if;
  if jsonb_typeof(p_deck)<>'array' or jsonb_array_length(p_deck)<>32 or
     jsonb_typeof(p_outcome)<>'object' or jsonb_typeof(p_outcome->'groups')<>'array' or
     jsonb_array_length(p_outcome->'groups')<>4 or
     (p_outcome->>'winner' is not null and (p_outcome->>'winner') not in ('8','9','10','11')) or
     p_commitment !~ '^[0-9a-f]{64}$' or p_proof_nonce !~ '^[0-9a-f]{48}$'
  then raise exception 'Invalid Game32 round material'; end if;
  select coalesce(sum(jsonb_array_length(group_row->'cards')),0)::integer into public_cards
  from jsonb_array_elements(p_outcome->'groups') as groups(group_row);
  if public_cards<4 or public_cards>32 then raise exception 'Invalid Game32 outcome'; end if;
  insert into public.game32_rounds(
    deck,outcome,commitment,proof_nonce,betting_closes_at,reveal_at,result_at,next_round_at
  ) values (
    p_deck,p_outcome,p_commitment,p_proof_nonce,
    stamp+interval '20 seconds',stamp+interval '20 seconds',
    stamp+interval '20 seconds'+make_interval(secs=>public_cards),
    stamp+interval '26 seconds'+make_interval(secs=>public_cards)
  ) returning * into current_round;
  insert into public.game32_audit(round_id,action,payload)
  values(current_round.id,'create_round',jsonb_build_object(
    'commitment',p_commitment,'bettingClosesAt',current_round.betting_closes_at,
    'resultAt',current_round.result_at
  ));
  return current_round.id;
end $$;

create or replace function public.game32_place_bet(
  p_token text,p_round_id uuid,p_request_id uuid,p_runner_id text,
  p_side text,p_stake numeric,p_odds numeric
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  account jsonb;
  client_row public.clients%rowtype;
  round_row public.game32_rounds%rowtype;
  existing public.game32_bets%rowtype;
  accepted public.game32_bets%rowtype;
  required_odds numeric;
  liability numeric;
  cash_take numeric;
  credit_take numeric;
  pl_take numeric;
begin
  lock table public.clients in share row exclusive mode;
  account:=public.game32_auth(p_token);
  if lower(account->>'role') not in ('bettor','client','user') then raise exception 'Bettor account required'; end if;
  select * into client_row from public.clients where id=(account->>'id')::uuid for update;
  if client_row.id is null or client_row.status<>'active' or client_row.betting_allowed is not true then raise exception 'Betting is disabled'; end if;
  if p_request_id is null then raise exception 'Invalid bet parameters'; end if;
  select * into existing from public.game32_bets where client_id=client_row.id and request_id=p_request_id;
  if existing.id is not null then
    if existing.round_id is distinct from p_round_id or existing.runner_id is distinct from p_runner_id or
       existing.side is distinct from p_side or existing.stake is distinct from p_stake or existing.odds is distinct from p_odds
    then raise exception 'Request ID conflict'; end if;
    return to_jsonb(existing);
  end if;
  select * into round_row from public.game32_rounds where id=p_round_id for update;
  if round_row.id is null then raise exception 'Round unavailable'; end if;
  if round_row.settled_at is not null or clock_timestamp()>=round_row.betting_closes_at then raise exception 'Betting closed'; end if;
  if p_runner_id not in ('8','9','10','11') or p_side not in ('back','lay') or
     p_stake is null or p_stake<=0 or p_stake>1000000 or p_stake<>round(p_stake,2)
  then raise exception 'Invalid bet parameters'; end if;
  required_odds := case
    when p_side='back' and p_runner_id='8' then 12.2 when p_side='lay' and p_runner_id='8' then 13.7
    when p_side='back' and p_runner_id='9' then 5.95 when p_side='lay' and p_runner_id='9' then 6.45
    when p_side='back' and p_runner_id='10' then 3.2 when p_side='lay' and p_runner_id='10' then 3.45
    when p_side='back' and p_runner_id='11' then 2.08 when p_side='lay' and p_runner_id='11' then 2.18
  end;
  if p_odds is distinct from required_odds then raise exception 'Invalid bet parameters'; end if;
  liability := case when p_side='lay' then ceil(p_stake*(p_odds-1)*100)/100 else p_stake end;
  if coalesce(client_row.cash,0)+coalesce(client_row.credit_remaining,0)+coalesce(client_row.pl_downline,0)<liability
  then raise exception 'Insufficient balance'; end if;
  cash_take:=least(coalesce(client_row.cash,0),liability);
  credit_take:=least(coalesce(client_row.credit_remaining,0),liability-cash_take);
  pl_take:=liability-cash_take-credit_take;
  update public.clients set
    cash=cash-cash_take,credit_remaining=credit_remaining-credit_take,pl_downline=pl_downline-pl_take
  where id=client_row.id;
  insert into public.game32_bets(
    round_id,client_id,username,request_id,runner_id,side,stake,odds,reserved,
    reserved_cash,reserved_credit,reserved_pl
  ) values (
    round_row.id,client_row.id,client_row.username,p_request_id,p_runner_id,p_side,p_stake,p_odds,liability,
    cash_take,credit_take,pl_take
  ) returning * into accepted;
  insert into public.transactions(
    client_username,type,amount,description,before_balance,after_balance,operator_username,request_id,
    combined_before_balance,combined_after_balance
  ) values (
    client_row.username,'game32_reserve',-liability,'32 Cards reserve / round '||round_row.id,
    client_row.cash,client_row.cash-cash_take,client_row.username,p_request_id,
    coalesce(client_row.cash,0)+coalesce(client_row.credit_remaining,0)+coalesce(client_row.pl_downline,0),
    coalesce(client_row.cash,0)+coalesce(client_row.credit_remaining,0)+coalesce(client_row.pl_downline,0)-liability
  );
  insert into public.game32_audit(round_id,client_id,action,request_id,payload)
  values(round_row.id,client_row.id,'place_bet',p_request_id,jsonb_build_object(
    'betId',accepted.id,'runnerId',p_runner_id,'side',p_side,'stake',p_stake,'odds',p_odds,'reserved',liability
  ));
  return to_jsonb(accepted);
end $$;

create or replace function public.game32_read(p_token text,p_kind text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  account jsonb;
  client_uuid uuid;
  round_row public.game32_rounds%rowtype;
  rows jsonb;
  all_bets jsonb;
  active_bets jsonb;
  history jsonb;
  exposure_amount numeric;
begin
  account:=public.game32_auth(p_token);
  client_uuid:=(account->>'id')::uuid;
  perform public.game32_settle_due();
  if p_kind='last-results' then
    select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into rows from (
      select id,settled_at,outcome,commitment,proof_nonce
      from public.game32_rounds where settled_at is not null order by settled_at desc limit 20
    ) x;
    return rows;
  elsif p_kind='my-active-bets' then
    select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into rows from (
      select id,id::text order_id,round_id,runner_id,('Player '||runner_id) selection,side bet_type,
             stake,odds,status,profit,created_at
      from public.game32_bets where client_id=client_uuid and status='pending' order by created_at,id
    ) x;
    return rows;
  elsif p_kind='my-exposure' then
    select coalesce(sum(reserved),0) into exposure_amount from public.game32_bets where client_id=client_uuid and status='pending';
    return jsonb_build_object('exposure',exposure_amount,'balance',account->'availableBalance');
  elsif p_kind='recent-settlements' then
    select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into rows from (
      select id,round_id,runner_id,side bet_type,stake,odds,status,profit,payout,settled_at
      from public.game32_bets where client_id=client_uuid and status<>'pending'
      order by settled_at desc,id desc limit 50
    ) x;
    return rows;
  elsif p_kind<>'active' then raise exception 'Invalid Game32 query';
  end if;
  select * into round_row from public.game32_rounds order by created_at desc limit 1;
  if round_row.id is null then raise exception 'Round unavailable'; end if;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into all_bets from (
    select id,id::text order_id,round_id,runner_id,('Player '||runner_id) selection,side bet_type,
           stake,odds,status,profit,created_at
    from public.game32_bets where client_id=client_uuid order by created_at desc limit 50
  ) x;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into active_bets from (
    select id,id::text order_id,round_id,runner_id,('Player '||runner_id) selection,side bet_type,
           stake,odds,status,profit,created_at
    from public.game32_bets where client_id=client_uuid and round_id=round_row.id
    order by created_at,id
  ) x;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into history from (
    select id,settled_at,outcome,commitment,proof_nonce
    from public.game32_rounds where settled_at is not null order by settled_at desc limit 20
  ) x;
  select coalesce(sum(reserved),0) into exposure_amount from public.game32_bets where client_id=client_uuid and status='pending';
  account:=public.game32_auth(p_token);
  return jsonb_build_object(
    'round',to_jsonb(round_row),'balance',account->'availableBalance','exposure',exposure_amount,
    'bets',all_bets,'matchedBets',active_bets,'history',history,
    'quotes',jsonb_build_array(
      jsonb_build_object('runner_id','8','side','back','size',1000000,'consumed',0),
      jsonb_build_object('runner_id','8','side','lay','size',1000000,'consumed',0),
      jsonb_build_object('runner_id','9','side','back','size',1000000,'consumed',0),
      jsonb_build_object('runner_id','9','side','lay','size',1000000,'consumed',0),
      jsonb_build_object('runner_id','10','side','back','size',1000000,'consumed',0),
      jsonb_build_object('runner_id','10','side','lay','size',1000000,'consumed',0),
      jsonb_build_object('runner_id','11','side','back','size',1000000,'consumed',0),
      jsonb_build_object('runner_id','11','side','lay','size',1000000,'consumed',0)
    )
  );
end $$;

revoke all on function public.game32_auth(text), public.game32_settle_due(),
  public.game32_ensure_round(jsonb,jsonb,text,text),
  public.game32_place_bet(text,uuid,uuid,text,text,numeric,numeric),
  public.game32_read(text,text)
from public,anon,authenticated;
grant execute on function public.game32_auth(text), public.game32_settle_due(),
  public.game32_ensure_round(jsonb,jsonb,text,text),
  public.game32_place_bet(text,uuid,uuid,text,text,numeric,numeric),
  public.game32_read(text,text)
to service_role;

create extension if not exists pg_cron;
select cron.schedule(
  'bpexch1-game32-recovery',
  '* * * * *',
  'select public.game32_settle_due();'
) where not exists (select 1 from cron.job where jobname='bpexch1-game32-recovery');

-- Rollback plan before production release:
-- unschedule bpexch1-game32-recovery, undeploy the game32 Edge Function, then drop
-- the five game32_* functions followed by game32_audit, game32_bets and
-- game32_rounds. Preserve/export the audit, bet and transaction rows first.
