-- Only the trusted Edge Function can execute these RPCs. No browser role can.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.transactions add column if not exists operator_username text;
alter table public.transactions add column if not exists request_id uuid;
alter table public.transactions add column if not exists counterparty_username text;
create unique index if not exists transactions_manual_request_idx
  on public.transactions(operator_username, request_id) where request_id is not null;

create table if not exists public.wallet_login_attempts (
  username text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table public.wallet_login_attempts enable row level security;
revoke all on public.wallet_login_attempts from anon, authenticated;
grant all on public.wallet_login_attempts to service_role;

create or replace function public.reserve_wallet_attempt(p_username text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare count_attempts integer;
begin
  insert into public.wallet_login_attempts as a values (lower(p_username), now(), 1)
  on conflict (username) do update set
    attempts = case when a.window_start < now() - interval '1 minute' then 1 else least(a.attempts + 1, 100) end,
    window_start = case when a.window_start < now() - interval '1 minute' then now() else a.window_start end
  returning attempts into count_attempts;
  return count_attempts <= 10;
end;
$$;
revoke all on function public.reserve_wallet_attempt(text) from public, anon, authenticated;
grant execute on function public.reserve_wallet_attempt(text) to service_role;

create or replace function public.manual_wallet_transfer(
  p_operator text, p_password text, p_client_id uuid, p_wallet text,
  p_direction text, p_amount numeric, p_description text, p_request_id uuid
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  actor public.clients%rowtype;
  target public.clients%rowtype;
  prior public.transactions%rowtype;
  signed_amount numeric;
  before_amount numeric;
  after_amount numeric;
  permitted boolean;
  ledger_id uuid;
begin
  if p_amount is null or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount <= 0
     or p_amount > 1000000000 or round(p_amount,2) <> p_amount
     or p_wallet not in ('cash','credit') or p_direction not in ('deposit','withdraw')
     or p_request_id is null or p_wallet is null or p_direction is null then
    raise exception 'Invalid transfer parameters';
  end if;
  -- Serializes financial transfers and hierarchy edits. No stale browser balances are used.
  lock table public.clients in share row exclusive mode;
  select * into actor from public.clients where username = p_operator;
  if actor.id is null or actor.status <> 'active' or actor.password !~ '^\$2[aby]\$'
     or p_password is null or actor.password <> extensions.crypt(p_password,actor.password) then
    raise exception 'Invalid administrator credentials';
  end if;
  if lower(actor.role) not in ('company','superadmin','admin','supermaster','master','dealer','agent','superagent','subdealer','subagent','distributor','minidistributor') then
    raise exception 'Administrator permission required';
  end if;
  select * into target from public.clients where id = p_client_id;
  if target.id is null or target.id = actor.id then raise exception 'Select a downline account'; end if;
  if target.status <> 'active' then raise exception 'Target account is disabled'; end if;
  -- UNION deduplicates nodes, so malformed hierarchy cycles terminate.
  with recursive ancestors(username,parent_username) as (
    select c.username,c.parent_username from public.clients c where c.id = target.id
    union
    select c.username,c.parent_username from public.clients c join ancestors a on c.username = a.parent_username
  ) select exists(select 1 from ancestors where username = actor.username) into permitted;
  if not permitted then raise exception 'Account is outside your downline'; end if;

  select * into prior from public.transactions where operator_username = actor.username and request_id = p_request_id;
  signed_amount := case when p_direction = 'deposit' then p_amount else -p_amount end;
  if prior.id is not null then
    if prior.client_username <> target.username or prior.type <> p_wallet or prior.amount <> signed_amount
       or coalesce(prior.description,'') <> coalesce(p_description,'') then
      raise exception 'Request ID was already used for a different transfer';
    end if;
    return jsonb_build_object('success',true,'transactionId',prior.id,'afterBalance',prior.after_balance,'replayed',true);
  end if;

  before_amount := case when p_wallet = 'cash' then target.cash else target.credit_remaining end;
  after_amount := before_amount + signed_amount;
  if after_amount < 0 then raise exception 'Insufficient % balance', p_wallet; end if;
  -- Preserve the existing dealer funding model: both cash and credit issuance consume credit pool.
  -- The top-level company may issue funds; other staff must have remaining credit.
  if p_direction = 'deposit' and lower(actor.role) <> 'company' and actor.credit_remaining < p_amount then
    raise exception 'Insufficient dealer credit limit';
  end if;
  if p_wallet = 'cash' then
    update public.clients set cash = after_amount,
      balance_upline = greatest(0,balance_upline + signed_amount) where id = target.id;
    update public.clients set cash = cash - signed_amount,
      credit_remaining = credit_remaining - signed_amount where id = actor.id;
  else
    update public.clients set credit_remaining = after_amount,
      credit_received = greatest(0,credit_received + signed_amount) where id = target.id;
    update public.clients set credit_remaining = credit_remaining - signed_amount where id = actor.id;
  end if;
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,
    operator_username,request_id,counterparty_username)
  values(target.username,p_wallet,signed_amount,coalesce(p_description,''),before_amount,after_amount,
    actor.username,p_request_id,actor.username) returning id into ledger_id;
  return jsonb_build_object('success',true,'transactionId',ledger_id,'afterBalance',after_amount,'replayed',false);
end;
$$;
revoke all on function public.manual_wallet_transfer(text,text,uuid,text,text,numeric,text,uuid) from public, anon, authenticated;
grant execute on function public.manual_wallet_transfer(text,text,uuid,text,text,numeric,text,uuid) to service_role;
grant select, update on public.clients to service_role;
grant select, insert on public.transactions to service_role;
