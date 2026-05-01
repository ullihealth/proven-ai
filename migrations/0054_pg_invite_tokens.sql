-- Migration 0054: Tokenised invite link system for the prompt generator

CREATE TABLE IF NOT EXISTS pg_invite_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  activated_at TEXT,
  activated INTEGER NOT NULL DEFAULT 0
);
