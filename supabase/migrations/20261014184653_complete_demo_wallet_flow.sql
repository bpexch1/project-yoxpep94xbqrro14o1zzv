-- Completes the virtual test workflow without changing historical account balances or bets.
set local lock_timeout='7s';
set local statement_timeout='60s';
alter table public.exchange_markets add column if not exists is_demo boolean not null default false;
alter table public.matches add column if not exists is_demo boolean not null default false;
-- Chronological wallet snapshots, including multiple writes in one transaction.
alter table public.transactions alter column created_at set default clock_timestamp();

create or replace function public.exchange_wallet_ledger(p_username text,p_wallet text,p_from timestamptz,p_to timestamptz,p_limit integer)
returns jsonb language plpgsql security invoker set search_path='' as $ledger$
declare kinds text[]; balance numeric; entries jsonb; prior public.transactions%rowtype; following public.transactions%rowtype;
begin
 if p_from is null or p_to is null or p_from>=p_to or p_to-p_from>interval '366 days' or p_limit not between 1 and 10000 then raise exception 'Invalid report range or limit'; end if;
 kinds:=case p_wallet when 'cash' then array['cash','bet_reserve','bet_settlement','pl_settlement']
  when 'credit' then array['credit'] when 'pl' then array['pl_share','pl_transfer']
  when 'combined' then array['cash','credit','bet_reserve','bet_settlement','pl_share','pl_settlement'] end;
 if kinds is null then raise exception 'Invalid ledger wallet'; end if;
 select * into prior from public.transactions where client_username=p_username and type=any(kinds) and created_at<p_from order by created_at desc,id desc limit 1;
 select * into following from public.transactions where client_username=p_username and type=any(kinds) and created_at>=p_from order by created_at,id limit 1;
 balance:=case when p_wallet='combined' then coalesce(prior.combined_after_balance,following.combined_before_balance)
  else coalesce(prior.after_balance,following.before_balance) end;
 -- If history exists but lacks a snapshot, leave opening balance unknown. Never invent a past balance.
 if prior.id is null and following.id is null then
  select case p_wallet when 'cash' then cash when 'credit' then credit_remaining when 'pl' then pl_downline
   else cash+credit_remaining+pl_downline end into balance from public.clients where username=p_username;
 end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into entries from (
  select id,created_at,description,type,
   case when p_wallet='combined' and combined_before_balance is not null and combined_after_balance is not null then combined_after_balance-combined_before_balance else amount end as amount,
   case when p_wallet='combined' then combined_before_balance else before_balance end as before_balance,
   case when p_wallet='combined' then combined_after_balance else after_balance end as after_balance
  from public.transactions where client_username=p_username and type=any(kinds) and created_at>=p_from and created_at<p_to order by created_at,id limit p_limit+1
 ) x;
 return jsonb_build_object('openingBalance',balance,'rows',case when jsonb_array_length(entries)>p_limit then entries-p_limit else entries end,'truncated',jsonb_array_length(entries)>p_limit);
end;
$ledger$;
revoke all on function public.exchange_wallet_ledger(text,text,timestamptz,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.exchange_wallet_ledger(text,text,timestamptz,timestamptz,integer) to service_role;

-- Server-generated virtual prices. Only explicitly marked demo markets are refreshed.
-- Settled markets stay settled; future calls create a separate new demo round.
create or replace function public.exchange_refresh_demo_markets()
returns void language plpgsql security invoker set search_path='' as $demo$
declare sport_name text; event_name text; market public.exchange_markets%rowtype; new_market_id text; event_key text; stamp timestamptz:=clock_timestamp(); price numeric; wave integer; batch jsonb; step integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('exchange_demo_refresh',0));
 foreach sport_name in array array['cricket','soccer'] loop
  select * into market from public.exchange_markets where is_demo and event_id like 'demo-'||sport_name||'-%' and settled_at is null order by observed_at desc limit 1 for update;
  if market.id is null then
   event_key:='demo-'||sport_name||'-'||gen_random_uuid()::text; new_market_id:=event_key||'-odds';
   event_name:=case sport_name when 'cricket' then 'Demo: Pakistan v Australia' else 'Demo: Lahore v Karachi' end;
   batch:=jsonb_build_array(jsonb_build_object('id',new_market_id,'eventId',event_key,'eventName',event_name,'sport',sport_name,'name','Match Odds','startTime',stamp,'status','OPEN','delayed',false,'observedAt',stamp,
    'runners',case sport_name when 'cricket' then '[{"id":"1","name":"Pakistan"},{"id":"2","name":"Australia"}]'::jsonb else '[{"id":"1","name":"Lahore"},{"id":"2","name":"Karachi"},{"id":"3","name":"The Draw"}]'::jsonb end,'quotes','[]'::jsonb));
   perform public.exchange_ingest(batch);
   update public.exchange_markets set is_demo=true where id=new_market_id returning * into market;
   update public.matches set is_demo=true,status='live' where id=market.match_id;
  end if;
  if market.status<>'OPEN' or market.betting_locked then continue; end if;
  step:=floor(extract(epoch from stamp)/10)::integer;
  -- Do not keep changing a displayed quote during its validity window.
  if exists(select 1 from public.exchange_quotes where exchange_quotes.market_id=market.id) and floor(extract(epoch from market.observed_at)/10)::integer=step then continue; end if;
  wave:=abs((step%8)-4);
  for event_key,event_name in select r->>'id',r->>'name' from jsonb_array_elements(market.runners) r loop
   price:=case event_key when '1' then 1.80+wave*0.04 when '2' then 2.20-wave*0.04 else 3.40+wave*0.06 end;
   insert into public.exchange_quotes(market_id,runner_id,selection,side,odds,size,observed_at) values
    (market.id,event_key,event_name,'back',price,1000000,stamp),(market.id,event_key,event_name,'lay',price+0.04,1000000,stamp)
    on conflict(market_id,runner_id,side) do update set odds=excluded.odds,observed_at=excluded.observed_at;
  end loop;
  update public.exchange_markets set observed_at=stamp,delayed=false where id=market.id;
  update public.matches set back_odds=(select odds from public.exchange_quotes where exchange_quotes.market_id=market.id and runner_id='1' and side='back'),
   lay_odds=(select odds from public.exchange_quotes where exchange_quotes.market_id=market.id and runner_id='1' and side='lay'),
   back_odds2=(select odds from public.exchange_quotes where exchange_quotes.market_id=market.id and runner_id='2' and side='back'),
   lay_odds2=(select odds from public.exchange_quotes where exchange_quotes.market_id=market.id and runner_id='2' and side='lay') where id=market.match_id;
 end loop;
end;
$demo$;
revoke all on function public.exchange_refresh_demo_markets() from public,anon,authenticated;
grant execute on function public.exchange_refresh_demo_markets() to service_role;

do $patch$
declare body text; old_anchor text; new_anchor text;
begin
 select pg_get_functiondef('public.exchange_request(text,text,jsonb)'::regprocedure) into body;
 old_anchor:=$old$ if p_action='entityRead' then$old$;
 new_anchor:=$new$ if p_action='markets' or (p_action='entityRead' and p_input->>'table'='matches') then
  perform public.exchange_refresh_demo_markets();
 end if;
 if p_action='walletLedger' then
  select * into target from public.clients where username=p_input->>'username' and id=any(allowed_ids);
  if target.id is null then raise exception 'Permission denied'; end if;
  return public.exchange_wallet_ledger(target.username,p_input->>'wallet',
    (p_input->>'from')::timestamptz,(p_input->>'to')::timestamptz,coalesce((p_input->>'limit')::integer,10000));
 elsif p_action='entityRead' then$new$;
 if (length(body)-length(replace(body,old_anchor,'')))/length(old_anchor)<>1 then raise exception 'Unexpected exchange_request definition; refusing patch'; end if;
 body:=replace(body,old_anchor,new_anchor);
 old_anchor:=$old$ if p_action='logout' then$old$;
 new_anchor:=$new$ if p_action in ('placeBet','settle','settlePL') then
  lock table public.clients in share row exclusive mode;
 end if;
 if p_action='logout' then$new$;
 if (length(body)-length(replace(body,old_anchor,'')))/length(old_anchor)<>1 then raise exception 'Unexpected exchange_request definition; refusing patch'; end if;
 body:=replace(body,old_anchor,new_anchor);
 old_anchor:=$old$('clients','public_clients','bets','transactions','matches')$old$;
 new_anchor:=$new$('clients','public_clients','bets','transactions','matches','exchange_pl_allocations')$new$;
 if (length(body)-length(replace(body,old_anchor,'')))/length(old_anchor)<>1 then raise exception 'Unexpected exchange_request definition; refusing patch'; end if;
 body:=replace(body,old_anchor,new_anchor);
 old_anchor:=$old$    when 'bets' then$old$;
 new_anchor:=$new$    when 'exchange_pl_allocations' then format('t.account_id=any(%L::uuid[])',allowed_ids)
    when 'bets' then$new$;
 if (length(body)-length(replace(body,old_anchor,'')))/length(old_anchor)<>1 then raise exception 'Unexpected exchange_request definition; refusing patch'; end if;
 body:=replace(body,old_anchor,new_anchor);
 old_anchor:=$old$   values(target.username,'pl_settlement',amount,coalesce(p_input->>'reason','P/L transfer'),target.cash,target.cash+amount,a.username,req);$old$;
 new_anchor:=$new$   values(target.username,'pl_settlement',amount,coalesce(p_input->>'reason','P/L transfer'),target.cash,target.cash+amount,a.username,req);
  update public.transactions set combined_before_balance=target.cash+target.credit_remaining+target.pl_downline,
   combined_after_balance=target.cash+target.credit_remaining+target.pl_downline where operator_username=a.username and request_id=req;
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,operator_username,combined_before_balance,combined_after_balance)
   values(target.username,'pl_transfer',-amount,coalesce(p_input->>'reason','P/L transfer'),target.pl_downline,target.pl_downline-amount,a.username,
    target.cash+target.credit_remaining+target.pl_downline,target.cash+target.credit_remaining+target.pl_downline);$new$;
 if (length(body)-length(replace(body,old_anchor,'')))/length(old_anchor)<>1 then raise exception 'Unexpected exchange_request definition; refusing patch'; end if;
 body:=replace(body,old_anchor,new_anchor);
 old_anchor:=$old$  result:=jsonb_build_object('success',true,'marketId',m.id,'totalBetsSettled',changed,'requestId',req);$old$;
 new_anchor:=$new$  result:=jsonb_build_object('success',true,'marketId',m.id,'totalBetsSettled',changed,'requestId',req,
   'winningSide',case when is_void then 'Void' else (select r->>'name' from jsonb_array_elements(m.runners) r where r->>'id'=winner) end,
   'settlements',coalesce((select jsonb_agg(jsonb_build_object('username',user_email,'stake',stake,'status',status,'profit',profit,'commission',commission_amount)) from public.bets where exchange_market_id=m.id),'[]'::jsonb),
   'allocations',coalesce((select jsonb_agg(to_jsonb(x)) from (select pa.account_username as username,min(pa.hierarchy_level) as level,sum(pa.allocated_pl) as amount from public.exchange_pl_allocations pa join public.bets sb on sb.id=pa.bet_id where sb.exchange_market_id=m.id group by pa.account_username order by min(pa.hierarchy_level)) x),'[]'::jsonb));
  if m.is_demo then update public.matches set status='completed' where id=m.match_id; end if;$new$;
 if (length(body)-length(replace(body,old_anchor,'')))/length(old_anchor)<>1 then raise exception 'Unexpected exchange_request definition; refusing patch'; end if;
 body:=replace(body,old_anchor,new_anchor);
 old_anchor:=$old$  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from (
   select m.*, coalesce((select jsonb_agg(to_jsonb(q)) from public.exchange_quotes q where q.market_id=m.id),'[]') quotes
   from public.exchange_markets m where (p_input->>'eventId' is null or m.event_id=p_input->>'eventId')
    and (p_input->>'matchId' is null or m.match_id::text=p_input->>'matchId')
   order by m.observed_at desc,m.id limit 200
  ) x;
$old$;
 new_anchor:=$new$  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from (
   select market_row.*, coalesce((select jsonb_agg(to_jsonb(q)) from public.exchange_quotes quote_row where quote_row.market_id=market_row.id),'[]') quotes
   from public.exchange_markets market_row where (p_input->>'eventId' is null or market_row.event_id=p_input->>'eventId')
    and (p_input->>'matchId' is null or market_row.match_id::text=p_input->>'matchId')
   order by market_row.observed_at desc,market_row.id limit 200
  ) x;
$new$;
 if strpos(body,old_anchor)=0 then raise exception 'Market query definition changed'; end if;
 body:=replace(body,old_anchor,new_anchor);
 execute body;
end;
$patch$;

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
  -- Cash movement must not consume the dealer's credit limit.
  if p_wallet = 'credit' and p_direction = 'deposit' and lower(actor.role) <> 'company'
     and actor.credit_remaining < p_amount then
    raise exception 'Insufficient dealer credit limit';
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
  insert into public.transactions(client_username,type,amount,description,before_balance,after_balance,operator_username,counterparty_username,combined_before_balance,combined_after_balance)
  values(actor.username,p_wallet,-signed_amount,'Transfer with '||target.username||' ('||initcap(p_wallet)||')',
   case when p_wallet='cash' then actor.cash else actor.credit_remaining end,
   case when p_wallet='cash' then actor.cash else actor.credit_remaining end-signed_amount,
   actor.username,target.username,actor.cash+actor.credit_remaining+actor.pl_downline,actor.cash+actor.credit_remaining+actor.pl_downline-signed_amount);
  return jsonb_build_object('success',true,'transactionId',ledger_id,'afterBalance',after_amount,'availableBalance',combined_after,'replayed',false);
end;
$$;
