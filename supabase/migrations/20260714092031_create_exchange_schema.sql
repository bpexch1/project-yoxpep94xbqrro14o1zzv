
/*
# Exchange Admin Panel - Full Database Schema

## Overview
Creates all four core tables for a sports betting exchange admin panel.
This is a single-tenant app (no per-user auth required for the frontend),
so RLS policies allow anon + authenticated access.

## New Tables

### 1. clients
Stores all users in the exchange hierarchy (company, superadmin, admin, agent, client roles).
- id (uuid, PK)
- username (text, unique) — login identifier
- full_name (text)
- password (text) — plaintext as used by existing login logic
- role (text) — company | superadmin | admin | supermaster | agent | client
- credit_received (numeric) — total credit assigned
- credit_remaining (numeric) — current credit balance
- cash (numeric) — cash balance
- pl_downline (numeric) — profit/loss from downline
- balance_upline (numeric) — balance owed to upline
- status (text) — active | inactive
- parent_username (text) — references the parent in hierarchy
- phone (text)
- downline_share (numeric) — downline share percentage 0-100
- reference (text)
- betting_allowed (boolean)
- can_settle_pl (boolean)
- commission (numeric) — commission percentage
- notes (text)
- created_at, updated_at timestamps

### 2. matches
Sports matches available for betting.
- id (uuid, PK)
- title (text) — e.g. "India vs Pakistan"
- sport (text) — cricket | football | tennis
- team1, team2 (text)
- match_time (timestamptz)
- status (text) — live | upcoming | completed
- back_odds, lay_odds (numeric) — odds for team1
- back_odds2, lay_odds2 (numeric) — odds for team2
- category (text) — IPL, World Cup, etc.
- betfair_event_id (text) — for live odds sync
- cricbuzz_match_id (text) — for live scores
- created_at, updated_at timestamps

### 3. bets
Bets placed by clients on matches.
- id (uuid, PK)
- user_email (text) — client's username
- match_id (text) — references match
- match_title (text) — denormalized for display
- selection (text) — which team/outcome was bet on
- bet_type (text) — back | lay
- stake (numeric)
- odds (numeric)
- potential_win (numeric)
- status (text) — pending | won | lost | cancelled
- created_at, updated_at timestamps

### 4. transactions
Cash and credit transaction records for the ledger.
- id (uuid, PK)
- client_username (text)
- type (text) — cash | credit
- amount (numeric) — positive = deposit, negative = withdrawal
- description (text)
- before_balance (numeric)
- after_balance (numeric)
- created_at timestamps

## Security
- RLS enabled on all 4 tables.
- All policies use `TO anon, authenticated` — this is a single-tenant app with
  its own username/password auth (not Supabase Auth), so the anon key is used
  for all frontend operations.
- USING (true) / WITH CHECK (true) is intentional here because access control
  is handled by the app's own session logic, not row-level ownership.
*/

-- ============================================================
-- 1. CLIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  full_name text,
  password text,
  role text NOT NULL DEFAULT 'client',
  credit_received numeric NOT NULL DEFAULT 0,
  credit_remaining numeric NOT NULL DEFAULT 0,
  cash numeric NOT NULL DEFAULT 0,
  pl_downline numeric NOT NULL DEFAULT 0,
  balance_upline numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  parent_username text,
  phone text,
  downline_share numeric NOT NULL DEFAULT 85,
  reference text,
  betting_allowed boolean NOT NULL DEFAULT true,
  can_settle_pl boolean NOT NULL DEFAULT false,
  commission numeric NOT NULL DEFAULT 2.00,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_username_idx ON clients (username);
CREATE INDEX IF NOT EXISTS clients_parent_username_idx ON clients (parent_username);
CREATE INDEX IF NOT EXISTS clients_role_idx ON clients (role);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients (status);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_clients" ON clients;
CREATE POLICY "anon_select_clients" ON clients FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
CREATE POLICY "anon_delete_clients" ON clients FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 2. MATCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  sport text NOT NULL DEFAULT 'cricket',
  team1 text,
  team2 text,
  match_time timestamptz,
  status text NOT NULL DEFAULT 'upcoming',
  back_odds numeric,
  lay_odds numeric,
  back_odds2 numeric,
  lay_odds2 numeric,
  category text,
  betfair_event_id text,
  cricbuzz_match_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS matches_status_idx ON matches (status);
CREATE INDEX IF NOT EXISTS matches_sport_idx ON matches (sport);
CREATE INDEX IF NOT EXISTS matches_betfair_event_id_idx ON matches (betfair_event_id);
CREATE INDEX IF NOT EXISTS matches_match_time_idx ON matches (match_time);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_matches" ON matches;
CREATE POLICY "anon_select_matches" ON matches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_matches" ON matches;
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 3. BETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  match_id text NOT NULL,
  match_title text,
  selection text,
  bet_type text NOT NULL DEFAULT 'back',
  stake numeric NOT NULL DEFAULT 0,
  odds numeric NOT NULL DEFAULT 1,
  potential_win numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bets_user_email_idx ON bets (user_email);
CREATE INDEX IF NOT EXISTS bets_match_id_idx ON bets (match_id);
CREATE INDEX IF NOT EXISTS bets_status_idx ON bets (status);
CREATE INDEX IF NOT EXISTS bets_created_at_idx ON bets (created_at DESC);

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bets" ON bets;
CREATE POLICY "anon_select_bets" ON bets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bets" ON bets;
CREATE POLICY "anon_insert_bets" ON bets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bets" ON bets;
CREATE POLICY "anon_update_bets" ON bets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bets" ON bets;
CREATE POLICY "anon_delete_bets" ON bets FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_username text NOT NULL,
  type text NOT NULL DEFAULT 'cash',
  amount numeric NOT NULL DEFAULT 0,
  description text,
  before_balance numeric NOT NULL DEFAULT 0,
  after_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_client_username_idx ON transactions (client_username);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions (type);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions (created_at DESC);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_clients_updated_at ON clients;
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_matches_updated_at ON matches;
CREATE TRIGGER set_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_bets_updated_at ON bets;
CREATE TRIGGER set_bets_updated_at
  BEFORE UPDATE ON bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
