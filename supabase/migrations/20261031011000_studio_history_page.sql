-- Page through settled Studio history without exposing the table to clients.
create index studio_history_page_idx on public.studio_rounds(game_id,settled_at desc,id desc)
where settled_at is not null;
create function public.studio_history_page(
  p_token text, p_game_id text, p_before_at timestamptz, p_before_id uuid
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare account jsonb; rounds jsonb;
begin
  account:=public.exchange_request(p_token,'account','{}'::jsonb);
  if lower(account->>'role') not in ('bettor','client','user') then
    raise exception 'Bettor account required';
  end if;
  if p_game_id<>'9010' then raise exception 'Game unavailable'; end if;
  select coalesce(jsonb_agg(to_jsonb(h) order by h.settled_at desc,h.id desc),'[]'::jsonb)
  into rounds from (
    select id,game_id,settled_at,outcome from public.studio_rounds
    where game_id=p_game_id and settled_at is not null
      and (p_before_at is null or (settled_at,id)<(p_before_at,p_before_id))
    order by settled_at desc,id desc limit 20
  ) h;
  return rounds;
end $$;
revoke all on function public.studio_history_page(text,text,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.studio_history_page(text,text,timestamptz,uuid) to service_role;
