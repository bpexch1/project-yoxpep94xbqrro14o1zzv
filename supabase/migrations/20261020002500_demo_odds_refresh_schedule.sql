-- Keep only virtual/demo markets fresh for the 15-second quote validity window.
-- Existing real/provider markets are untouched by exchange_refresh_demo_markets().
-- pg_cron is enabled in production. Run this migration only after enabling it
-- in any independent Supabase database.
-- Named jobs are safely updated by cron.schedule if they already exist.
select cron.schedule(
  'bpexch-demo-odds-refresh',
  '10 seconds',
  $job$select public.exchange_refresh_demo_markets();$job$
);
