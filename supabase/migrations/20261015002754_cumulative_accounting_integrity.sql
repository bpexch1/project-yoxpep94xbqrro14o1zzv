-- Forward-only accounting correction. No account balances or historical allocations are rewritten.
-- Existing bet snapshots retain their recorded legacy algorithm; new bets use cumulative-v2.
set local lock_timeout='5s';
set local statement_timeout='60s';
do $guard$
begin
 if md5(pg_get_functiondef('public.exchange_request(text,text,jsonb)'::regprocedure)) <> '0d0205eb49d6dcb1a181188faaf7b206'
 or md5(pg_get_functiondef('public.manual_wallet_transfer_session(text,uuid,text,text,numeric,text,uuid)'::regprocedure)) <> '8e22434f9d2658761b6f4b4d7f3dd3e3'
 then raise exception 'Accounting functions changed; review migration before applying'; end if;
end;
$guard$;
-- Distinct timestamps make back-to-back commission changes deterministic.
alter table public.exchange_commission_rules alter column created_at set default clock_timestamp();
alter table public.exchange_bet_share_snapshot add column allocation_method text not null default 'legacy_remaining_v1'
 check (allocation_method in ('legacy_remaining_v1','cumulative_v2'));


CREATE OR REPLACE FUNCTION public.exchange_snapshot_bet_shares(p_bet_id uuid, p_bettor_username text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 bettor public.clients%rowtype;
 parent public.clients%rowtype;
 next_parent text;
 visited text[];
 depth integer:=0;
 root_found boolean:=false;
 lower_share numeric:=0;
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
  if parent.id is null or parent.status<>'active' or lower(parent.role) not in ('company','superadmin','admin','supermaster','master') then
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
  if (case when root_found then 100 else parent.downline_share end)<lower_share then
   raise exception 'Invalid cumulative share hierarchy; administrator review required';
  end if;
  lower_share:=case when root_found then 100 else parent.downline_share end;
  insert into public.exchange_bet_share_snapshot
   (bet_id,account_id,hierarchy_level,account_username,share_rate,is_root,allocation_method)
  values(p_bet_id,parent.id,depth,parent.username,
   case when root_found then 100 else parent.downline_share end,root_found,'cumulative_v2');
  if root_found then exit; end if;
  next_parent:=parent.parent_username;
 end loop;
 if not root_found then raise exception 'Company root missing from P/L hierarchy'; end if;
end;
$function$;


CREATE OR REPLACE FUNCTION public.exchange_distribute_bet_pl(p_bet_id uuid, p_bettor_net_pl numeric, p_actor_username text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
 lower_share numeric:=0;
 cumulative_amount numeric:=0;
 next_cumulative numeric;
 method text;
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
 if (select count(distinct allocation_method) from public.exchange_bet_share_snapshot where bet_id=p_bet_id)<>1 then
  raise exception 'Inconsistent P/L snapshot methods';
 end if;
 select allocation_method into method from public.exchange_bet_share_snapshot where bet_id=p_bet_id limit 1;
 house_total:=round(-p_bettor_net_pl,2);
 remaining:=house_total;
 for rule in select * from public.exchange_bet_share_snapshot
             where bet_id=p_bet_id order by hierarchy_level loop
  select * into ancestor from public.clients where id=rule.account_id for update;
  if ancestor.id is null then raise exception 'Snapshotted upline no longer exists'; end if;
  before_pl:=ancestor.pl_downline;
  combined_before:=coalesce(ancestor.cash,0)+coalesce(ancestor.credit_remaining,0)+coalesce(before_pl,0);
  if method='cumulative_v2' then
   if rule.share_rate<lower_share then raise exception 'Invalid cumulative share snapshot'; end if;
   -- Rounded cumulative boundaries avoid over-allocation of tiny amounts.
   next_cumulative:=case when rule.is_root then house_total else round(house_total*rule.share_rate/100,2) end;
   allocation:=next_cumulative-cumulative_amount;
   cumulative_amount:=next_cumulative;
   lower_share:=rule.share_rate;
  else
   allocation:=case when rule.is_root then remaining else round(remaining*rule.share_rate/100,2) end;
  end if;
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
$function$;


CREATE OR REPLACE FUNCTION public.exchange_request(p_token text, p_action text, p_input jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
 if p_action in ('placeBet','settle','settlePL','saveClient') then
  lock table public.clients in share row exclusive mode;
 end if;
 if p_action='logout' then
  delete from public.exchange_sessions where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
  return '{"success":true}';
 end if;
 with recursive scope(id,username) as (
  select a.id,a.username union select c.id,c.username from public.clients c join scope s on c.parent_username=s.username
 ) select array_agg(id),array_agg(username) into allowed_ids,allowed_names from scope;
 if p_action='markets' or (p_action='entityRead' and p_input->>'table'='matches') then
  perform public.exchange_refresh_demo_markets();
 end if;
 if p_action='walletLedger' then
  select * into target from public.clients where username=p_input->>'username' and id=any(allowed_ids);
  if target.id is null then raise exception 'Permission denied'; end if;
  return public.exchange_wallet_ledger(target.username,p_input->>'wallet',
    (p_input->>'from')::timestamptz,(p_input->>'to')::timestamptz,coalesce((p_input->>'limit')::integer,10000));
 elsif p_action='entityRead' then
  v_table:=p_input->>'table';
  if v_table not in ('clients','public_clients','bets','transactions','matches','exchange_pl_allocations') then raise exception 'Permission denied'; end if;
  if v_table='public_clients' then v_table:='clients'; end if;
  clause:=case v_table when 'clients' then format('t.id=any(%L::uuid[])',allowed_ids)
    when 'exchange_pl_allocations' then format('t.account_id=any(%L::uuid[])',allowed_ids)
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
  if lower(a.role) not in ('company','superadmin','admin','supermaster','master') then raise exception 'Permission denied'; end if;
  payload:=p_input->'data';
  if jsonb_typeof(payload)<>'object' then raise exception 'Invalid account parameters'; end if;
  if p_input->>'id' is null then
   select * into target from public.clients where username=payload->>'parent_username' and id=any(allowed_ids) and status='active' for update;
   if target.id is null or lower(a.role) in ('bettor','client','user') then raise exception 'Permission denied'; end if;
   if coalesce(payload->>'username','') !~ '^[a-zA-Z0-9_]{3,50}$' or length(coalesce(payload->>'password',''))<8 or octet_length(payload->>'password')>72 then raise exception 'Invalid account parameters'; end if;
   if exists(select 1 from public.clients where lower(username)=lower(payload->>'username')) then raise exception 'Username already exists'; end if;
   if coalesce((payload->>'downline_share')::numeric,0)<0 or coalesce((payload->>'downline_share')::numeric,0)>(case when lower(target.role)='company' then 100 else target.downline_share end) then raise exception 'Invalid account share'; end if;
   insert into public.clients(username,password,role,parent_username,status,phone,reference,notes,downline_share)
   values(payload->>'username',extensions.crypt(payload->>'password',extensions.gen_salt('bf',10)),payload->>'role',target.username,
    case when payload->>'status'='active' then 'active' else 'inactive' end,payload->>'phone',payload->>'reference',payload->>'notes',coalesce((payload->>'downline_share')::numeric,0)) returning * into target;
  else
   select * into target from public.clients where id=(p_input->>'id')::uuid and id=any(allowed_ids) for update;
   if target.id is null then raise exception 'Permission denied'; end if;
   if target.id=a.id and (payload-'password')<>'{}'::jsonb then raise exception 'Self account changes require administrator'; end if;
   if exists(select 1 from jsonb_object_keys(payload) k where k not in ('password','full_name','phone','reference','notes','status','betting_allowed','can_settle_pl','commission','downline_share')) then raise exception 'Use the dedicated financial service'; end if;
   if payload ? 'downline_share' then
    amount:=(payload->>'downline_share')::numeric;
    if amount is null or amount::text in ('NaN','Infinity','-Infinity') or amount<>round(amount,2) then raise exception 'Invalid account share'; end if;
    -- Trigger checks parent ceiling and existing children under the same table lock.
    update public.clients set downline_share=amount where id=target.id;
    insert into public.exchange_audit(actor_id,action,request_id,input,result)
    values(a.id,'updateShare',gen_random_uuid(),jsonb_build_object('clientId',target.id,'previous',target.downline_share,'share',amount),jsonb_build_object('success',true));
   end if;
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
  if lower(a.role) not in ('company','superadmin','admin','supermaster','master') or (lower(a.role)<>'company' and a.can_settle_pl is not true) then raise exception 'Settlement permission required'; end if;
  req:=(p_input->>'requestId')::uuid;amount:=(p_input->>'amount')::numeric;
  if req is null or amount is null or amount::text in ('NaN','Infinity','-Infinity') or amount=0 or amount<>round(amount,2) then raise exception 'Invalid settlement amount'; end if;
  perform pg_advisory_xact_lock(hashtextextended(a.id::text||req::text,0));
  select * into audit from public.exchange_audit where actor_id=a.id and request_id=req;
  if audit.id is not null then
   if audit.action<>p_action or audit.input<>p_input then raise exception 'Request ID conflict'; end if;
   return audit.result;
  end if;
  select * into target from public.clients where id=(p_input->>'clientId')::uuid and id=any(allowed_ids) for update;
  if target.id is null then raise exception 'Permission denied'; end if;
  if target.id=a.id then raise exception 'Permission denied'; end if;
  if lower(target.role) not in ('superadmin','admin','supermaster','master','bettor','client','user') then raise exception 'Permission denied'; end if;
  if sign(target.pl_downline)<>sign(amount) or abs(target.pl_downline)<abs(amount) then raise exception 'Insufficient P/L balance'; end if;
  update public.clients set cash=cash+amount,pl_downline=pl_downline-amount where id=target.id;
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,operator_username,request_id)
   values(target.username,'pl_settlement',amount,coalesce(p_input->>'reason','P/L transfer'),target.cash,target.cash+amount,a.username,req);
  update public.transactions set combined_before_balance=target.cash+target.credit_remaining+target.pl_downline,
   combined_after_balance=target.cash+target.credit_remaining+target.pl_downline where operator_username=a.username and request_id=req;
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,operator_username,combined_before_balance,combined_after_balance)
   values(target.username,'pl_transfer',-amount,coalesce(p_input->>'reason','P/L transfer'),target.pl_downline,target.pl_downline-amount,a.username,
    target.cash+target.credit_remaining+target.pl_downline,target.cash+target.credit_remaining+target.pl_downline);
  result:=jsonb_build_object('success',true,'balance',target.cash+amount,'plDownline',target.pl_downline-amount);
  insert into public.exchange_audit(actor_id,action,request_id,input,result) values(a.id,p_action,req,p_input,result);
  return result;
 elsif p_action='authorizeFeed' then
  if lower(a.role) not in ('company','superadmin') then raise exception 'Permission denied'; end if;
  return '{"success":true}';
 elsif p_action='markets' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from (
   select market_row.*, coalesce((select jsonb_agg(to_jsonb(quote_row)) from public.exchange_quotes quote_row where quote_row.market_id=market_row.id),'[]') quotes
   from public.exchange_markets market_row where (p_input->>'eventId' is null or market_row.event_id=p_input->>'eventId')
    and (p_input->>'matchId' is null or market_row.match_id::text=p_input->>'matchId')
   order by market_row.observed_at desc,market_row.id limit 200
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
  if exists(select 1 from public.studio_rounds where market_id=m.id and closes_at<=clock_timestamp()) then raise exception 'Market unavailable or stale'; end if;
  if m.id is not null and not m.is_demo then raise exception 'Only demo markets are enabled'; end if;
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
  if b.id is null then raise exception 'Unable to reserve bet for this match'; end if;
  perform public.exchange_snapshot_bet_shares(b.id,a.username);
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
  if exists(select 1 from public.studio_rounds where market_id=p_input->>'marketId') then raise exception 'Studio rounds settle automatically'; end if;
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
   if b.reserved is null or b.reserved < 0 or b.commission_rate is null or b.commission_rate not between 0 and 100 then
    raise exception 'Legacy bet lacks funding/commission snapshot. Manual review required before settlement';
   end if;
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
   if not is_void then
    perform public.exchange_distribute_bet_pl(b.id,pnl-fee,a.username);
   end if;
   changed:=changed+1;
  end loop;
  result:=jsonb_build_object('success',true,'marketId',m.id,'totalBetsSettled',changed,'requestId',req,
   'winningSide',case when is_void then 'Void' else (select r->>'name' from jsonb_array_elements(m.runners) r where r->>'id'=winner) end,
   'settlements',coalesce((select jsonb_agg(jsonb_build_object('username',user_email,'stake',stake,'status',status,'profit',profit,'commission',commission_amount)) from public.bets where exchange_market_id=m.id),'[]'::jsonb),
   'allocations',coalesce((select jsonb_agg(to_jsonb(x)) from (select pa.account_username as username,min(pa.hierarchy_level) as level,sum(pa.allocated_pl) as amount from public.exchange_pl_allocations pa join public.bets sb on sb.id=pa.bet_id where sb.exchange_market_id=m.id group by pa.account_username order by min(pa.hierarchy_level)) x),'[]'::jsonb));
  if m.is_demo then update public.matches set status='completed' where id=m.match_id; end if;
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
  if p_input->>'kind'='dailyPL' then
   with scoped_bets as (
    select sb.* from public.bets sb where sb.user_email=any(allowed_names)
      and sb.status in ('won','lost','void') and sb.profit is not null
      and sb.updated_at>=since_at and sb.updated_at<until_at
   ), entries as (
    select user_email as username,profit as amount from scoped_bets
    union all
    select pa.account_username,pa.allocated_pl from public.exchange_pl_allocations pa join scoped_bets sb on sb.id=pa.bet_id
   ) select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from
    (select e.username,sum(e.amount) as amount from entries e group by e.username order by e.username limit lim+1) x;
  elsif p_input->>'kind'='ledger' then
   select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from (select * from public.transactions where client_username=any(allowed_names) and created_at>=since_at and created_at<until_at order by created_at,id limit lim+1) x;
  elsif p_input->>'kind'='bets' then
   select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from (select * from public.bets where user_email=any(allowed_names) and created_at>=since_at and created_at<until_at
    and (p_input->>'status' is null or status=p_input->>'status') and (p_input->>'matchId' is null or match_id=p_input->>'matchId') order by created_at,id limit lim+1) x;
  else raise exception 'Invalid report kind'; end if;
  return jsonb_build_object('rows',case when jsonb_array_length(rows)>lim then rows-lim else rows end,'truncated',jsonb_array_length(rows)>lim,'from',since_at,'to',until_at);
 end if;
 raise exception 'Unknown action';
end;
$function$;


CREATE OR REPLACE FUNCTION public.manual_wallet_transfer_session(p_token text, p_client_id uuid, p_wallet text, p_direction text, p_amount numeric, p_description text, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  -- Serializes financial transfers and hierarchy edits. No stale browser balances are used.
  lock table public.clients in share row exclusive mode;
  -- The caller identity comes exclusively from the active server-side session.
  select c.* into actor from public.clients c
    join public.exchange_sessions s on s.client_id = c.id
   where s.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and s.expires_at > now() and c.status = 'active';
  if actor.id is null then raise exception 'Authentication required'; end if;
  if lower(actor.role) not in ('company','superadmin','admin','supermaster','master') then
    raise exception 'Administrator permission required';
  end if;
  select * into target from public.clients where id = p_client_id;
  if target.id is null or target.id = actor.id then raise exception 'Select a downline account'; end if;
  if lower(target.role) not in ('superadmin','admin','supermaster','master','bettor','client','user') then raise exception 'Select an active hierarchy account'; end if;
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
    return jsonb_build_object('success',true,'transactionId',prior.id,'afterBalance',prior.after_balance,'availableBalance',coalesce(prior.combined_after_balance,prior.after_balance),'replayed',true);
  end if;

  combined_before := coalesce(target.cash,0) + coalesce(target.credit_remaining,0) + coalesce(target.pl_downline,0);
  combined_after := combined_before + signed_amount;
  before_amount := case when p_wallet = 'cash' then target.cash else target.credit_remaining end;
  after_amount := before_amount + signed_amount;
  -- Credit cannot be withdrawn below zero. Cash can become negative up to the
  -- account's available credit plus P/L, as in the original Cash screen.
  if p_wallet = 'credit' and (after_amount < 0 or (lower(target.role) in ('client','bettor','user') and p_direction='withdraw' and combined_after<0)) then raise exception 'Insufficient credit balance'; end if;
  if p_wallet = 'cash' and p_direction = 'withdraw'
     and p_amount > greatest(0, target.cash + target.credit_remaining + target.pl_downline) then
    raise exception 'Insufficient cash balance';
  end if;
  -- Cash movement must not consume the upline's credit limit.
  if p_wallet = 'credit' and p_direction = 'deposit' and lower(actor.role) <> 'company'
     and actor.credit_remaining < p_amount then
    raise exception 'Insufficient upline credit limit';
  end if;
  if p_wallet='cash' and p_direction='deposit' and lower(actor.role)<>'company' and p_amount>greatest(0,actor.cash+actor.credit_remaining+actor.pl_downline) then
    raise exception 'Insufficient upline available balance';
  end if;
  if p_wallet = 'cash' then
    update public.clients set cash = after_amount,
      balance_upline = balance_upline + signed_amount where id = target.id;
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
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,operator_username,counterparty_username,combined_before_balance,combined_after_balance)
  values(actor.username,p_wallet,-signed_amount,'Transfer with '||target.username||' ('||initcap(p_wallet)||')',
   case when p_wallet='cash' then actor.cash else actor.credit_remaining end,
   case when p_wallet='cash' then actor.cash else actor.credit_remaining end-signed_amount,
   actor.username,target.username,actor.cash+actor.credit_remaining+actor.pl_downline,actor.cash+actor.credit_remaining+actor.pl_downline-signed_amount);
  return jsonb_build_object('success',true,'transactionId',ledger_id,'afterBalance',after_amount,'availableBalance',combined_after,'replayed',false);
end;
$function$;


-- Only changed shares are validated: historical inconsistent rows remain intact.
create or replace function public.enforce_bpexch_account_hierarchy()
returns trigger language plpgsql security invoker set search_path='' as $guard$
declare parent public.clients%rowtype; expected text; ceiling numeric;
begin
 if tg_op='UPDATE' then
  if new.role is distinct from old.role or new.parent_username is distinct from old.parent_username then
   raise exception 'Role or parent changes require audited account transfer workflow';
  end if;
  if new.downline_share is not distinct from old.downline_share then return new; end if;
 end if;
 if lower(new.role)='company' then
  if tg_op='INSERT' then raise exception 'Company account bootstrap requires trusted provisioning'; end if;
  ceiling:=100;
 else
  select * into parent from public.clients where username=new.parent_username for update;
  if parent.id is null or parent.status<>'active' then raise exception 'Active parent account not found'; end if;
  expected:=case lower(parent.role) when 'company' then 'superadmin' when 'superadmin' then 'admin'
   when 'admin' then 'supermaster' when 'supermaster' then 'master' when 'master' then 'bettor' end;
  if tg_op='INSERT' and (expected is null or (new.role<>expected and not(lower(parent.role)='company' and new.role='bettor'))) then
   raise exception 'Invalid account hierarchy';
  end if;
  if lower(new.role) not in ('superadmin','admin','supermaster','master','bettor','client','user') then raise exception 'Invalid account hierarchy'; end if;
  ceiling:=case when lower(parent.role)='company' then 100 else parent.downline_share end;
 end if;
 if new.downline_share is null or new.downline_share::text in ('NaN','Infinity','-Infinity')
  or new.downline_share<0 or new.downline_share>ceiling or new.downline_share<>round(new.downline_share,2) then
  raise exception 'Invalid account share';
 end if;
 if tg_op='UPDATE' and exists(select 1 from public.clients where parent_username=new.username and downline_share>case when lower(new.role)='company' then 100 else new.downline_share end) then
  raise exception 'Share reduction would invalidate child allocations';
 end if;
 return new;
end;
$guard$;
drop trigger bpexch_guard_account_hierarchy on public.clients;
create trigger bpexch_guard_account_hierarchy before insert or update of role,parent_username,downline_share on public.clients
 for each row execute function public.enforce_bpexch_account_hierarchy();
revoke all on function public.enforce_bpexch_account_hierarchy() from public,anon,authenticated;

-- Financial history is append-only even for application service-role sessions.
create or replace function public.reject_accounting_history_mutation()
returns trigger language plpgsql security invoker set search_path='' as $guard$
begin raise exception 'Accounting history is immutable'; end;
$guard$;
revoke all on function public.reject_accounting_history_mutation() from public,anon,authenticated;
create trigger immutable_exchange_audit before update or delete on public.exchange_audit
 for each row execute function public.reject_accounting_history_mutation();
create trigger immutable_exchange_pl_allocations before update or delete on public.exchange_pl_allocations
 for each row execute function public.reject_accounting_history_mutation();

-- The application uses session-authenticated transfers. Retire the password-based
-- RPC so old Dealer permissions and obsolete accounting cannot remain a second path.
revoke all on function public.manual_wallet_transfer(text,text,uuid,text,text,numeric,text,uuid) from public,anon,authenticated,service_role;
