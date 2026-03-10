CREATE TABLE IF NOT EXISTS pm_notes (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pm_notes_date ON pm_notes(date);
