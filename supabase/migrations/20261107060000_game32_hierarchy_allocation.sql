-- Game32-only cumulative_v2 P/L snapshots and settlement allocations.
-- Forward-only: existing settled Game32 rows remain untouched for manual review.
set local lock_timeout='7s';
set local statement_timeout='60s';
do $guard$ begin
  if exists(select 1 from public.game32_bets where status='pending') then
    raise exception 'Pending pre-snapshot Game32 bets require manual review before hierarchy migration';
  end if;
end $guard$;

create table public.game32_share_snapshot (
  bet_id uuid not null references public.game32_bets(id),
  account_id uuid not null references public.clients(id),
  hierarchy_level integer not null,
  share_rate numeric(5,2) not null check (share_rate between 0 and 100),
  is_root boolean not null,
  primary key (bet_id,account_id),
  unique (bet_id,hierarchy_level)
);
create table public.game32_pl_allocations (
  bet_id uuid not null references public.game32_bets(id),
  account_id uuid not null references public.clients(id),
  hierarchy_level integer not null,
  house_pl numeric(18,2) not null,
  allocated_pl numeric(18,2) not null,
  ledger_transaction_id uuid references public.transactions(id),
  created_at timestamptz not null default clock_timestamp(),
  primary key (bet_id,account_id)
);
create index game32_pl_allocations_account_idx on public.game32_pl_allocations(account_id);
alter table public.game32_share_snapshot enable row level security;
alter table public.game32_pl_allocations enable row level security;
revoke all on public.game32_share_snapshot,public.game32_pl_allocations from public,anon,authenticated;
grant select,insert on public.game32_share_snapshot,public.game32_pl_allocations to service_role;

create function public.game32_capture_shares() returns trigger
language plpgsql security invoker set search_path='' as $$
declare
  parent public.clients%rowtype;
  next_parent text;
  visited text[] := array[lower(new.username)];
  depth integer := 0;
  lower_share numeric := 0;
  root_found boolean := false;
begin
  select parent_username into next_parent from public.clients where id=new.client_id;
  if coalesce(trim(next_parent),'')='' then raise exception 'Game32 bettor hierarchy missing'; end if;
  while coalesce(trim(next_parent),'')<>'' loop
    if depth>=32 or lower(next_parent)=any(visited) then raise exception 'Invalid Game32 hierarchy'; end if;
    select * into parent from public.clients where username=next_parent for share;
    if parent.id is null or parent.status<>'active' or
       lower(parent.role) not in ('company','superadmin','admin','supermaster','master') or
       parent.downline_share is null or parent.downline_share not between 0 and 100
    then raise exception 'Invalid Game32 upline'; end if;
    depth:=depth+1;
    visited:=array_append(visited,lower(parent.username));
    root_found:=coalesce(trim(parent.parent_username),'')='';
    if root_found and lower(parent.role)<>'company' then raise exception 'Game32 Company root required'; end if;
    if (case when root_found then 100 else parent.downline_share end)<lower_share then
      raise exception 'Invalid Game32 cumulative shares';
    end if;
    lower_share:=case when root_found then 100 else parent.downline_share end;
    insert into public.game32_share_snapshot(bet_id,account_id,hierarchy_level,share_rate,is_root)
    values(new.id,parent.id,depth,lower_share,root_found);
    if root_found then exit; end if;
    next_parent:=parent.parent_username;
  end loop;
  if not root_found then raise exception 'Game32 Company root missing'; end if;
  return new;
end $$;
create trigger game32_capture_shares after insert on public.game32_bets
for each row execute function public.game32_capture_shares();

create function public.game32_allocate_settlement() returns trigger
language plpgsql security invoker set search_path='' as $$
declare
  rule record;
  ancestor public.clients%rowtype;
  house_total numeric;
  cumulative numeric:=0;
  next_cumulative numeric;
  allocated numeric;
  lower_share numeric:=0;
  entry_id uuid;
  level_count integer:=0;
begin
  if old.status<>'pending' or new.status='pending' or new.status='void' then return new; end if;
  if exists(select 1 from public.game32_pl_allocations where bet_id=new.id) then
    raise exception 'Game32 P/L already allocated';
  end if;
  if (select count(*) from public.game32_share_snapshot where bet_id=new.id and is_root)<>1 then
    raise exception 'Game32 P/L snapshot missing';
  end if;
  house_total:=round(-new.profit,2);
  for rule in select * from public.game32_share_snapshot where bet_id=new.id order by hierarchy_level loop
    select * into ancestor from public.clients where id=rule.account_id for update;
    if ancestor.id is null or rule.share_rate<lower_share then raise exception 'Invalid Game32 P/L chain'; end if;
    next_cumulative:=case when rule.is_root then house_total else round(house_total*rule.share_rate/100,2) end;
    allocated:=next_cumulative-cumulative;
    entry_id:=null;
    if allocated<>0 then
      update public.clients set pl_downline=pl_downline+allocated where id=ancestor.id;
      insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,
        operator_username,counterparty_username,combined_before_balance,combined_after_balance)
      values(ancestor.username,'pl_share',allocated,'Game32 P/L allocation '||new.id,
        ancestor.pl_downline,ancestor.pl_downline+allocated,new.username,new.username,
        ancestor.cash+ancestor.credit_remaining+ancestor.pl_downline,
        ancestor.cash+ancestor.credit_remaining+ancestor.pl_downline+allocated)
      returning id into entry_id;
    end if;
    insert into public.game32_pl_allocations(bet_id,account_id,hierarchy_level,house_pl,allocated_pl,ledger_transaction_id)
    values(new.id,ancestor.id,rule.hierarchy_level,house_total,allocated,entry_id);
    cumulative:=next_cumulative;
    lower_share:=rule.share_rate;
    level_count:=level_count+1;
  end loop;
  if level_count=0 or cumulative<>house_total then raise exception 'Incomplete Game32 P/L allocation'; end if;
  return new;
end $$;
create trigger game32_allocate_settlement after update of status on public.game32_bets
for each row when (old.status='pending' and new.status<>'pending')
execute function public.game32_allocate_settlement();
revoke all on function public.game32_capture_shares(), public.game32_allocate_settlement() from public,anon,authenticated;
grant execute on function public.game32_capture_shares(), public.game32_allocate_settlement() to service_role;
