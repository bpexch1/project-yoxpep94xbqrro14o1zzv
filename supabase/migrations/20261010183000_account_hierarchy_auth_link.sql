-- STAGED ONLY. APPLY AFTER LOGIN AND ACCOUNT CREATION CUTOVER, NOT DURING LEGACY SITE USE.
-- Non-destructive: preserves client UUIDs, passwords, balances and transaction history.
-- New hierarchy: Company > SuperAdmin > Admin > SuperMaster > Master > Bettor.
-- Existing 'client' rows remain valid legacy bettors, but new child accounts use 'bettor'.
begin;
alter table public.clients add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
create or replace function public.enforce_bpexch_account_hierarchy()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
 parent_role text;
 expected_child text;
 normalized text := lower(replace(replace(trim(new.role), '_',''),'-',''));
 normalized_parent text;
begin
  if tg_op = 'UPDATE' and
     (new.role is distinct from old.role or new.parent_username is distinct from old.parent_username) then
    raise exception 'Role or parent changes require audited account transfer workflow';
  end if;
  if tg_op = 'UPDATE' then return new; end if;
  if normalized = 'company' then
    raise exception 'Company account bootstrap requires trusted provisioning';
  end if;
  if coalesce(nullif(trim(new.parent_username),''),'') = '' then
    raise exception 'Parent account is required';
  end if;
  select c.role into parent_role from public.clients c
    where lower(c.username) = lower(new.parent_username) and c.status='active'
    for share;
  if parent_role is null then raise exception 'Active parent account not found'; end if;
  normalized_parent := lower(replace(replace(trim(parent_role),'_',''),'-',''));
  expected_child := case normalized_parent
    when 'company' then 'superadmin'
    when 'superadmin' then 'admin'
    when 'admin' then 'supermaster'
    when 'supermaster' then 'master'
    when 'master' then 'bettor'
    else null
  end;
  if expected_child is null or normalized <> expected_child then
    raise exception 'Invalid account hierarchy: parent role % cannot create child role %', normalized_parent, normalized;
  end if;
  if new.downline_share < 0 or new.downline_share > 100 then
    raise exception 'Invalid downline share';
  end if;
  return new;
end;
$$;
drop trigger if exists bpexch_guard_account_hierarchy on public.clients;
create trigger bpexch_guard_account_hierarchy
before insert or update of role, parent_username on public.clients
for each row execute function public.enforce_bpexch_account_hierarchy();
revoke execute on function public.enforce_bpexch_account_hierarchy() from public, anon, authenticated;
commit;
