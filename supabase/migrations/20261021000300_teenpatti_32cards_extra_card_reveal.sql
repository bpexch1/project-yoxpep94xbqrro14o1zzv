-- The reference Rules screen specifies ranks 6 through King and extra draws
-- among tied highest totals. Reveal each extra card in deal order without
-- leaking a future total, card or winner through the public state response.
set local lock_timeout='7s';
set local statement_timeout='60s';

create or replace function public.studio_public_outcome(
 p_game_id text,p_outcome jsonb,p_closes_at timestamptz,p_ends_at timestamptz,
 p_settled_at timestamptz,p_now timestamptz,p_reveal_seconds integer default 7
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare visible integer; total_cards integer; reveal_duration numeric; partial_groups jsonb;
begin
 if p_game_id<>'9010' then return case when p_settled_at is null then null else p_outcome end; end if;
 if p_now<p_closes_at then return null; end if;
 select coalesce(sum(jsonb_array_length(g.item->'cards')),0) into total_cards
 from jsonb_array_elements(p_outcome->'groups') as g(item);
 reveal_duration:=greatest(1,least(coalesce(p_reveal_seconds,7),extract(epoch from p_ends_at-p_closes_at)-1));
 visible:=least(total_cards,greatest(0,floor(total_cards*extract(epoch from p_now-p_closes_at)/reveal_duration)::integer));
 if visible=total_cards and p_settled_at is not null then return p_outcome; end if;
 with groups as (
  select g.item,g.group_no from jsonb_array_elements(p_outcome->'groups') with ordinality as g(item,group_no)
 ), cards as (
  select g.group_no,c.card,c.card_no,row_number() over(order by c.card_no,g.group_no) as reveal_no
  from groups g cross join lateral jsonb_array_elements(g.item->'cards') with ordinality as c(card,card_no)
 )
 select coalesce(jsonb_agg(
  case when coalesce((select count(*) from cards c where c.group_no=g.group_no and c.reveal_no<=visible),0)
        =jsonb_array_length(g.item->'cards') then g.item
   else (g.item-'value')||jsonb_build_object('cards',
    coalesce((select jsonb_agg(c.card order by c.card_no) from cards c where c.group_no=g.group_no and c.reveal_no<=visible),'[]'::jsonb))
  end order by g.group_no),'[]'::jsonb) into partial_groups from groups g;
 return jsonb_build_object('winner',null,'groups',partial_groups,'summary','Revealing cards…');
end $$;
revoke all on function public.studio_public_outcome(text,jsonb,timestamptz,timestamptz,timestamptz,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.studio_public_outcome(text,jsonb,timestamptz,timestamptz,timestamptz,timestamptz,integer) to service_role;
