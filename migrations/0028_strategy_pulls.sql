-- Strategy Intelligence layer
CREATE TABLE IF NOT EXISTS pm_strategy_pulls (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  summary TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
