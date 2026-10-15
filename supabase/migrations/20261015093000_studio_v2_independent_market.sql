-- Preserve historical studio rounds, bets and ledgers. Replace only live quote support.
-- Demo prices are server-owned and locked as a snapshot of each new round.
do $v2$
declare body text;
 old_allow text := $old$if gid not in ('9001','9005','9006','9030','9002','9004','9007','9017','9018','9019','9055','9085')$old$;
 new_allow text := $new$if gid not in ('9301','9022','9040','9023','9100','9035','9001','9005','9030','9006','9021','9015','9002','9003','9007','9008','9009','9011','9010','9012','9016','9017','9018','9019','9020','9045','9050','9055','9065','9070','9075','9080','9085','9105')$new$;
 old_quote text := $oldquote$'quotes',(select jsonb_agg(jsonb_build_object('runnerId',x->>'id','selection',x->>'name','side','back','odds',x->'odds','size',1000000)) from jsonb_array_elements(p_config->'runners') x)$oldquote$;
 new_quote text := $newquote$'quotes',(select jsonb_agg(jsonb_build_object('runnerId',x->>'id','selection',x->>'name','side',s.side,'odds',case when s.side='lay' then x->'layOdds' else x->'odds' end,'size',1000000)) from jsonb_array_elements(p_config->'runners') x cross join (values ('back'),('lay')) s(side))$newquote$;
begin
 select pg_get_functiondef('public.studio_request(text,text,jsonb,jsonb,jsonb)'::regprocedure) into body;
 if strpos(body,old_allow)=0 or strpos(body,old_quote)=0 then raise exception 'Studio V2 anchors differ. Do not partially apply.'; end if;
 body:=replace(replace(body,old_allow,new_allow),old_quote,new_quote);
 execute body;
end
$v2$;
