-- Intelligence Briefing schema

-- App-level config (key/value store for runtime configuration)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default briefing config values
INSERT OR IGNORE INTO app_config (key, value, description) VALUES
  ('BRIEFING_REFRESH_MODE', 'daily', 'Refresh cadence: daily | 3x_week | weekly | manual'),
  ('BRIEFING_MAX_ITEMS_VISIBLE', '4', 'Max items shown on dashboard'),
  ('BRIEFING_MAX_ITEMS_STORED', '200', 'Max items retained in DB before oldest are pruned'),
  ('BRIEFING_MIN_HOURS_BETWEEN_RUNS', '18', 'Minimum hours between scheduled runs (safety throttle)'),
  ('BRIEFING_3X_WEEK_DAYS', '1,3,5', 'Days of week for 3x_week mode (1=Mon, 5=Fri)');

-- RSS feed sources
CREATE TABLE IF NOT EXISTS briefing_sources (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category_hint TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Briefing items (deduplicated by hash)
CREATE TABLE IF NOT EXISTS briefing_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  hash TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'other',
  summary TEXT,
  score REAL,
  status TEXT NOT NULL DEFAULT 'draft',
  dedupe_group TEXT,
  raw_excerpt TEXT,
  notes TEXT,
  FOREIGN KEY (source_id) REFERENCES briefing_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_briefing_items_hash ON briefing_items(hash);
CREATE INDEX IF NOT EXISTS idx_briefing_items_status ON briefing_items(status);
CREATE INDEX IF NOT EXISTS idx_briefing_items_fetched ON briefing_items(fetched_at);
CREATE INDEX IF NOT EXISTS idx_briefing_items_category ON briefing_items(category);

-- Run log for auditing
CREATE TABLE IF NOT EXISTS briefing_runs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  items_fetched INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  error_message TEXT
);
