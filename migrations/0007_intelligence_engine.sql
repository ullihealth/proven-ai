-- Intelligence Engine upgrade
-- Add commentary field, per-source publishing/summary config, rename ai_software → ai_news

-- 1. Commentary column on items
ALTER TABLE briefing_items ADD COLUMN commentary TEXT;

-- 2. Per-source publishing mode + summary override
ALTER TABLE briefing_sources ADD COLUMN publishing_mode TEXT DEFAULT 'auto';
ALTER TABLE briefing_sources ADD COLUMN summary_override TEXT DEFAULT NULL;

-- 3. Seed new global config keys (INSERT OR IGNORE = won't overwrite if exists)
INSERT OR IGNORE INTO app_config (key, value, description, updated_at)
VALUES
  ('INTEL_SUMMARY_MODE', 'standard', 'headlines | short | standard | extended', datetime('now')),
  ('INTEL_REFRESH_MODE', 'rolling', 'rolling | daily_brief', datetime('now')),
  ('INTEL_ARTICLE_VIEW', 'on', 'on | off — in-app article reader', datetime('now')),
  ('INTEL_COMMENTARY', 'off', 'on | off — founder commentary block', datetime('now')),
  ('INTEL_ROLLING_HOURS', '6', 'Hours between rolling refreshes', datetime('now'));

-- 4. Migrate category ai_software → ai_news in existing items
UPDATE briefing_items SET category = 'ai_news' WHERE category = 'ai_software';

-- 5. Migrate category hint in sources
UPDATE briefing_sources SET category_hint = 'ai_news' WHERE category_hint = 'ai_software';
