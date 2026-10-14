-- Reference-video wallet parity (Bettor available balance + auditable combined ledger snapshots).
-- REVIEW / STAGING ONLY: do not apply to production until cash, P/L and exposure tests pass.
-- Existing legacy transactions remain untouched: historical combined balances cannot be inferred safely.
alter table public.transactions add column if not exists combined_before_balance numeric;
alter table public.transactions add column if not exists combined_after_balance numeric;

-- Authorize manual transfers with the existing exchange session, without a second password form.
-- Keep account locks, downline checks, idempotency and ledger writes atomic.
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
  is_bettor boolean;
begin
  if p_amount is null or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount <= 0
     or p_amount > 1000000000 or round(p_amount,2) <> p_amount
     or p_wallet not in ('cash','credit') or p_direction not in ('deposit','withdraw')
     or p_request_id is null or p_wallet is null or p_direction is null then
    raise exception 'Invalid transfer parameters';
  end if;
  -- Serializes financial transfers and hierarchy edits. No stale browser balances are used.
  lock table public.clients in share row exclusive mode;
  -- The caller identity comes exclusively from the active server-side session.
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
  -- UNION deduplicates nodes, so malformed hierarchy cycles terminate.
  with recursive ancestors(username,parent_username) as (
    select c.username,c.parent_username from public.clients c where c.id = target.id
    union
    select c.username,c.parent_username from public.clients c join ancestors a on c.username = a.parent_username
  ) select exists(select 1 from ancestors where username = actor.username) into permitted;
  if not permitted then raise exception 'Account is outside your downline'; end if;

  select * into prior from public.transactions where operator_username = actor.username and request_id = p_request_id;
  signed_amount := case when p_direction = 'deposit' then p_amount else -p_amount end;
  is_bettor := lower(coalesce(target.role,'')) in ('client','bettor','user');
  -- A Bettor's withdrawable cash is backed by their combined wallet balance.
  -- Do not confuse this with the issued credit amount, which stays separately tracked.
  combined_before := coalesce(target.cash,0) + coalesce(target.credit_remaining,0) + coalesce(target.pl_downline,0);
  combined_after := combined_before + signed_amount;
  if prior.id is not null then
    if prior.client_username <> target.username or prior.type <> p_wallet or prior.amount <> signed_amount
       or coalesce(prior.description,'') <> coalesce(p_description,'') then
      raise exception 'Request ID was already used for a different transfer';
    end if;
    return jsonb_build_object('success',true,'transactionId',prior.id,'afterBalance',prior.after_balance,
      'availableBalance',coalesce(prior.combined_after_balance,prior.after_balance),'replayed',true);
  end if;

  before_amount := case when p_wallet = 'cash' then target.cash else target.credit_remaining end;
  after_amount := before_amount + signed_amount;
  -- Credit cannot be withdrawn above issued credit, regardless of available cash.
  if p_wallet = 'credit' and after_amount < 0 then raise exception 'Insufficient credit balance'; end if;
  -- Original Bettor flow: cash withdrawal may exceed cash alone, but never combined funds.
  -- Staff cash withdrawals remain restricted to cash itself.
  if p_wallet = 'cash' and p_direction = 'withdraw' and
     ((is_bettor and combined_after < 0) or (not is_bettor and after_amount < 0)) then
    raise exception 'Insufficient cash balance';
  end if;
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
  -- Record both wallet-specific and combined running balances without rewriting historic rows.
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,
    operator_username,request_id,counterparty_username,combined_before_balance,combined_after_balance)
  values(target.username,p_wallet,signed_amount,coalesce(p_description,''),before_amount,after_amount,
    actor.username,p_request_id,actor.username,combined_before,combined_after) returning id into ledger_id;
  return jsonb_build_object('success',true,'transactionId',ledger_id,'afterBalance',after_amount,
    'availableBalance',combined_after,'replayed',false);
end;
$$;

revoke all on function public.manual_wallet_transfer_session(text,uuid,text,text,numeric,text,uuid) from public, anon, authenticated;
grant execute on function public.manual_wallet_transfer_session(text,uuid,text,text,numeric,text,uuid) to service_role;

-- Keep account reads, bet reserve and settlement balances consistent with the new wallet rules.
create or replace function public.exchange_request(p_token text,p_action text,p_input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 a public.clients%rowtype; target public.clients%rowtype; q public.exchange_quotes%rowtype;
 m public.exchange_markets%rowtype; b public.bets%rowtype; rule public.exchange_commission_rules%rowtype;
 audit public.exchange_audit%rowtype; allowed_ids uuid[]; allowed_names text[];
 amount numeric; price numeric; liability numeric; pnl numeric; fee numeric; payout numeric;
 req uuid; result jsonb; rows jsonb; changed integer:=0; new_id uuid; previous numeric;
 winner text; is_void boolean; v_table text; clause text; sql_text text; field text; op text; f jsonb; payload jsonb; lim integer; since_at timestamptz; until_at timestamptz;
begin
 select c.* into a from public.clients c join public.exchange_sessions s on s.client_id=c.id
 where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and s.expires_at>now() and c.status='active';
 if a.id is null then raise exception 'Authentication required'; end if;
 if p_action='logout' then
  delete from public.exchange_sessions where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
  return '{"success":true}';
 end if;
 with recursive scope(id,username) as (
  select a.id,a.username union select c.id,c.username from public.clients c join scope s on c.parent_username=s.username
 ) select array_agg(id),array_agg(username) into allowed_ids,allowed_names from scope;
 if p_action='entityRead' then
  v_table:=p_input->>'table';
  if v_table not in ('clients','public_clients','bets','transactions','matches') then raise exception 'Permission denied'; end if;
  if v_table='public_clients' then v_table:='clients'; end if;
  clause:=case v_table when 'clients' then format('t.id=any(%L::uuid[])',allowed_ids)
    when 'bets' then format('t.user_email=any(%L::text[])',allowed_names)
    when 'transactions' then format('t.client_username=any(%L::text[])',allowed_names) else 'true' end;
  if jsonb_array_length(coalesce(p_input->'filters','[]'))>30 then raise exception 'Invalid query'; end if;
  for f in select value from jsonb_array_elements(coalesce(p_input->'filters','[]')) loop
   field:=f->>'column';
   if field in ('password','auth_user_id') or not exists(select 1 from information_schema.columns where table_schema='public' and information_schema.columns.table_name=v_table and column_name=field) then raise exception 'Invalid query'; end if;
   op:=case f->>'method' when 'eq' then '=' when 'neq' then '<>' when 'gt' then '>' when 'gte' then '>=' when 'lt' then '<' when 'lte' then '<=' else null end;
   if f->>'method'='in' and jsonb_typeof(f->'value')='array' then
    clause:=clause||format(' and (to_jsonb(t)->%L) in (select value from jsonb_array_elements(%L::jsonb))',field,f->'value');
   elsif op is not null then clause:=clause||format(' and (to_jsonb(t)->%L) %s %L::jsonb',field,op,f->'value');
   else raise exception 'Invalid query'; end if;
  end loop;
  field:=coalesce(p_input->>'sort','created_at');
  if field in ('password','auth_user_id') or not exists(select 1 from information_schema.columns where table_schema='public' and information_schema.columns.table_name=v_table and column_name=field) then raise exception 'Invalid query'; end if;
  lim:=coalesce((p_input->>'limit')::integer,500);
  if lim<1 or lim>10000 then raise exception 'Invalid query'; end if;
  sql_text:=format('select coalesce(jsonb_agg(x.row),''[]''::jsonb) from (select to_jsonb(t)-''password''-''auth_user_id'' as row from public.%I t where %s order by t.%I %s,t.id limit %s) x',v_table,clause,field,case when (p_input->>'ascending')::boolean then 'asc' else 'desc' end,lim);
  execute sql_text into rows; return rows;
 elsif p_action='saveClient' then
  payload:=p_input->'data';
  if jsonb_typeof(payload)<>'object' then raise exception 'Invalid account parameters'; end if;
  if p_input->>'id' is null then
   select * into target from public.clients where username=payload->>'parent_username' and id=any(allowed_ids) and status='active' for update;
   if target.id is null or lower(a.role) in ('bettor','client','user') then raise exception 'Permission denied'; end if;
   if coalesce(payload->>'username','') !~ '^[a-zA-Z0-9_]{3,50}$' or length(coalesce(payload->>'password',''))<8 or octet_length(payload->>'password')>72 then raise exception 'Invalid account parameters'; end if;
   if exists(select 1 from public.clients where lower(username)=lower(payload->>'username')) then raise exception 'Username already exists'; end if;
   if coalesce((payload->>'downline_share')::numeric,0)<0 or coalesce((payload->>'downline_share')::numeric,0)>target.downline_share then raise exception 'Invalid account share'; end if;
   insert into public.clients(username,password,role,parent_username,status,phone,reference,notes,downline_share)
   values(payload->>'username',extensions.crypt(payload->>'password',extensions.gen_salt('bf',10)),payload->>'role',target.username,
    case when payload->>'status'='active' then 'active' else 'inactive' end,payload->>'phone',payload->>'reference',payload->>'notes',coalesce((payload->>'downline_share')::numeric,0)) returning * into target;
  else
   select * into target from public.clients where id=(p_input->>'id')::uuid and id=any(allowed_ids) for update;
   if target.id is null then raise exception 'Permission denied'; end if;
   if target.id=a.id and (payload-'password')<>'{}'::jsonb then raise exception 'Self account changes require administrator'; end if;
   if exists(select 1 from jsonb_object_keys(payload) k where k not in ('password','full_name','phone','reference','notes','status','betting_allowed','can_settle_pl','commission')) then raise exception 'Use the dedicated financial service'; end if;
   if payload ? 'can_settle_pl' and (payload->>'can_settle_pl')::boolean is distinct from target.can_settle_pl and lower(a.role)<>'company' then raise exception 'Permission denied'; end if;
   if payload ? 'commission' and (payload->>'commission')::numeric is distinct from target.commission then
    amount:=(payload->>'commission')::numeric;
    if lower(a.role) not in ('company','superadmin') or amount is null or amount<0 or amount>100 or amount::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid commission parameters'; end if;
    insert into public.exchange_commission_rules(client_id,rate,actor_id,reason) values(target.id,amount,a.id,'Account editor commission change');
   end if;
   if payload ? 'password' then
    if length(payload->>'password')<8 or octet_length(payload->>'password')>72 then raise exception 'Password must contain 8 to 72 bytes'; end if;
    update public.clients set password=extensions.crypt(payload->>'password',extensions.gen_salt('bf',10)) where id=target.id;
    delete from public.exchange_sessions where client_id=target.id;
   end if;
   if payload ? 'status' and payload->>'status' not in ('active','inactive','locked','suspended') then raise exception 'Invalid account parameters'; end if;
   update public.clients set full_name=coalesce(payload->>'full_name',full_name),phone=coalesce(payload->>'phone',phone),reference=coalesce(payload->>'reference',reference),notes=coalesce(payload->>'notes',notes),
    status=coalesce(payload->>'status',status),betting_allowed=coalesce((payload->>'betting_allowed')::boolean,betting_allowed),can_settle_pl=coalesce((payload->>'can_settle_pl')::boolean,can_settle_pl),commission=coalesce((payload->>'commission')::numeric,commission)
    where id=target.id returning * into target;
  end if;
  if p_input->>'id' is null then
   insert into public.exchange_commission_rules(client_id,rate,actor_id,reason) values(target.id,target.commission,a.id,'Initial account commission');
  end if;
  return to_jsonb(target)-'password'-'auth_user_id';
 elsif p_action='settlePL' then
  if lower(a.role) in ('client','bettor','user') or (lower(a.role)<>'company' and a.can_settle_pl is not true) then raise exception 'Settlement permission required'; end if;
  req:=(p_input->>'requestId')::uuid;amount:=(p_input->>'amount')::numeric;
  if req is null or amount is null or amount::text in ('NaN','Infinity','-Infinity') or amount<=0 or amount<>round(amount,2) then raise exception 'Invalid settlement amount'; end if;
  perform pg_advisory_xact_lock(hashtextextended(a.id::text||req::text,0));
  select * into audit from public.exchange_audit where actor_id=a.id and request_id=req;
  if audit.id is not null then
   if audit.action<>p_action or audit.input<>p_input then raise exception 'Request ID conflict'; end if;
   return audit.result;
  end if;
  select * into target from public.clients where id=(p_input->>'clientId')::uuid and id=any(allowed_ids) for update;
  if target.id is null then raise exception 'Permission denied'; end if;
  if target.pl_downline<amount then raise exception 'Insufficient P/L balance'; end if;
  update public.clients set cash=cash+amount,pl_downline=pl_downline-amount where id=target.id;
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,operator_username,request_id)
   values(target.username,'pl_settlement',amount,coalesce(p_input->>'reason','P/L transfer'),target.cash,target.cash+amount,a.username,req);
  result:=jsonb_build_object('success',true,'balance',target.cash+amount);
  insert into public.exchange_audit(actor_id,action,request_id,input,result) values(a.id,p_action,req,p_input,result);
  return result;
 elsif p_action='authorizeFeed' then
  if lower(a.role) not in ('company','superadmin') then raise exception 'Permission denied'; end if;
  return '{"success":true}';
 elsif p_action='markets' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from (
   select m.*, coalesce((select jsonb_agg(to_jsonb(q)) from public.exchange_quotes q where q.market_id=m.id),'[]') quotes
   from public.exchange_markets m where (p_input->>'eventId' is null or m.event_id=p_input->>'eventId')
    and (p_input->>'matchId' is null or m.match_id::text=p_input->>'matchId')
   order by m.observed_at desc,m.id limit 200
  ) x;
  return rows;
 elsif p_action='account' then
  select * into target from public.clients where id=coalesce((p_input->>'clientId')::uuid,a.id) and id=any(allowed_ids);
  if target.id is null then raise exception 'Permission denied'; end if;
  return (to_jsonb(target)-'password'-'auth_user_id') || jsonb_build_object('availableBalance',case when lower(target.role) in ('client','bettor','user')
     then coalesce(target.cash,0)+coalesce(target.credit_remaining,0)+coalesce(target.pl_downline,0)
     else target.cash end,'exposure',
   coalesce((select sum(coalesce(reserved,case when bet_type='lay' then stake*(odds-1) else stake end)) from public.bets where user_email=target.username and status='pending'),0));
 elsif p_action='betStatus' then
  select * into b from public.bets where id=(p_input->>'betId')::uuid and user_email=any(allowed_names);
  if b.id is null then raise exception 'Bet not found'; end if;
  return to_jsonb(b);
 elsif p_action='placeBet' then
  -- One account lock serializes concurrent placement; market lock serializes settlement/ingest.
  select * into m from public.exchange_markets where id=p_input->>'marketId' for update;
  select * into a from public.clients where id=a.id for update;
  req := (p_input->>'requestId')::uuid;
  amount := (p_input->>'stake')::numeric; price := (p_input->>'odds')::numeric;
  if req is null or amount is null or amount::text in ('NaN','Infinity','-Infinity') or amount<=0 or amount>1000000 or amount<>round(amount,2)
   or price is null or price::text in ('NaN','Infinity','-Infinity') or price<=1 or price>1000
   or coalesce(p_input->>'side','') not in ('back','lay') then raise exception 'Invalid bet parameters'; end if;
  select * into b from public.bets where user_email=a.username and request_id=req;
  if b.id is not null then
   if b.exchange_market_id is distinct from p_input->>'marketId' or b.runner_id is distinct from p_input->>'runnerId'
    or b.bet_type<>p_input->>'side' or b.stake<>amount or b.odds<>price then raise exception 'Request ID conflict'; end if;
   return to_jsonb(b);
  end if;
  if a.status<>'active' or a.betting_allowed is not true or lower(a.role) not in ('client','bettor','user') then raise exception 'Betting is disabled'; end if;
  if m.id is null or m.status<>'OPEN' or m.betting_locked or m.delayed or m.settled_at is not null or m.observed_at<clock_timestamp()-interval '15 seconds' then raise exception 'Market unavailable or stale'; end if;
  select * into q from public.exchange_quotes where market_id=m.id and runner_id=p_input->>'runnerId' and side=p_input->>'side' for update;
  if q.id is null or q.observed_at<clock_timestamp()-interval '15 seconds' or q.odds<>price then raise exception 'Odds changed; refresh and confirm'; end if;
  if q.size-q.consumed<amount then raise exception 'Insufficient quoted liquidity'; end if;
  liability := case when q.side='lay' then ceil(amount*(price-1)*100)/100 else amount end;
  if coalesce(a.cash,0)+coalesce(a.credit_remaining,0)+coalesce(a.pl_downline,0)<liability
     then raise exception 'Insufficient balance'; end if;
  select * into rule from public.exchange_commission_rules where client_id=a.id order by created_at desc,id desc limit 1;
  update public.clients set cash=cash-liability where id=a.id;
  update public.exchange_quotes set consumed=consumed+amount where id=q.id;
  insert into public.bets(user_email,match_id,match_title,selection,bet_type,stake,odds,potential_win,status,exchange_market_id,runner_id,request_id,reserved,commission_rule_id,commission_rate)
  select a.username,m.match_id::text,title,q.selection,q.side,amount,price,case when q.side='back' then round(amount*(price-1),2) else amount end,'pending',m.id,q.runner_id,req,liability,rule.id,coalesce(rule.rate,0)
  from public.matches where id=m.match_id returning * into b;
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,operator_username,request_id,
     combined_before_balance,combined_after_balance)
   values(a.username,'bet_reserve',-liability,'Bet reserve '||b.id,a.cash,a.cash-liability,a.username,req,
     coalesce(a.cash,0)+coalesce(a.credit_remaining,0)+coalesce(a.pl_downline,0),
     coalesce(a.cash,0)+coalesce(a.credit_remaining,0)+coalesce(a.pl_downline,0)-liability);
  return to_jsonb(b);
 elsif p_action='lockMarket' then
  if lower(a.role) not in ('company','superadmin') then raise exception 'Permission denied'; end if;
  req:=(p_input->>'requestId')::uuid;
  if req is null then raise exception 'Request ID required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(a.id::text||req::text,0));
  select * into audit from public.exchange_audit where actor_id=a.id and request_id=req;
  if audit.id is not null then
   if audit.action<>p_action or audit.input<>p_input then raise exception 'Request ID conflict'; end if;
   return audit.result;
  end if;
  update public.exchange_markets set betting_locked=coalesce((p_input->>'locked')::boolean,true) where id=p_input->>'marketId' and settled_at is null returning * into m;
  if m.id is null then raise exception 'Market not found'; end if;
  result:=jsonb_build_object('success',true,'locked',m.betting_locked);
  insert into public.exchange_audit(actor_id,action,request_id,input,result) values(a.id,p_action,req,p_input,result);
  return result;
 elsif p_action='settle' then
  if lower(a.role) not in ('company','superadmin') or (lower(a.role)<>'company' and a.can_settle_pl is not true) then raise exception 'Settlement permission required'; end if;
  req := (p_input->>'requestId')::uuid;
  if req is null or length(trim(coalesce(p_input->>'reason','')))<5 then raise exception 'Settlement reason and request ID required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(a.id::text||req::text,0));
  select * into audit from public.exchange_audit where actor_id=a.id and request_id=req;
  if audit.id is not null then
   if audit.action<>p_action or audit.input<>p_input then raise exception 'Request ID conflict'; end if;
   return audit.result;
  end if;
  select * into m from public.exchange_markets where id=p_input->>'marketId' for update;
  winner:=p_input->>'winnerId'; is_void:=coalesce((p_input->>'void')::boolean,false);
  if m.id is null then raise exception 'Market not found'; end if;
  if m.settled_at is not null then raise exception 'Market already settled'; end if;
  if m.status not in ('CLOSED','SUSPENDED') and not m.betting_locked then raise exception 'Suspend or close market before settlement'; end if;
  if not is_void and not exists(select 1 from jsonb_array_elements(m.runners) r where r->>'id'=winner) then raise exception 'Invalid winning runner'; end if;
  -- Scope is checked across the whole market. Never partially settle an inaccessible account.
  if exists(select 1 from public.bets where exchange_market_id=m.id and status='pending' and not(user_email=any(allowed_names))) then raise exception 'Market contains accounts outside your downline'; end if;
  -- Deterministic account order avoids cross-market deadlocks.
  perform c.id from public.clients c where c.username in(select user_email from public.bets where exchange_market_id=m.id and status='pending') order by c.id for update;
  for b in select * from public.bets where exchange_market_id=m.id and status='pending' order by id for update loop
   pnl:=case when is_void then 0 when b.bet_type='back' then case when b.runner_id=winner then round(b.stake*(b.odds-1),2) else -b.stake end
     else case when b.runner_id=winner then -b.reserved else b.stake end end;
   fee:=round(greatest(pnl,0)*b.commission_rate/100,2); payout:=b.reserved+pnl-fee;
   select * into target from public.clients where username=b.user_email;
   previous:=target.cash;
   update public.clients set cash=cash+payout where username=b.user_email;
   update public.bets set status=case when is_void then 'void' when pnl>0 then 'won' else 'lost' end,profit=pnl-fee,commission_amount=fee,updated_at=now() where id=b.id;
   insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,operator_username,
     combined_before_balance,combined_after_balance)
    values(b.user_email,'bet_settlement',payout,'Settlement '||b.id||'; commission '||fee,previous,previous+payout,a.username,
     coalesce(previous,0)+coalesce(target.credit_remaining,0)+coalesce(target.pl_downline,0),
     coalesce(previous,0)+coalesce(target.credit_remaining,0)+coalesce(target.pl_downline,0)+payout);
   changed:=changed+1;
  end loop;
  result:=jsonb_build_object('success',true,'marketId',m.id,'totalBetsSettled',changed,'requestId',req);
  update public.exchange_markets set status='CLOSED',settled_at=now(),settled_result=p_input where id=m.id;
  insert into public.exchange_audit(actor_id,action,request_id,input,result) values(a.id,p_action,req,p_input,result);
  return result;
 elsif p_action='setCommission' then
  if lower(a.role) not in ('company','superadmin') then raise exception 'Permission denied'; end if;
  req:=(p_input->>'requestId')::uuid; amount:=(p_input->>'rate')::numeric;
  if req is null or amount is null or amount::text in ('NaN','Infinity','-Infinity') or amount<0 or amount>100 or amount<>round(amount,2)
   or length(trim(coalesce(p_input->>'reason','')))<5 then raise exception 'Invalid commission parameters'; end if;
  perform pg_advisory_xact_lock(hashtextextended(a.id::text||req::text,0));
  select * into audit from public.exchange_audit where actor_id=a.id and request_id=req;
  if audit.id is not null then
   if audit.action<>p_action or audit.input<>p_input then raise exception 'Request ID conflict'; end if;
   return audit.result;
  end if;
  select * into target from public.clients where id=(p_input->>'clientId')::uuid and id=any(allowed_ids) for update;
  if target.id is null then raise exception 'Permission denied'; end if;
  insert into public.exchange_commission_rules(client_id,rate,actor_id,reason) values(target.id,amount,a.id,p_input->>'reason') returning * into rule;
  update public.clients set commission=amount where id=target.id;
  result:=to_jsonb(rule);
  insert into public.exchange_audit(actor_id,action,request_id,input,result) values(a.id,p_action,req,p_input,result);
  return result;
 elsif p_action in ('reports','commissionHistory') then
  if p_input->>'clientId' is not null then
   select * into target from public.clients where id=(p_input->>'clientId')::uuid and id=any(allowed_ids);
   if target.id is null then raise exception 'Permission denied'; end if;
   allowed_ids:=array[target.id]; allowed_names:=array[target.username];
  end if;
  if p_action='commissionHistory' then
   select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from (select * from public.exchange_commission_rules where client_id=any(allowed_ids) order by created_at desc,id desc limit 500) x;
   return rows;
  end if;
  since_at:=coalesce((p_input->>'from')::timestamptz,now()-interval '30 days');
  until_at:=coalesce((p_input->>'to')::timestamptz,now());
  lim:=coalesce((p_input->>'limit')::integer,500);
  if lim<1 or lim>10000 or since_at>=until_at or until_at-since_at>interval '366 days' then raise exception 'Invalid report range or limit'; end if;
  if p_input->>'kind'='ledger' then
   select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from (select * from public.transactions where client_username=any(allowed_names) and created_at>=since_at and created_at<until_at order by created_at,id limit lim+1) x;
  elsif p_input->>'kind'='bets' then
   select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from (select * from public.bets where user_email=any(allowed_names) and created_at>=since_at and created_at<until_at
    and (p_input->>'status' is null or status=p_input->>'status') and (p_input->>'matchId' is null or match_id=p_input->>'matchId') order by created_at,id limit lim+1) x;
  else raise exception 'Invalid report kind'; end if;
  return jsonb_build_object('rows',case when jsonb_array_length(rows)>lim then rows-lim else rows end,'truncated',jsonb_array_length(rows)>lim,'from',since_at,'to',until_at);
 end if;
 raise exception 'Unknown action';
end $$;

