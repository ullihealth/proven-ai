-- AI model settings for the prompt generator (stored in site_settings)
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_claude_enabled', 'true');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_claude_api_key', '');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_claude_model', 'claude-sonnet-4-20250514');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_claude_free_daily_limit', '0');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_claude_paid_daily_limit', '10');

INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_groq_enabled', 'true');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_groq_api_key', '');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_groq_model', 'llama-3.3-70b-versatile');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_groq_free_daily_limit', '5');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_groq_paid_daily_limit', '10');

INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_gemini_enabled', 'true');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_gemini_api_key', '');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_gemini_model', 'gemini-2.0-flash-lite');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_gemini_free_daily_limit', '3');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('pg_gemini_paid_daily_limit', '6');

-- Guest token table for email-linked access (free subscribers)
CREATE TABLE IF NOT EXISTS pg_guest_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pg_guest_tokens_token ON pg_guest_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pg_guest_tokens_email ON pg_guest_tokens(email);

-- Usage tracking table — one row per prompt generation
CREATE TABLE IF NOT EXISTS pg_usage (
  id TEXT PRIMARY KEY,
  user_identifier TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK(user_type IN ('paid_member', 'free_subscriber')),
  model TEXT NOT NULL CHECK(model IN ('claude', 'groq', 'gemini')),
  used_at TEXT NOT NULL,
  date_bucket TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pg_usage_lookup ON pg_usage(user_identifier, model, date_bucket);
