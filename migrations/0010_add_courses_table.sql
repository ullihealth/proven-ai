-- Migration 0010: Add courses table (move course metadata from localStorage to D1)
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  estimated_time TEXT DEFAULT '',
  course_type TEXT NOT NULL DEFAULT 'short',
  lifecycle_state TEXT NOT NULL DEFAULT 'current',
  difficulty TEXT,
  capability_tags TEXT DEFAULT '[]',
  last_updated TEXT,
  href TEXT NOT NULL,
  sections TEXT DEFAULT '[]',
  tools_used TEXT DEFAULT '[]',
  release_date TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
