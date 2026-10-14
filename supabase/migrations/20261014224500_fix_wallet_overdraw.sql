-- Stop two ledger holes left by 20261014201000_cash_credit_reference_329811:
-- 1. Credit withdraw could pull credit that was already backing negative cash.
-- 2. A non-company dealer could deposit more cash than they held, minting balance.
-- Does not rewrite historical rows. Apply on a disposable database before production.

create or replace function public.manual_wallet_transfer_session(
  p_token text, p_client_id uuid, p_wallet text,
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
  combined_before numeric;
  combined_after numeric;
begin
  if p_amount is null or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount <= 0
     or p_amount > 1000000000 or round(p_amount,2) <> p_amount
     or p_wallet not in ('cash','credit') or p_direction not in ('deposit','withdraw')
     or p_request_id is null or p_wallet is null or p_direction is null then
    raise exception 'Invalid transfer parameters';
  end if;
  lock table public.clients in share row exclusive mode;
  select c.* into actor from public.clients c
    join public.exchange_sessions s on s.client_id = c.id
   where s.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and s.expires_at > now() and c.status = 'active';
  if actor.id is null then raise exception 'Authentication required'; end if;
  if lower(actor.role) not in ('company','superadmin','admin','supermaster','master','dealer','agent','superagent','subdealer','subagent','distributor','minidistributor') then
    raise exception 'Administrator permission required';
  end if;
  select * into target from public.clients where id = p_client_id;
  if target.id is null or target.id = actor.id then raise exception 'Select a downline account'; end if;
  if target.status <> 'active' then raise exception 'Target account is disabled'; end if;
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
    return jsonb_build_object('success',true,'transactionId',prior.id,'afterBalance',prior.after_balance,'availableBalance',coalesce(prior.combined_after_balance,prior.after_balance),'replayed',true);
  end if;

  combined_before := coalesce(target.cash,0) + coalesce(target.credit_remaining,0) + coalesce(target.pl_downline,0);
  combined_after := combined_before + signed_amount;
  before_amount := case when p_wallet = 'cash' then target.cash else target.credit_remaining end;
  after_amount := before_amount + signed_amount;
  -- Credit already used to cover a cash withdrawal must stay on the account.
  if p_wallet = 'credit' and (after_amount < 0 or (p_direction = 'withdraw' and combined_after < 0)) then
    raise exception 'Insufficient credit balance';
  end if;
  if p_wallet = 'cash' and p_direction = 'withdraw'
     and p_amount > greatest(0, coalesce(target.cash,0) + coalesce(target.credit_remaining,0) + coalesce(target.pl_downline,0)) then
    raise exception 'Insufficient cash balance';
  end if;
  if p_wallet = 'credit' and p_direction = 'deposit' and lower(actor.role) <> 'company'
     and actor.credit_remaining < p_amount then
    raise exception 'Insufficient dealer credit limit';
  end if;
  if p_wallet = 'cash' and p_direction = 'deposit' and lower(actor.role) <> 'company'
     and coalesce(actor.cash, 0) < p_amount then
    raise exception 'Insufficient cash balance';
  end if;
  if p_wallet = 'cash' then
    update public.clients set cash = after_amount,
      balance_upline = greatest(0,balance_upline + signed_amount) where id = target.id;
    update public.clients set cash = cash - signed_amount where id = actor.id;
  else
    update public.clients set credit_remaining = after_amount,
      credit_received = greatest(0,credit_received + signed_amount) where id = target.id;
    update public.clients set credit_remaining = credit_remaining - signed_amount where id = actor.id;
  end if;
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,
    operator_username,request_id,counterparty_username,combined_before_balance,combined_after_balance)
  values(target.username,p_wallet,signed_amount,coalesce(p_description,''),before_amount,after_amount,
    actor.username,p_request_id,actor.username,combined_before,combined_after) returning id into ledger_id;
  return jsonb_build_object('success',true,'transactionId',ledger_id,'afterBalance',after_amount,'availableBalance',combined_after,'replayed',false);
end;
$$;

revoke all on function public.manual_wallet_transfer_session(text,uuid,text,text,numeric,text,uuid) from public, anon, authenticated;
grant execute on function public.manual_wallet_transfer_session(text,uuid,text,text,numeric,text,uuid) to service_role;
