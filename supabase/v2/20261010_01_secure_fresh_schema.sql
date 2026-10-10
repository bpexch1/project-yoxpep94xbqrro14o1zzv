-- BPEXCH V2: isolated, empty schema for a NEW Supabase project.
-- No legacy clients, credentials, balances, bets or transactions are imported.
-- Apply only to an approved NEW project. Never apply to existing BPEXCH production.
begin;
create table public.v2_profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,32}$'),
  email text not null,
  display_name text not null default '',
  role text not null check (role in ('company','superadmin','admin','supermaster','master','bettor')),
  parent_id uuid references public.v2_profiles(id) on delete restrict,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  created_at timestamptz not null default now(),
  constraint v2_company_parent check ((role = 'company' and parent_id is null) or (role <> 'company' and parent_id is not null)),
  constraint v2_no_self_parent check (id is distinct from parent_id)
);
create unique index v2_profiles_username_ci on public.v2_profiles(lower(username));
create unique index v2_profiles_email_ci on public.v2_profiles(lower(email));
create index v2_profiles_parent_idx on public.v2_profiles(parent_id);

create table public.v2_wallets (
  profile_id uuid primary key references public.v2_profiles(id) on delete restrict,
  cash numeric(18,2) not null default 0 check (cash >= 0),
  credit_available numeric(18,2) not null default 0 check (credit_available >= 0),
  updated_at timestamptz not null default now()
);
create table public.v2_transfers (
  request_id uuid primary key,
  actor_id uuid not null references public.v2_profiles(id) on delete restrict,
  target_id uuid not null references public.v2_profiles(id) on delete restrict,
  wallet text not null check (wallet in ('cash','credit')),
  direction text not null check (direction in ('deposit','withdraw')),
  amount numeric(18,2) not null check (amount > 0),
  description text not null default '',
  created_at timestamptz not null default now()
);
create index v2_transfers_actor_time on public.v2_transfers(actor_id,created_at desc);
create index v2_transfers_target_time on public.v2_transfers(target_id,created_at desc);
create table public.v2_ledger (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.v2_transfers(request_id) on delete restrict,
  profile_id uuid not null references public.v2_profiles(id) on delete restrict,
  wallet text not null check (wallet in ('cash','credit')),
  delta numeric(18,2) not null check (delta <> 0),
  before_balance numeric(18,2) not null check (before_balance >= 0),
  after_balance numeric(18,2) not null check (after_balance >= 0),
  created_at timestamptz not null default now(),
  unique(request_id,profile_id),
  constraint v2_ledger_arithmetic check (after_balance = before_balance + delta)
);
create index v2_ledger_profile_time on public.v2_ledger(profile_id,created_at desc,id desc);

create or replace function public.v2_profile_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare expected_role text; actual_parent public.v2_profiles%rowtype;
begin
  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role or new.parent_id is distinct from old.parent_id
       or new.username is distinct from old.username or new.email is distinct from old.email then
      raise exception 'Identity and parent reassignment is forbidden; use an audited migration';
    end if;
    return new;
  end if;
  if new.role = 'company' then
    perform pg_advisory_xact_lock(6731729);
    if exists(select 1 from public.v2_profiles where role='company') then
      raise exception 'Company account already provisioned';
    end if;
  else
    select * into actual_parent from public.v2_profiles where id=new.parent_id for share;
    if actual_parent.id is null or actual_parent.status <> 'active' then
      raise exception 'Active parent is required';
    end if;
    expected_role := case actual_parent.role
      when 'company' then 'superadmin'
      when 'superadmin' then 'admin'
      when 'admin' then 'supermaster'
      when 'supermaster' then 'master'
      when 'master' then 'bettor'
      else null
    end;
    if expected_role is distinct from new.role then
      raise exception 'Account hierarchy violation';
    end if;
  end if;
  return new;
end;$$;
create trigger v2_profile_guard before insert or update of role,parent_id,username,email on public.v2_profiles
  for each row execute function public.v2_profile_guard();

create or replace function public.v2_wallet_initialize()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.v2_wallets(profile_id) values(new.id);
  return new;
end;$$;
create trigger v2_wallet_initialize after insert on public.v2_profiles
  for each row execute function public.v2_wallet_initialize();

create or replace function public.v2_wallet_transfer(
  p_actor uuid, p_target uuid, p_wallet text, p_direction text,
  p_amount numeric, p_description text, p_request_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor public.v2_profiles%rowtype;
        target public.v2_profiles%rowtype;
        existing public.v2_transfers%rowtype;
        actor_before numeric(18,2);
        target_before numeric(18,2);
        actor_after numeric(18,2);
        target_after numeric(18,2);
        movement numeric(18,2);
begin
  if p_actor is null or p_target is null or p_actor = p_target or p_request_id is null
     or p_wallet is null or p_direction is null
     or p_wallet not in ('cash','credit') or p_direction not in ('deposit','withdraw')
     or p_amount is null or p_amount <= 0 or p_amount > 1000000000
     or p_amount <> round(p_amount,2)
     or p_description is null or length(p_description) > 500 then
    raise exception 'Invalid transfer request';
  end if;
  -- Canonical order prevents deadlocks for concurrent reverse operations.
  perform 1 from public.v2_wallets where profile_id in(p_actor,p_target) order by profile_id for update;
  select * into existing from public.v2_transfers where request_id=p_request_id;
  if found then
    if existing.actor_id<>p_actor or existing.target_id<>p_target
       or existing.wallet<>p_wallet or existing.direction<>p_direction
       or existing.amount<>p_amount or existing.description<>p_description then
      raise exception 'Request ID already used for different transfer';
    end if;
    return jsonb_build_object('success',true,'replayed',true,'requestId',p_request_id);
  end if;
  select * into actor from public.v2_profiles where id=p_actor;
  select * into target from public.v2_profiles where id=p_target;
  if actor.id is null or target.id is null or actor.status <> 'active'
     or target.status <> 'active' or actor.role='bettor'
     or target.parent_id is distinct from actor.id then
    raise exception 'Transfer is not authorized for this account pair';
  end if;
  select case p_wallet when 'cash' then cash else credit_available end
    into actor_before from public.v2_wallets where profile_id=p_actor;
  select case p_wallet when 'cash' then cash else credit_available end
    into target_before from public.v2_wallets where profile_id=p_target;
  if actor_before is null or target_before is null then raise exception 'Wallet missing'; end if;
  movement:=case when p_direction='deposit' then p_amount else -p_amount end;
  actor_after:=actor_before-movement;
  target_after:=target_before+movement;
  if actor_after<0 or target_after<0 then raise exception 'Insufficient available balance'; end if;
  if p_wallet='cash' then
    update public.v2_wallets set cash=actor_after,updated_at=now() where profile_id=p_actor;
    update public.v2_wallets set cash=target_after,updated_at=now() where profile_id=p_target;
  else
    update public.v2_wallets set credit_available=actor_after,updated_at=now() where profile_id=p_actor;
    update public.v2_wallets set credit_available=target_after,updated_at=now() where profile_id=p_target;
  end if;
  insert into public.v2_transfers(request_id,actor_id,target_id,wallet,direction,amount,description)
    values(p_request_id,p_actor,p_target,p_wallet,p_direction,p_amount,p_description);
  insert into public.v2_ledger(request_id,profile_id,wallet,delta,before_balance,after_balance)
    values(p_request_id,p_actor,p_wallet,-movement,actor_before,actor_after),
          (p_request_id,p_target,p_wallet,movement,target_before,target_after);
  return jsonb_build_object('success',true,'replayed',false,'requestId',p_request_id,
    'actorBalance',actor_after,'targetBalance',target_after);
end;$$;

-- Only trusted backend service_role may read/insert profiles and call the financial RPC.
-- All browser anon/authenticated REST table access fails closed, even with valid JWT.
alter table public.v2_profiles enable row level security;
alter table public.v2_wallets enable row level security;
alter table public.v2_transfers enable row level security;
alter table public.v2_ledger enable row level security;
revoke all on public.v2_profiles,public.v2_wallets,public.v2_transfers,public.v2_ledger from public,anon,authenticated;
grant select,insert on public.v2_profiles to service_role;
grant select on public.v2_wallets,public.v2_transfers,public.v2_ledger to service_role;
grant usage,select on all sequences in schema public to service_role;

revoke all on function public.v2_profile_guard() from public,anon,authenticated;
revoke all on function public.v2_wallet_initialize() from public,anon,authenticated;
revoke all on function public.v2_wallet_transfer(uuid,uuid,text,text,numeric,text,uuid) from public,anon,authenticated;
grant execute on function public.v2_wallet_transfer(uuid,uuid,text,text,numeric,text,uuid) to service_role;

-- Prevent SQL UPDATE/DELETE of posted ledger rows even by a mistakenly privileged client.
create or replace function public.v2_ledger_immutable()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  raise exception 'Ledger is append only';
end;$$;
create trigger v2_ledger_immutable before update or delete on public.v2_ledger
  for each row execute function public.v2_ledger_immutable();
revoke all on function public.v2_ledger_immutable() from public,anon,authenticated;
-- Server-enforced login throttling, persistent across Lambda instances.
create table public.v2_login_attempts (
  username_key text primary key,
  attempt_count integer not null default 0 check(attempt_count>=0),
  expires_at timestamptz not null
);
alter table public.v2_login_attempts enable row level security;
revoke all on public.v2_login_attempts from public,anon,authenticated;
create or replace function public.v2_reserve_login_attempt(p_username text)
returns boolean language plpgsql security definer set search_path='' as $
declare count_now integer;
begin
  if p_username is null or length(p_username)>32 or p_username !~ '^[A-Za-z0-9_]{3,32}
 then return false; end if;
  insert into public.v2_login_attempts(username_key,attempt_count,expires_at)
  values(lower(p_username),1,now()+interval '15 minutes')
  on conflict(username_key) do update set
    attempt_count=case when public.v2_login_attempts.expires_at < now()
      then 1 else public.v2_login_attempts.attempt_count+1 end,
    expires_at=case when public.v2_login_attempts.expires_at < now()
      then now()+interval '15 minutes' else public.v2_login_attempts.expires_at end
  returning attempt_count into count_now;
  return count_now <= 6;
end;$;
revoke all on function public.v2_reserve_login_attempt(text) from public,anon,authenticated;
grant execute on function public.v2_reserve_login_attempt(text) to service_role;

commit;
