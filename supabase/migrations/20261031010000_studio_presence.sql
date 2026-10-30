-- Short-lived, authenticated presence for the Studio player counter.
-- Only the trusted Edge Function can update or read this table.
create table public.studio_presence (
  game_id text not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  last_seen timestamptz not null default now(),
  primary key (game_id, client_id)
);
create index studio_presence_last_seen on public.studio_presence(game_id, last_seen);
alter table public.studio_presence enable row level security;
revoke all on public.studio_presence from public, anon, authenticated;
grant select, insert, update, delete on public.studio_presence to service_role;

create function public.studio_touch_presence(p_token text, p_game_id text)
returns integer language plpgsql security invoker set search_path='' as $$
declare player_id uuid; active_count integer;
begin
  select s.client_id into player_id from public.exchange_sessions s
  join public.clients c on c.id=s.client_id
  where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
    and s.expires_at>clock_timestamp() and c.status='active'
    and lower(c.role) in ('bettor','client','user');
  if player_id is null then raise exception 'Authentication required'; end if;
  insert into public.studio_presence(game_id,client_id,last_seen)
  values(p_game_id,player_id,clock_timestamp())
  on conflict(game_id,client_id) do update set last_seen=excluded.last_seen;
  select count(*) into active_count from public.studio_presence
  where game_id=p_game_id and last_seen>clock_timestamp()-interval '15 seconds';
  return active_count;
end $$;
revoke all on function public.studio_touch_presence(text,text) from public,anon,authenticated;
grant execute on function public.studio_touch_presence(text,text) to service_role;
