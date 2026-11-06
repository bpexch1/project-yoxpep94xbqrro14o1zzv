-- Keep the active Matched Bets contract scoped to the displayed round while
-- preserving the existing all-round bet history and ledger rows.
-- New rounds read their timing policy from the server-owned game config.
do $patch$
declare
 body text;
 anchor text;
 replacement text;
 old_timing text := $old$stamp+interval '20 seconds',stamp+interval '30 seconds'$old$;
 new_timing text := $new$stamp+make_interval(secs=>coalesce(nullif(p_config#>>'{timing,bettingSeconds}','')::integer,20)),stamp+make_interval(secs=>coalesce(nullif(p_config#>>'{timing,bettingSeconds}','')::integer,20)+coalesce(nullif(p_config#>>'{timing,resultSeconds}','')::integer,10))$new$;
begin
 select pg_get_functiondef('public.studio_request(text,text,jsonb,jsonb,jsonb)'::regprocedure) into body;

 anchor := $mine$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into mine from (
  select b.id,b.request_id,b.selection,b.bet_type,b.stake,b.odds,b.status,b.profit,b.created_at,s.id as round_id
  from public.bets b join public.studio_rounds s on s.market_id=b.exchange_market_id
  where b.user_email=a->>'username' and s.game_id=gid order by b.created_at desc limit 50
 ) x;$mine$;
 replacement := anchor || $matched$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into active from (
  select b.id::text as order_id,b.id,b.runner_id,b.selection,b.bet_type,b.stake,b.odds,b.status,b.profit,b.created_at,s.id as round_id
  from public.bets b join public.studio_rounds s on s.market_id=b.exchange_market_id
  where b.user_email=a->>'username' and s.id=r.id and b.status in ('pending','matched')
  order by b.created_at,b.id
 ) x;$matched$;
 if (length(body)-length(replace(body,anchor,'')))/length(anchor)<>1 then raise exception 'Studio bet-history anchor changed'; end if;
 body:=replace(body,anchor,replacement);

 anchor:='history jsonb; mine jsonb; result jsonb; existing public.bets%rowtype;';
 if (length(body)-length(replace(body,anchor,'')))/length(anchor)<>1 then raise exception 'Studio declaration anchor changed'; end if;
 body:=replace(body,anchor,'history jsonb; mine jsonb; active jsonb; result jsonb; existing public.bets%rowtype;');

 anchor:='''config'',r.config,''history'',history,''bets'',mine,''balance''';
 if (length(body)-length(replace(body,anchor,'')))/length(anchor)<>1 then raise exception 'Studio state response anchor changed'; end if;
 body:=replace(body,anchor,'''config'',r.config,''history'',history,''bets'',mine,''matchedBets'',active,''balance''');

 if (length(body)-length(replace(body,old_timing,'')))/length(old_timing)<>1 then raise exception 'Studio round timing anchor changed'; end if;
 body:=replace(body,old_timing,new_timing);
 execute body;
end
$patch$;
