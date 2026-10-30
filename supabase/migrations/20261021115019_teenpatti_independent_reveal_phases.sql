-- Honor each game's own reveal interval before settlement. Existing rounds
-- without an explicit interval retain their previous behavior.
set local lock_timeout='7s';
set local statement_timeout='60s';

do $patch$
declare body text; anchor text; replacement text;
begin
 select pg_get_functiondef('public.studio_settle_due()'::regprocedure) into body;
 anchor:='where settled_at is null and (case when game_id=''9010'' then closes_at+make_interval(secs=>coalesce((config#>>''{timing,revealSeconds}'')::integer,7)) else closes_at end)<=clock_timestamp()';
 replacement:='where settled_at is null and (closes_at+make_interval(secs=>greatest(0,coalesce((config#>>''{timing,revealSeconds}'')::integer,case when game_id=''9010'' then 7 else 0 end))))<=clock_timestamp()';
 if (length(body)-length(replace(body,anchor,'')))/length(anchor)<>1 then
  raise exception 'Studio settlement timing anchor changed';
 end if;
 execute replace(body,anchor,replacement);
end
$patch$;
