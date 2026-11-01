-- Replace generated sports fixtures with a cached, authenticated provider schedule.
-- Existing Studio casino rounds and historical sports bets are untouched.
set local lock_timeout = '7s';
set local statement_timeout = '60s';

create table if not exists public.cricket_feed_cache (
  id text primary key,
  payload jsonb not null default '[]'::jsonb check (jsonb_typeof(payload) = 'array'),
  fetched_at timestamptz not null default 'epoch',
  refresh_lease_until timestamptz not null default 'epoch',
  last_error_at timestamptz
);
alter table public.cricket_feed_cache enable row level security;
revoke all on public.cricket_feed_cache from public, anon, authenticated;
grant select, insert, update on public.cricket_feed_cache to service_role;
insert into public.cricket_feed_cache(id) values ('current') on conflict (id) do nothing;

do $disable_demo$
declare body text;
  anchor text := $anchor$ if p_action='markets' or (p_action='entityRead' and p_input->>'table'='matches') then
  perform public.exchange_refresh_demo_markets();
 end if;$anchor$;
begin
  select pg_get_functiondef('public.exchange_request(text,text,jsonb)'::regprocedure) into body;
  if (length(body) - length(replace(body, anchor, ''))) / length(anchor) <> 1 then
    raise exception 'Demo refresh anchor changed; review before applying';
  end if;
  if exists (
    select 1 from public.bets b join public.exchange_markets m on m.id = b.exchange_market_id
    where m.is_demo and (m.event_id like 'demo-cricket-%' or m.event_id like 'demo-soccer-%')
      and b.status = 'pending'
  ) then raise exception 'Pending demo sports bets need settlement before removing fixtures'; end if;
  execute replace(body, anchor, '');
  if exists (select 1 from cron.job where jobname = 'bpexch-demo-odds-refresh') then
    perform cron.unschedule('bpexch-demo-odds-refresh');
  end if;
  update public.exchange_markets set status = 'CLOSED', betting_locked = true
    where is_demo and (event_id like 'demo-cricket-%' or event_id like 'demo-soccer-%');
  update public.matches set status = 'completed'
    where is_demo and (betfair_event_id like 'demo-cricket-%' or betfair_event_id like 'demo-soccer-%');
  drop function public.exchange_refresh_demo_markets();
end;
$disable_demo$;
