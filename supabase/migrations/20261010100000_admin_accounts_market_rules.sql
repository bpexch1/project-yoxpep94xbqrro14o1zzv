-- Server-only Company -> SuperAdmin -> Admin -> SuperMaster -> Master -> Dealer -> Client.
-- Deploy alongside the admin-accounts edge function; never give browser roles direct table writes.
create table if not exists public.admin_login_attempts (
  username text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
revoke all on public.admin_login_attempts from public, anon, authenticated;
grant all on public.admin_login_attempts to service_role;

create or replace function public.reserve_admin_attempt(p_username text)
returns boolean language plpgsql security definer set search_path = public as $$
declare count_now integer;
begin
  insert into public.admin_login_attempts as a(username, window_start, attempts)
  values(lower(trim(p_username)), now(), 1)
  on conflict (username) do update set
    window_start = case when a.window_start < now() - interval '1 minute' then now() else a.window_start end,
    attempts = case when a.window_start < now() - interval '1 minute' then 1 else a.attempts + 1 end
  returning attempts into count_now;
  return count_now <= 12;
end;
$$;
revoke all on function public.reserve_admin_attempt(text) from public, anon, authenticated;
grant execute on function public.reserve_admin_attempt(text) to service_role;

create or replace function public.admin_create_downline(
  p_operator text, p_operator_password text, p_username text, p_password text,
  p_role text, p_share numeric, p_active boolean, p_phone text, p_reference text, p_notes text
) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  actor public.clients%rowtype;
  new_account public.clients%rowtype;
  child_role text := lower(trim(p_role));
  actor_role text;
  parent_share numeric;
begin
  lock table public.clients in share row exclusive mode;
  select * into actor from public.clients where lower(username) = lower(trim(p_operator)) limit 1;
  if actor.id is null or actor.status <> 'active'
    or actor.password !~ '^\$2[aby]\$'
    or p_operator_password is null
    or actor.password <> extensions.crypt(p_operator_password, actor.password) then
      raise exception 'Invalid administrator credentials';
  end if;
  actor_role := lower(trim(actor.role));
  if not (
    (actor_role = 'company' and child_role in ('superadmin','client')) or
    (actor_role = 'superadmin' and child_role in ('admin','client')) or
    (actor_role = 'admin' and child_role in ('supermaster','client')) or
    (actor_role = 'supermaster' and child_role in ('master','client')) or
    (actor_role = 'master' and child_role in ('dealer','client')) or
    (actor_role = 'dealer' and child_role = 'client')
  ) then
    raise exception 'Role not permitted for this account';
  end if;
  if p_username is null or p_username !~ '^[A-Za-z0-9_@]{3,64}$'
    or p_password is null or length(p_password) < 8 or length(p_password) > 72 then
    raise exception 'Invalid new account details';
  end if;
  if exists(select 1 from public.clients where lower(username) = lower(trim(p_username))) then
    raise exception 'Username already exists';
  end if;
  parent_share := least(100, greatest(0, actor.downline_share));
  if p_share is null or p_share < 0 or p_share > parent_share then
    raise exception 'Downline share exceeds parent limit';
  end if;
  if length(coalesce(p_phone,'')) > 32 or length(coalesce(p_reference,'')) > 100
    or length(coalesce(p_notes,'')) > 1000 then
    raise exception 'Invalid new account details';
  end if;
  insert into public.clients(
    username, password, role, credit_received, credit_remaining, cash,
    pl_downline, balance_upline, parent_username, status, downline_share,
    phone, reference, notes
  ) values(
    trim(p_username), extensions.crypt(p_password, extensions.gen_salt('bf',10)),
    child_role, 0, 0, 0, 0, 0, actor.username,
    case when p_active then 'active' else 'inactive' end, p_share,
    nullif(trim(coalesce(p_phone,'')),''), nullif(trim(coalesce(p_reference,'')),''),
    nullif(trim(coalesce(p_notes,'')),'')
  ) returning * into new_account;
  return jsonb_build_object('id',new_account.id,'username',new_account.username,'role',new_account.role);
end;
$$;
revoke all on function public.admin_create_downline(text,text,text,text,text,numeric,boolean,text,text,text) from public, anon, authenticated;
grant execute on function public.admin_create_downline(text,text,text,text,text,numeric,boolean,text,text,text) to service_role;

create table if not exists public.market_access_rules (
  owner_username text not null,
  category_id text not null,
  market_name text not null,
  is_allowed boolean not null,
  updated_at timestamptz not null default now(),
  primary key(owner_username,category_id,market_name)
);
create index if not exists market_access_rules_owner on public.market_access_rules(owner_username);
alter table public.market_access_rules enable row level security;
revoke all on public.market_access_rules from public, anon, authenticated;
grant select,insert,update,delete on public.market_access_rules to service_role;

create or replace function public.admin_get_market_permissions(p_operator text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare actor public.clients%rowtype;
begin
  select * into actor from public.clients where lower(username)=lower(trim(p_operator));
  if actor.id is null or actor.status <> 'active' or lower(actor.role) not in ('company','superadmin','admin')
    or actor.password !~ '^\$2[aby]\$' or p_password is null
    or actor.password <> extensions.crypt(p_password,actor.password) then
    raise exception 'Invalid administrator credentials';
  end if;
  return coalesce(
    (select jsonb_agg(jsonb_build_object('category',category_id,'market',market_name,'allowed',is_allowed)
       order by category_id,market_name)
     from public.market_access_rules where owner_username=actor.username),
    '[]'::jsonb);
end;
$$;
revoke all on function public.admin_get_market_permissions(text,text) from public, anon, authenticated;
grant execute on function public.admin_get_market_permissions(text,text) to service_role;

create or replace function public.admin_set_market_permissions(
  p_operator text, p_password text, p_rules jsonb
) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare actor public.clients%rowtype; item jsonb; category text; market text;
begin
  select * into actor from public.clients where lower(username)=lower(trim(p_operator)) for update;
  if actor.id is null or actor.status <> 'active' or lower(actor.role) not in ('company','superadmin','admin')
    or actor.password !~ '^\$2[aby]\$' or p_password is null
    or actor.password <> extensions.crypt(p_password,actor.password) then
    raise exception 'Invalid administrator credentials';
  end if;
  if jsonb_typeof(p_rules) is distinct from 'array' or jsonb_array_length(p_rules)>100 then
    raise exception 'Invalid market permissions';
  end if;
  -- An atomic replacement; invalid input rolls back the entire transaction.
  delete from public.market_access_rules where owner_username=actor.username;
  for item in select value from jsonb_array_elements(p_rules) loop
    category := item->>'category'; market := item->>'market';
    if category not in ('casino','cricket','greyhound','horserace','soccer','tennis')
      or market is null or length(market)>60
      or jsonb_typeof(item->'allowed') is distinct from 'boolean' then
      raise exception 'Invalid market permissions';
    end if;
    insert into public.market_access_rules(owner_username,category_id,market_name,is_allowed)
      values(actor.username,category,market,(item->>'allowed')::boolean)
      on conflict(owner_username,category_id,market_name) do update
      set is_allowed=excluded.is_allowed,updated_at=now();
  end loop;
  return jsonb_build_object('saved',true);
end;
$$;
revoke all on function public.admin_set_market_permissions(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.admin_set_market_permissions(text,text,jsonb) to service_role;

-- Use this from a trusted, server-validated bet placement transaction.
-- It checks every ancestor's explicitly denied market rules, plus the category-wide "*" rule.
create or replace function public.market_is_allowed(
  p_client_username text, p_category text, p_market text
) returns boolean language sql stable security definer set search_path = public as $$
  with recursive ancestors as (
    select username,parent_username,array[lower(username)] as seen
      from public.clients where lower(username)=lower(p_client_username)
    union all
    select p.username,p.parent_username,a.seen || lower(p.username)
      from public.clients p join ancestors a on lower(p.username)=lower(a.parent_username)
      where not lower(p.username)=any(a.seen) and array_length(a.seen,1)<30
  )
  select exists(select 1 from ancestors)
    and not exists(
      select 1 from public.market_access_rules r join ancestors a on r.owner_username=a.username
      where r.category_id=p_category and r.is_allowed=false
        and (r.market_name=p_market or r.market_name='*')
    );
$$;
revoke all on function public.market_is_allowed(text,text,text) from public, anon, authenticated;
grant execute on function public.market_is_allowed(text,text,text) to service_role;
