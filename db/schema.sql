-- Calastone Pulse ontology (Neon)
-- Country is the hub entity for Market Research, Network Overview, Account Tracker.

CREATE TABLE IF NOT EXISTS countries (
  iso3 CHAR(3) PRIMARY KEY,
  iso2 CHAR(2) UNIQUE,
  name TEXT NOT NULL,
  region TEXT,
  subregion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS country_profiles (
  iso3 CHAR(3) PRIMARY KEY REFERENCES countries(iso3) ON DELETE CASCADE,
  market_classification TEXT,
  central_hub_status TEXT,
  hub_name TEXT,
  operator TEXT,
  opportunity_score INT,
  automation_rate_estimate INT,
  priority_tier TEXT,
  existing_network_presence TEXT,
  market_aum_band TEXT,
  mutual_fund_relevance TEXT,
  growth_signal TEXT,
  dominant_order_model TEXT,
  current_order_channels TEXT,
  manuality_snapshot TEXT,
  regulatory_openness TEXT,
  risks_or_barriers TEXT,
  flow_image TEXT,
  flow_diagram JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_notes (
  id BIGSERIAL PRIMARY KEY,
  iso3 CHAR(3) NOT NULL REFERENCES countries(iso3) ON DELETE CASCADE,
  body_md TEXT NOT NULL,
  version INT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (iso3, version)
);

CREATE INDEX IF NOT EXISTS research_notes_iso3_latest_idx
  ON research_notes (iso3, version DESC);

-- Phase 2 stubs: Network Overview + Account Tracker join via countries.iso3
CREATE TABLE IF NOT EXISTS network_nodes (
  iso2 CHAR(2) PRIMARY KEY,
  iso3 CHAR(3) REFERENCES countries(iso3),
  name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT,
  location TEXT,
  stage TEXT,
  iso3 CHAR(3) REFERENCES countries(iso3),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_signals (
  id BIGSERIAL PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  src TEXT,
  signal_time TEXT,
  headline TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
