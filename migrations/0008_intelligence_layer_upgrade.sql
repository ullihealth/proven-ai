-- ============================================================================
-- Intelligence Layer Upgrade Migration
-- Adds all fields needed for professional briefing system per product spec
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. BRIEFING_SOURCES UPGRADES
-- ────────────────────────────────────────────────────────────────────────────

-- Fetch configuration
ALTER TABLE briefing_sources ADD COLUMN allow_inline_reading INTEGER DEFAULT 0;
ALTER TABLE briefing_sources ADD COLUMN fetch_mode TEXT DEFAULT 'rss_only' CHECK(fetch_mode IN ('rss_only', 'readability', 'oembed'));

-- Summary configuration (note: summary_mode may conflict with existing column, using COLUMN IF NOT EXISTS pattern)
ALTER TABLE briefing_sources ADD COLUMN summary_mode_v2 TEXT DEFAULT 'auto' CHECK(summary_mode_v2 IN ('auto', 'manual', 'off'));
ALTER TABLE briefing_sources ADD COLUMN summary_length_override TEXT CHECK(summary_length_override IN ('short', 'medium', 'long') OR summary_length_override IS NULL);
ALTER TABLE briefing_sources ADD COLUMN excerpt_length_override INTEGER;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. BRIEFING_ITEMS UPGRADES  
-- ────────────────────────────────────────────────────────────────────────────

-- Content fields (excerpt may already exist as raw_excerpt - we'll use both)
ALTER TABLE briefing_items ADD COLUMN excerpt_clean TEXT;

-- Structured summary fields (the "Our Briefing" section)
ALTER TABLE briefing_items ADD COLUMN summary_what_changed TEXT;
ALTER TABLE briefing_items ADD COLUMN summary_why_matters TEXT;
ALTER TABLE briefing_items ADD COLUMN summary_takeaway TEXT;

-- Content storage
ALTER TABLE briefing_items ADD COLUMN content_text TEXT;

-- Reading status tracking
ALTER TABLE briefing_items ADD COLUMN reading_status TEXT DEFAULT 'rss_only' CHECK(reading_status IN ('rss_only', 'inline_ok', 'blocked', 'fetch_failed'));
ALTER TABLE briefing_items ADD COLUMN blocked_reason TEXT;

-- Metadata
ALTER TABLE briefing_items ADD COLUMN author TEXT;
ALTER TABLE briefing_items ADD COLUMN word_count INTEGER;
ALTER TABLE briefing_items ADD COLUMN reading_time_min INTEGER;

-- Add index for reading_status
CREATE INDEX IF NOT EXISTS idx_briefing_items_reading_status ON briefing_items(reading_status);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. APP_CONFIG - ADD GLOBAL INTELLIGENCE SETTINGS
-- ────────────────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO app_config (key, value, description) VALUES
  -- Display settings
  ('INTEL_ITEMS_PER_CATEGORY', '2', 'Max items shown per category in right column (1-5)'),
  ('INTEL_SHOW_THUMBNAILS', 'true', 'Show thumbnails in intelligence feed'),
  ('INTEL_SHOW_READING_TIME', 'true', 'Show estimated reading time'),
  
  -- Summary settings
  ('INTEL_SUMMARY_LENGTH', 'medium', 'Global summary length: short | medium | long'),
  ('INTEL_EXCERPT_LENGTH', '400', 'Global excerpt length in characters (300-900)'),
  
  -- Existing settings to preserve
  ('INTEL_SUMMARY_MODE', 'standard', 'headlines | short | standard | extended'),
  ('INTEL_ARTICLE_VIEW', 'on', 'on | off — in-app article reader'),
  ('INTEL_COMMENTARY', 'off', 'on | off — founder commentary block');

-- ────────────────────────────────────────────────────────────────────────────
-- 4. CATEGORY STANDARDIZATION
-- ────────────────────────────────────────────────────────────────────────────

-- Update category values to match spec:
-- ai_news → AI SOFTWARE (but keep db key as ai_software for consistency)
-- Keep: ai_robotics, ai_medicine, ai_business

-- First, rename ai_news to ai_software in items
UPDATE briefing_items SET category = 'ai_software' WHERE category = 'ai_news';

-- Update category hints in sources
UPDATE briefing_sources SET category_hint = 'ai_software' WHERE category_hint = 'ai_news';

-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION COMPLETE
-- ────────────────────────────────────────────────────────────────────────────
