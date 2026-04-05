-- Migration 0050: business_onboarding table
CREATE TABLE IF NOT EXISTS business_onboarding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT,
  business_type TEXT NOT NULL,
  years_running TEXT,
  time_drains TEXT,
  ai_experience TEXT,
  success_definition TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
