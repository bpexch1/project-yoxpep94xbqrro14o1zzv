-- STAGED. Must accompany locked-down client/transaction RLS before any real funds.
-- Existing balances/accounts unchanged; adds a short-lived opaque server-validated session.
begin;
create table if not exists public.bpexch_login_sessions (
 token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
 operator_id uuid not null references public.clients(id) on delete cascade,
 credential_digest bytea not null, created_at timestamptz not null default now(),
 expires_at timestamptz not null, revoked_at timestamptz
);
create index if not exists bpexch_login_sessions_user_idx on public.bpexch_login_sessions(operator_id,expires_at);
alter table public.bpexch_login_sessions enable row level security;
revoke all on public.bpexch_login_sessions from public,anon,authenticated;
grant select,insert,update,delete on public.bpexch_login_sessions to service_role;
create or replace function public.bpexch_open_session(p_username text,p_password text,p_token_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare actor public.clients%rowtype;
begin
 if p_username is null or length(p_username)>100 or p_password is null or length(p_password)>72
    or p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid sign-in request'; end if;
 select * into actor from public.clients where lower(username)=lower(trim(p_username));
 if actor.id is null or actor.status <> 'active' or actor.password !~ '^\$2[aby]\$'
    or actor.password <> extensions.crypt(p_password,actor.password)
    then raise exception 'Invalid username or password'; end if;
 insert into public.bpexch_login_sessions(token_hash,operator_id,credential_digest,expires_at)
 values (p_token_hash,actor.id,extensions.digest(actor.password,'sha256'),now()+interval '45 minutes');
 return jsonb_build_object('id',actor.id,'username',actor.username,'full_name',coalesce(actor.full_name,actor.username),
 'role',actor.role,'status',actor.status,'credit_received',actor.credit_received,'credit_remaining',actor.credit_remaining,
 'cash',actor.cash,'pl_downline',actor.pl_downline,'balance_upline',actor.balance_upline);
end;$$;
revoke all on function public.bpexch_open_session(text,text,text) from public,anon,authenticated;
grant execute on function public.bpexch_open_session(text,text,text) to service_role;

create or replace function public.manual_wallet_transfer_session(
  p_token_hash text, p_client_id uuid, p_wallet text,
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
  if p_token_hash !~ '^[0-9a-f]{64}
  if lower(actor.role) not in ('company','superadmin','admin','supermaster','master') then
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
    raise exception 'Insufficient operator credit limit';
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
 then raise exception 'Session expired. Log in again'; end if;
  select c.* into actor from public.bpexch_login_sessions s join public.clients c on c.id=s.operator_id
  where s.token_hash=p_token_hash and s.revoked_at is null and s.expires_at>now()
    and s.credential_digest=extensions.digest(c.password,'sha256') and c.status='active' for update of s;
  if actor.id is null then raise exception 'Session expired. Log in again'; end if;
  if lower(actor.role) not in ('company','superadmin','admin','supermaster','master') then
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
    raise exception 'Insufficient operator credit limit';
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


revoke all on function public.manual_wallet_transfer_session(text,uuid,text,text,numeric,text,uuid) from public,anon,authenticated;
grant execute on function public.manual_wallet_transfer_session(text,uuid,text,text,numeric,text,uuid) to service_role;
create or replace function public.bpexch_revoke_session(p_token_hash text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.bpexch_login_sessions set revoked_at=now() where token_hash=p_token_hash and revoked_at is null;
 return found;
end;$$;
revoke all on function public.bpexch_revoke_session(text) from public,anon,authenticated;
grant execute on function public.bpexch_revoke_session(text) to service_role;
commit;
