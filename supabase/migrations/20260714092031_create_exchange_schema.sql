-- ============================================================
-- 1. CLIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  full_name text,
  password text NOT NULL, -- BCrypt hashed password store karne ke liye
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

-- OLD DANGEROUS POLICIES DROP KAREIN
DROP POLICY IF EXISTS "anon_select_clients" ON clients;
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
DROP POLICY IF EXISTS "anon_update_clients" ON clients;
DROP POLICY IF EXISTS "anon_delete_clients" ON clients;

-- SECURE VIEW: Public API se password hide karne ke liye Secure View
CREATE OR REPLACE VIEW public_clients AS
SELECT 
  id, username, full_name, role, credit_received, credit_remaining, 
  cash, pl_downline, balance_upline, status, parent_username, phone, 
  downline_share, reference, betting_allowed, can_settle_pl, commission, 
  notes, created_at, updated_at
FROM clients;

-- Service Role Policy (Only Edge Functions & Backend can bypass RLS)
CREATE POLICY "service_role_all_clients" ON clients 
  TO service_role USING (true) WITH CHECK (true);

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

-- ============================================================
-- 5. AUTO-UPDATE TRIGGER
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
