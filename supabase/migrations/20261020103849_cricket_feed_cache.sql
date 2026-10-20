-- Server-only cricket score cache. Provider data never carries exchange odds.
create table public.cricket_feed_cache (
  id text primary key check (id = 'current'),
  payload jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default 'epoch'::timestamptz,
  refresh_lease_until timestamptz not null default 'epoch'::timestamptz,
  last_error_at timestamptz
);

alter table public.cricket_feed_cache enable row level security;
revoke all on public.cricket_feed_cache from public, anon, authenticated;
grant select, update on public.cricket_feed_cache to service_role;

insert into public.cricket_feed_cache(id) values ('current');
