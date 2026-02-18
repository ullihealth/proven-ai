-- Migration 0012: Add visual_settings, page_style, card_title, thumbnail_url to courses table
-- Also create learning_paths table and app_visual_config table

-- Add user-visible fields to courses
ALTER TABLE courses ADD COLUMN card_title TEXT;
ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN page_style TEXT DEFAULT '{}';
ALTER TABLE courses ADD COLUMN visual_settings TEXT DEFAULT '{}';

-- Learning paths — shared across all users
CREATE TABLE IF NOT EXISTS learning_paths (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  course_ids TEXT DEFAULT '[]',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Global visual config (card styling, badge colors, etc.) — one row per key
CREATE TABLE IF NOT EXISTS app_visual_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed default learning paths
INSERT OR IGNORE INTO learning_paths (id, title, description, course_ids, "order") VALUES
('complete-beginner', 'Complete Beginner', 'Never used AI before? Start here for a gentle introduction.', '["ai-foundations","mastering-chatgpt","ai-safety"]', 0),
('productivity-boost', 'Productivity Boost', 'Already using AI? Level up your daily workflows.', '["mastering-chatgpt","ai-email","prompt-engineering-basics"]', 1),
('professional-communicator', 'Professional Communicator', 'Focus on AI-assisted writing and communication.', '["ai-email","prompt-engineering-basics"]', 2),
('responsible-ai-user', 'Responsible AI User', 'Understand the ethical and safety considerations.', '["ai-safety","ai-foundations"]', 3);
