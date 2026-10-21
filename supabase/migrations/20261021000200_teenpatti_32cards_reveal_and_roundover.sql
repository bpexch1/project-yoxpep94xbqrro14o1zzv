-- Keep a settled wager on its displayed round through ROUND OVER. On the
-- next round it leaves only the live panel; the bet and ledger remain stored.
-- For the independent 32 Cards demo, reveal public cards in server time and
-- settle only after the last reveal. Never return the hidden winner early.
set local lock_timeout='7s';
set local statement_timeout='60s';

create function public.studio_public_outcome(
 p_game_id text,p_outcome jsonb,p_closes_at timestamptz,p_ends_at timestamptz,
 p_settled_at timestamptz,p_now timestamptz,p_reveal_seconds integer default 7
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare visible integer; reveal_duration numeric; partial_groups jsonb;
begin
 if p_game_id<>'9010' then return case when p_settled_at is null then null else p_outcome end; end if;
 if p_now<p_closes_at then return null; end if;
 reveal_duration:=greatest(1,least(coalesce(p_reveal_seconds,7),extract(epoch from p_ends_at-p_closes_at)-1));
 visible:=least(4,greatest(0,floor(4*extract(epoch from p_now-p_closes_at)/reveal_duration)::integer));
 if visible=4 and p_settled_at is not null then return p_outcome; end if;
 select coalesce(jsonb_agg(case when ordinal<=visible then item else (item-'value')||jsonb_build_object('cards','[]'::jsonb) end order by ordinal),'[]'::jsonb)
 into partial_groups from jsonb_array_elements(p_outcome->'groups') with ordinality as g(item,ordinal);
 return jsonb_build_object('winner',null,'groups',partial_groups,'summary','Revealing cards…');
end $$;
revoke all on function public.studio_public_outcome(text,jsonb,timestamptz,timestamptz,timestamptz,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.studio_public_outcome(text,jsonb,timestamptz,timestamptz,timestamptz,timestamptz,integer) to service_role;

do $patch$
declare body text; anchor text; replacement text;
begin
 select pg_get_functiondef('public.studio_settle_due()'::regprocedure) into body;
 anchor:='where settled_at is null and closes_at<=clock_timestamp()';
 replacement:='where settled_at is null and (case when game_id=''9010'' then closes_at+make_interval(secs=>coalesce((config#>>''{timing,revealSeconds}'')::integer,7)) else closes_at end)<=clock_timestamp()';
 if (length(body)-length(replace(body,anchor,'')))/length(anchor)<>1 then raise exception 'Studio settlement timing anchor changed'; end if;
 execute replace(body,anchor,replacement);

 select pg_get_functiondef('public.studio_request(text,text,jsonb,jsonb,jsonb)'::regprocedure) into body;
 anchor:='and s.id=r.id and b.status in (''pending'',''matched'')';
 replacement:='and s.id=r.id and b.status in (''pending'',''matched'',''won'',''lost'',''void'')';
 if (length(body)-length(replace(body,anchor,'')))/length(anchor)<>1 then raise exception 'Studio current-round bet anchor changed'; end if;
 body:=replace(body,anchor,replacement);

 anchor:='''outcome'',case when r.settled_at is not null then r.outcome else null end';
 replacement:='''outcome'',public.studio_public_outcome(r.game_id,r.outcome,r.closes_at,r.ends_at,r.settled_at,clock_timestamp(),coalesce((r.config#>>''{timing,revealSeconds}'')::integer,7))';
 if (length(body)-length(replace(body,anchor,'')))/length(anchor)<>1 then raise exception 'Studio public result anchor changed'; end if;
 execute replace(body,anchor,replacement);
end
$patch$;
