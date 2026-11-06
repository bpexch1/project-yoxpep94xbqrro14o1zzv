-- Event triggers execute through PostgreSQL DDL, not the exposed PostgREST API.
-- Production currently grants EXECUTE on this SECURITY DEFINER event trigger to
-- anon and authenticated through the default PUBLIC function grant.
do $restrict$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $restrict$;
