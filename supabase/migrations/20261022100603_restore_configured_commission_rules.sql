-- Restore the configured commission for accounts whose versioned rule is missing.
-- Existing bet snapshots, settlements and ledger entries are intentionally untouched.
set local lock_timeout = '7s';
set local statement_timeout = '60s';

do $patch$
declare
  body text;
  anchor text := 'coalesce(rule.rate,0)';
begin
  select pg_get_functiondef('public.exchange_request(text,text,jsonb)'::regprocedure) into body;
  if (length(body) - length(replace(body, anchor, ''))) / length(anchor) <> 1 then
    raise exception 'Exchange commission snapshot anchor changed';
  end if;
  -- A missing rule must never silently override the account's configured rate with zero.
  execute replace(body, anchor, 'coalesce(rule.rate,a.commission)');
end
$patch$;

insert into public.exchange_commission_rules (client_id, rate, actor_id, reason)
select c.id, c.commission, c.id, 'Restore missing rule from configured account commission'
from public.clients c
where c.commission between 0 and 100
  and not exists (
    select 1 from public.exchange_commission_rules r where r.client_id = c.id
  );
