-- Multi-level P/L distribution. No past balance, bet or transaction is rewritten.
-- At placement, snapshot the Bettor's ancestor chain. At settlement, the nearest
-- upline retains downline_share % of the remaining house P/L; repeat upwards.
-- The Company/root receives the last residual. Total allocations equal -net Bettor P/L.
set local lock_timeout = '7s';
set local statement_timeout = '60s';

create table if not exists public.exchange_bet_share_snapshot (
 bet_id uuid not null references public.bets(id) on delete restrict,
 account_id uuid not null references public.clients(id) on delete restrict,
 hierarchy_level integer not null check(hierarchy_level between 1 and 32),
 account_username text not null,
 share_rate numeric(5,2) not null check(share_rate between 0 and 100),
 is_root boolean not null,
 created_at timestamptz not null default now(),
 primary key(bet_id,account_id),unique(bet_id,hierarchy_level)
);
create index if not exists exchange_bet_share_snapshot_account_idx
 on public.exchange_bet_share_snapshot(account_id);
create table if not exists public.exchange_pl_allocations (
 id uuid primary key default gen_random_uuid(),
 bet_id uuid not null references public.bets(id) on delete restrict,
 account_id uuid not null references public.clients(id) on delete restrict,
 hierarchy_level integer not null check(hierarchy_level between 1 and 32),
 source_username text not null,
 account_username text not null,
 house_pl numeric not null,
 share_rate numeric(5,2) not null check(share_rate between 0 and 100),
 allocated_pl numeric not null,
 pl_before numeric not null,
 pl_after numeric not null,
 ledger_transaction_id uuid unique references public.transactions(id) on delete restrict,
 created_at timestamptz not null default now(),
 unique(bet_id,account_id)
);
create index if not exists exchange_pl_allocations_account_idx
 on public.exchange_pl_allocations(account_id,created_at desc);
create index if not exists exchange_pl_allocations_bet_idx
 on public.exchange_pl_allocations(bet_id);
alter table public.exchange_bet_share_snapshot enable row level security;
alter table public.exchange_pl_allocations enable row level security;
revoke all on public.exchange_bet_share_snapshot,public.exchange_pl_allocations from public,anon,authenticated;
grant select,insert on public.exchange_bet_share_snapshot,public.exchange_pl_allocations to service_role;

create or replace function public.exchange_snapshot_bet_shares(p_bet_id uuid,p_bettor_username text)
returns void language plpgsql security invoker set search_path='' as $share$
declare
 bettor public.clients%rowtype;
 parent public.clients%rowtype;
 next_parent text;
 visited text[];
 depth integer:=0;
 root_found boolean:=false;
begin
 select * into bettor from public.clients where username=p_bettor_username;
 if bettor.id is null or lower(bettor.role) not in ('client','bettor','user') then
  raise exception 'Only Bettor bets can acquire a P/L share chain';
 end if;
 if not exists(select 1 from public.bets where id=p_bet_id and user_email=bettor.username) then
  raise exception 'Bet does not belong to source Bettor';
 end if;
 if exists(select 1 from public.exchange_bet_share_snapshot where bet_id=p_bet_id) then
  raise exception 'P/L share snapshot already exists for this bet';
 end if;
 next_parent:=bettor.parent_username;
 visited:=array[lower(bettor.username)];
 if coalesce(trim(next_parent),'')='' then raise exception 'Bettor has no parent account'; end if;
 while coalesce(trim(next_parent),'')<>'' loop
  if depth>=32 or lower(next_parent)=any(visited) then
   raise exception 'Invalid or cyclic P/L hierarchy';
  end if;
  select * into parent from public.clients where username=next_parent for share;
  if parent.id is null or parent.status<>'active' or lower(parent.role) in ('client','bettor','user') then
   raise exception 'Upline account missing, inactive or invalid';
  end if;
  if parent.downline_share is null or parent.downline_share<0 or parent.downline_share>100 then
   raise exception 'Invalid upline share configuration';
  end if;
  depth:=depth+1;
  visited:=array_append(visited,lower(parent.username));
  root_found:=coalesce(trim(parent.parent_username),'')='';
  if root_found and lower(parent.role)<>'company' then
   raise exception 'P/L hierarchy must terminate at Company';
  end if;
  insert into public.exchange_bet_share_snapshot
   (bet_id,account_id,hierarchy_level,account_username,share_rate,is_root)
  values(p_bet_id,parent.id,depth,parent.username,
   case when root_found then 100 else parent.downline_share end,root_found);
  if root_found then exit; end if;
  next_parent:=parent.parent_username;
 end loop;
 if not root_found then raise exception 'Company root missing from P/L hierarchy'; end if;
end;
$share$;
revoke all on function public.exchange_snapshot_bet_shares(uuid,text) from public,anon,authenticated;
grant execute on function public.exchange_snapshot_bet_shares(uuid,text) to service_role;

create or replace function public.exchange_distribute_bet_pl(p_bet_id uuid,p_bettor_net_pl numeric,p_actor_username text)
returns void language plpgsql security invoker set search_path='' as $share$
declare
 rule record;
 ancestor public.clients%rowtype;
 bettor public.bets%rowtype;
 house_total numeric;
 remaining numeric;
 allocation numeric;
 before_pl numeric;
 combined_before numeric;
 entry_id uuid;
 root_count integer;
begin
 if p_bettor_net_pl is null or p_bettor_net_pl::text in ('NaN','Infinity','-Infinity')
    or p_bettor_net_pl<>round(p_bettor_net_pl,2) then
  raise exception 'Invalid bet P/L for allocation';
 end if;
 select * into bettor from public.bets where id=p_bet_id;
 if bettor.id is null then raise exception 'Bet not found'; end if;
 select count(*) filter(where is_root) into root_count
  from public.exchange_bet_share_snapshot where bet_id=p_bet_id;
 if root_count<>1 then
  raise exception 'Missing/invalid P/L snapshot. Manual review required';
 end if;
 if exists(select 1 from public.exchange_pl_allocations where bet_id=p_bet_id) then
  raise exception 'P/L already allocated for this bet';
 end if;
 house_total:=round(-p_bettor_net_pl,2);
 remaining:=house_total;
 for rule in select * from public.exchange_bet_share_snapshot
             where bet_id=p_bet_id order by hierarchy_level loop
  select * into ancestor from public.clients where id=rule.account_id for update;
  if ancestor.id is null then raise exception 'Snapshotted upline no longer exists'; end if;
  before_pl:=ancestor.pl_downline;
  combined_before:=coalesce(ancestor.cash,0)+coalesce(ancestor.credit_remaining,0)+coalesce(before_pl,0);
  allocation:=case when rule.is_root then remaining
                   else round(remaining*rule.share_rate/100,2) end;
  remaining:=remaining-allocation;
  entry_id:=null;
  if allocation<>0 then
   update public.clients set pl_downline=pl_downline+allocation where id=ancestor.id;
   -- request_id NULL because transaction unique index reserves one ID per
   -- operator; each hierarchy level has its own auditable allocation row.
   insert into public.transactions
    (client_username,type,amount,description,before_balance,after_balance,
     operator_username,counterparty_username,combined_before_balance,combined_after_balance)
   values
    (ancestor.username,'pl_share',allocation,'Bet P/L allocation '||p_bet_id,
     before_pl,before_pl+allocation,p_actor_username,bettor.user_email,
     combined_before,combined_before+allocation)
   returning id into entry_id;
  end if;
  insert into public.exchange_pl_allocations
   (bet_id,account_id,hierarchy_level,source_username,account_username,
    house_pl,share_rate,allocated_pl,pl_before,pl_after,ledger_transaction_id)
  values(p_bet_id,ancestor.id,rule.hierarchy_level,bettor.user_email,
   ancestor.username,house_total,rule.share_rate,allocation,
   before_pl,before_pl+allocation,entry_id);
 end loop;
 if remaining<>0 then
  raise exception 'Incomplete P/L distribution, rolling back settlement';
 end if;
end;
$share$;
revoke all on function public.exchange_distribute_bet_pl(uuid,numeric,text) from public,anon,authenticated;
grant execute on function public.exchange_distribute_bet_pl(uuid,numeric,text) to service_role;

-- Patch the active server function without copying stale SQL from GitHub.
-- Fail closed on unrecognized function bodies or repeated code anchors.
do $patch$
declare
 body text;
 before_place text := '  from public.matches where id=m.match_id returning * into b;'||chr(10)||'  insert into public.transactions';
 after_place text := '  from public.matches where id=m.match_id returning * into b;'||chr(10)||
  '  if b.id is null then raise exception ''Unable to reserve bet for this match''; end if;'||chr(10)||
  '  perform public.exchange_snapshot_bet_shares(b.id,a.username);'||chr(10)||
  '  insert into public.transactions';
 before_guard text := '  for b in select * from public.bets where exchange_market_id=m.id and status=''pending'' order by id for update loop'||chr(10)||'   pnl:=';
 after_guard text := '  for b in select * from public.bets where exchange_market_id=m.id and status=''pending'' order by id for update loop'||chr(10)||
  '   if b.reserved is null or b.reserved < 0 or b.commission_rate is null or b.commission_rate not between 0 and 100 then'||chr(10)||
  '    raise exception ''Legacy bet lacks funding/commission snapshot. Manual review required before settlement'';'||chr(10)||
  '   end if;'||chr(10)||
  '   pnl:=';
 before_distribute text := '     coalesce(previous,0)+coalesce(target.credit_remaining,0)+coalesce(target.pl_downline,0)+payout);'||chr(10)||'   changed:=changed+1;';
 after_distribute text := '     coalesce(previous,0)+coalesce(target.credit_remaining,0)+coalesce(target.pl_downline,0)+payout);'||chr(10)||
  '   if not is_void then'||chr(10)||
  '    perform public.exchange_distribute_bet_pl(b.id,pnl-fee,a.username);'||chr(10)||
  '   end if;'||chr(10)||
  '   changed:=changed+1;';
begin
 select pg_get_functiondef(p.oid) into body from pg_proc p
  where p.pronamespace='public'::regnamespace and p.proname='exchange_request'
   and pg_get_function_identity_arguments(p.oid)='p_token text, p_action text, p_input jsonb';
 if body is null then raise exception 'Exact exchange_request function not found'; end if;
 if strpos(body,before_place)=0 or strpos(body,before_guard)=0 or strpos(body,before_distribute)=0
    or strpos(body,'exchange_distribute_bet_pl(')>0 then
  raise exception 'Production exchange_request code changed; refusing unsafe patch';
 end if;
 body:=replace(body,before_place,after_place);
 body:=replace(body,before_guard,after_guard);
 body:=replace(body,before_distribute,after_distribute);
 execute body;
end;
$patch$;
