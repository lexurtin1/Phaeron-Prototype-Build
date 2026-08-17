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
  indicators JSONB NOT NULL DEFAULT '{}'::jsonb,
  flow_image TEXT,
  flow_diagram JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existing deployments pre-date structured opportunity-score inputs.
ALTER TABLE country_profiles
  ADD COLUMN IF NOT EXISTS indicators JSONB NOT NULL DEFAULT '{}'::jsonb;

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

-- Global research library: cross-market documents that do not belong to one country.
-- iso3_tags is a JSONB array, not an FK, because a global report routinely names
-- markets that have no countries row yet.
CREATE TABLE IF NOT EXISTS global_docs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'report',
  publisher TEXT,
  published_at TEXT,
  source_name TEXT,
  summary TEXT NOT NULL DEFAULT '',
  key_insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  iso3_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  body_md TEXT NOT NULL,
  char_count INT,
  source TEXT NOT NULL DEFAULT 'claude',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS global_docs_created_idx ON global_docs (created_at DESC);

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
