-- Snapshot materialization for server-verified external market data.
-- Apply only after confirming provider contract and migration in staging.
create table if not exists public.sports_market_snapshots (
  match_id uuid primary key references public.matches(id) on delete cascade,
  provider_event_id text not null unique,
  source text not null,
  market_status text not null check (market_status in ('OPEN','SUSPENDED','CLOSED')),
  markets jsonb not null default '[]'::jsonb,
  score jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists sports_market_snapshots_updated_idx
  on public.sports_market_snapshots(updated_at desc);
alter table public.sports_market_snapshots enable row level security;
drop policy if exists "read_verified_market_snapshots" on public.sports_market_snapshots;
create policy "read_verified_market_snapshots" on public.sports_market_snapshots
  for select to anon, authenticated using (true);
revoke insert, update, delete on public.sports_market_snapshots from anon, authenticated;

create or replace function public.ingest_verified_market_snapshot(
  p_match_id uuid,
  p_provider_event_id text,
  p_source text,
  p_market_status text,
  p_markets jsonb,
  p_score jsonb,
  p_back_odds numeric,
  p_lay_odds numeric,
  p_back_odds2 numeric,
  p_lay_odds2 numeric
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare changed integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Authorized feed service required'; end if;
  if p_match_id is null or nullif(btrim(p_provider_event_id),'') is null
    or nullif(btrim(p_source),'') is null
    or p_market_status not in ('OPEN','SUSPENDED','CLOSED')
    or jsonb_typeof(p_markets) <> 'array' then
    raise exception 'Invalid feed event';
  end if;
  -- Never attach an external score/market to a different match.
  update public.matches set
    back_odds = p_back_odds,
    lay_odds = p_lay_odds,
    back_odds2 = p_back_odds2,
    lay_odds2 = p_lay_odds2,
    odds_verified_at = now(),
    odds_status = p_market_status,
    odds_provider = p_source,
    updated_at = now()
  where id = p_match_id and betfair_event_id = p_provider_event_id;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Provider event ID does not match internal match'; end if;

  insert into public.sports_market_snapshots
    (match_id,provider_event_id,source,market_status,markets,score,updated_at)
  values
    (p_match_id,p_provider_event_id,p_source,p_market_status,p_markets,p_score,now())
  on conflict (match_id) do update set
    provider_event_id=excluded.provider_event_id,
    source=excluded.source,
    market_status=excluded.market_status,
    markets=excluded.markets,
    score=excluded.score,
    updated_at=now();
  return jsonb_build_object('success',true,'matchId',p_match_id);
end;
$$;
revoke all on function public.ingest_verified_market_snapshot(uuid,text,text,text,jsonb,jsonb,numeric,numeric,numeric,numeric)
  from public, anon, authenticated;
grant execute on function public.ingest_verified_market_snapshot(uuid,text,text,text,jsonb,jsonb,numeric,numeric,numeric,numeric)
  to service_role;
