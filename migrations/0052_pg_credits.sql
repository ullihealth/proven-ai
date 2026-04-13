-- Migration 0052: Prompt Generator credit system
-- Applied directly via wrangler d1 execute (migration tracking not used for this DB)

-- Add prompt_type tracking to existing usage table
ALTER TABLE pg_usage ADD COLUMN prompt_type TEXT;

-- Add credits_deducted to existing usage table
ALTER TABLE pg_usage ADD COLUMN credits_deducted REAL NOT NULL DEFAULT 1;

-- Monthly credit limits per membership tier
-- tier 0 = Guest (token-authenticated), 1 = Standard, 2 = Professional, 3 = Advanced
-- weight_* = credit cost per generation for that model (Groq cheapest, Claude most expensive)
CREATE TABLE IF NOT EXISTS pg_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier INTEGER NOT NULL UNIQUE,
  tier_name TEXT NOT NULL,
  monthly_credits INTEGER NOT NULL,
  weight_groq REAL NOT NULL DEFAULT 1,
  weight_gemini REAL NOT NULL DEFAULT 2,
  weight_claude REAL NOT NULL DEFAULT 3,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO pg_limits (tier, tier_name, monthly_credits, weight_groq, weight_gemini, weight_claude, updated_at)
VALUES
  (0, 'Guest',        10,  1, 2, 3, datetime('now')),
  (1, 'Standard',     30,  1, 2, 3, datetime('now')),
  (2, 'Professional', 75,  1, 2, 3, datetime('now')),
  (3, 'Advanced',     500, 1, 2, 3, datetime('now'));
