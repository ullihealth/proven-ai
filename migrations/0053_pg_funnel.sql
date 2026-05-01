-- Migration 0053: Prompt Generator Free Funnel
-- Apply via: wrangler d1 execute provenai-db --file=migrations/0053_pg_funnel.sql

-- 1. Page view tracking table
CREATE TABLE IF NOT EXISTS pg_page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  viewed_at TEXT NOT NULL,
  date_bucket TEXT NOT NULL
);

-- 2. Lead capture table
CREATE TABLE IF NOT EXISTS pg_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  captured_at TEXT NOT NULL,
  date_bucket TEXT NOT NULL,
  prompts_used_before_signup INTEGER NOT NULL DEFAULT 0,
  saasdesk_synced INTEGER NOT NULL DEFAULT 0
);

-- 3a. Update tier 0 to Anonymous with 2 credits (session-based limit)
UPDATE pg_limits SET
  tier_name = 'Anonymous',
  monthly_credits = 2
WHERE tier = 0;

-- 3b. Add Tier 4 Free Member (15 credits/month, resets monthly)
INSERT OR IGNORE INTO pg_limits
  (tier, tier_name, monthly_credits, weight_groq, weight_gemini, weight_claude, updated_at)
VALUES
  (4, 'Free Member', 15, 1, 2, 3, datetime('now'));

-- 4. Expand pg_usage user_type constraint to include 'guest'
--    SQLite requires table recreation to alter a CHECK constraint.
CREATE TABLE IF NOT EXISTS pg_usage_new (
  id TEXT PRIMARY KEY,
  user_identifier TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK(user_type IN ('paid_member', 'free_subscriber', 'guest')),
  model TEXT NOT NULL CHECK(model IN ('claude', 'groq', 'gemini')),
  prompt_type TEXT,
  credits_deducted REAL NOT NULL DEFAULT 1,
  used_at TEXT NOT NULL,
  date_bucket TEXT NOT NULL
);

INSERT INTO pg_usage_new
  SELECT id, user_identifier, user_type, model, prompt_type, credits_deducted, used_at, date_bucket
  FROM pg_usage;

DROP TABLE pg_usage;
ALTER TABLE pg_usage_new RENAME TO pg_usage;
CREATE INDEX IF NOT EXISTS idx_pg_usage_lookup ON pg_usage(user_identifier, model, date_bucket);
