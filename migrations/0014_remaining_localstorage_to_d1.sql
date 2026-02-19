-- Migration 0014: Migrate ALL remaining localStorage stores to D1
--
-- ADMIN stores → app_visual_config key-value table (already exists)
--   Keys: app_colors, app_color_presets, guide_card_settings, guide_card_presets,
--          tool_card_settings, tool_card_presets, tool_logos, tool_trust_overrides,
--          course_visual_presets
--
-- USER stores → new user_preferences table (per-user key-value)

-- Per-user preferences table (onboarding dismissed, briefing density, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id   TEXT    NOT NULL,
  key       TEXT    NOT NULL,
  value     TEXT    NOT NULL,
  updated_at TEXT   DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, key)
);
