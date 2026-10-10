-- SECURITY HOLD: REVIEW AND BACK UP BEFORE APPLYING TO PRODUCTION.
-- Current legacy web login reads public.clients.password using anon.
-- This migration intentionally breaks legacy login and unauthenticated financial UI.
-- Do not apply until backend identity migration/cutover has been tested.
BEGIN;
REVOKE ALL PRIVILEGES ON TABLE public.clients, public.bets, public.transactions, public.matches FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.clients, public.bets, public.transactions, public.matches FROM authenticated;
DROP POLICY IF EXISTS anon_insert_clients ON public.clients;
DROP POLICY IF EXISTS anon_select_clients ON public.clients;
DROP POLICY IF EXISTS anon_update_clients ON public.clients;
DROP POLICY IF EXISTS anon_delete_clients ON public.clients;
DROP POLICY IF EXISTS anon_insert_bets ON public.bets;
DROP POLICY IF EXISTS anon_select_bets ON public.bets;
DROP POLICY IF EXISTS anon_update_bets ON public.bets;
DROP POLICY IF EXISTS anon_delete_bets ON public.bets;
DROP POLICY IF EXISTS anon_insert_transactions ON public.transactions;
DROP POLICY IF EXISTS anon_select_transactions ON public.transactions;
DROP POLICY IF EXISTS anon_update_transactions ON public.transactions;
DROP POLICY IF EXISTS anon_delete_transactions ON public.transactions;
DROP POLICY IF EXISTS anon_insert_matches ON public.matches;
DROP POLICY IF EXISTS anon_select_matches ON public.matches;
DROP POLICY IF EXISTS anon_update_matches ON public.matches;
DROP POLICY IF EXISTS anon_delete_matches ON public.matches;
-- Clients, bets and transactions will be accessed only using verified trusted backend
-- procedures/service-role with least privilege and auditable checks.
-- Public match read policy can be added separately after licensed feed approval.
COMMIT;
