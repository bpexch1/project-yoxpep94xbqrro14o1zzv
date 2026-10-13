-- Apply after the frontend and exchange-api deployment are ready.
-- Legacy anonymous writes could bypass server validation. Remove those access paths.
revoke all on public.clients,public.bets,public.transactions,public.public_clients from anon,authenticated;
revoke insert,update,delete on public.matches from anon,authenticated;
alter view public.public_clients set (security_invoker=true);
