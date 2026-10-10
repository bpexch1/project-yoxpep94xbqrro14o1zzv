-- Prepared migration only. Do NOT deploy before checking production schema,
-- Supabase Auth user mapping, provider freshness and RLS in a staging project.
-- The old browser-only username session is intentionally not trusted by this RPC.
alter table public.clients add column if not exists auth_user_id uuid references auth.users(id);
create unique index if not exists clients_auth_user_id_idx on public.clients(auth_user_id)
  where auth_user_id is not null;

alter table public.matches add column if not exists odds_verified_at timestamptz;
alter table public.matches add column if not exists odds_status text;
alter table public.matches add column if not exists odds_provider text;

alter table public.bets add column if not exists request_id uuid;
create unique index if not exists bets_request_id_idx on public.bets(request_id)
  where request_id is not null;

create or replace function public.place_bet_atomic(
  p_match_id uuid,
  p_selection text,
  p_bet_type text,
  p_stake numeric,
  p_requested_odds numeric,
  p_request_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  account public.clients%rowtype;
  event_record public.matches%rowtype;
  previous public.bets%rowtype;
  accepted_odds numeric;
  placed_id uuid;
  before_cash numeric;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required';
  end if;
  if p_match_id is null or p_request_id is null or p_selection is null
    or btrim(p_selection) = '' or p_bet_type <> 'back' or p_bet_type is null
    or p_stake is null or p_stake::text in ('NaN','Infinity','-Infinity')
    or p_stake <= 0 or p_stake > 1000000 or round(p_stake,2) <> p_stake
    or p_requested_odds is null or p_requested_odds::text in ('NaN','Infinity','-Infinity')
    or p_requested_odds <= 1 or p_requested_odds > 1000 then
    raise exception 'Invalid or unsupported wager parameters';
  end if;

  -- Lock account to serialize simultaneous requests and prevent overspending.
  select * into account from public.clients
    where auth_user_id = auth.uid() for update;
  if account.id is null or account.status <> 'active' or account.betting_allowed is not true
    or lower(account.role) not in ('client','user','bettor') then
    raise exception 'Betting account is unavailable';
  end if;

  -- Idempotent replay even if odds have changed after a successful first request.
  select * into previous from public.bets where request_id = p_request_id;
  if previous.id is not null then
    if previous.user_email <> account.username or previous.match_id <> p_match_id::text
      or previous.selection <> p_selection or previous.bet_type <> p_bet_type
      or previous.stake <> p_stake or previous.odds <> p_requested_odds then
      raise exception 'Request ID reused for different wager';
    end if;
    return jsonb_build_object('success',true,'betId',previous.id,'status',previous.status,'replayed',true);
  end if;

  -- The server is the only authority for verified, fresh provider odds.
  select * into event_record from public.matches where id = p_match_id for share;
  if event_record.id is null or lower(event_record.status) not in ('live','inplay')
    or event_record.odds_status <> 'OPEN'
    or event_record.odds_verified_at is null
    or event_record.odds_verified_at < now() - interval '15 seconds'
    or coalesce(event_record.odds_provider,'') = '' then
    raise exception 'Market is closed, stale or not verified';
  end if;
  if p_selection = event_record.team1 then
    accepted_odds := event_record.back_odds;
  elsif p_selection = event_record.team2 then
    accepted_odds := event_record.back_odds2;
  else
    raise exception 'Selection is not available in this verified market';
  end if;
  if accepted_odds is null or accepted_odds <> p_requested_odds then
    raise exception 'Market price has changed; refresh and try again';
  end if;
  if account.cash < p_stake then
    raise exception 'Insufficient cash balance';
  end if;

  before_cash := account.cash;
  update public.clients set cash = cash - p_stake where id = account.id;
  insert into public.bets(
    user_email, match_id, match_title, selection, bet_type,
    stake, odds, potential_win, status, request_id
  ) values (
    account.username, event_record.id::text, event_record.title, p_selection, 'back',
    p_stake, accepted_odds, round(p_stake * (accepted_odds-1),2), 'pending', p_request_id
  ) returning id into placed_id;

  insert into public.transactions (
    client_username, type, amount, description, before_balance, after_balance
  ) values (
    account.username, 'bet_stake', -p_stake,
    'Pending bet ' || placed_id::text, before_cash, before_cash-p_stake
  );

  return jsonb_build_object('success',true,'betId',placed_id,'status','pending','replayed',false);
end;
$$;
revoke all on function public.place_bet_atomic(uuid,text,text,numeric,numeric,uuid)
  from public, anon, authenticated;
grant execute on function public.place_bet_atomic(uuid,text,text,numeric,numeric,uuid)
  to authenticated;
