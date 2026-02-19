-- Migration 0013: Move remaining localStorage content to D1
-- Guides, Daily Flow, Platform Updates, Editor's Picks, Footer Config, Control Centre

-- ========== GUIDES ==========

CREATE TABLE IF NOT EXISTS guides (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  who_for TEXT DEFAULT '',
  why_matters TEXT DEFAULT '',
  last_updated TEXT DEFAULT '',
  lifecycle_state TEXT DEFAULT 'current',
  difficulty TEXT DEFAULT 'beginner',
  tags TEXT DEFAULT '[]',
  primary_cluster_id TEXT,
  order_in_cluster INTEGER DEFAULT 0,
  show_in_cluster INTEGER DEFAULT 1,
  show_in_discovery INTEGER DEFAULT 1,
  thumbnail_url TEXT DEFAULT '',
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guide_clusters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0,
  max_guides INTEGER DEFAULT 5,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ========== DAILY FLOW ==========

CREATE TABLE IF NOT EXISTS daily_flow_posts (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_type TEXT DEFAULT 'url',
  video_url TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  published_at TEXT,
  visual_settings TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ========== SEED DEFAULT DATA ==========

-- Seed guide clusters
INSERT OR IGNORE INTO guide_clusters (id, title, description, "order", max_guides) VALUES
('getting-started', 'Getting Started', 'Your first steps into AI, designed to build confidence without overwhelm.', 0, 5),
('practical-applications', 'Practical Applications', 'Real-world guides for using AI in your daily work and business.', 1, 7),
('safety-and-privacy', 'Safety & Privacy', 'Essential knowledge for using AI responsibly and securely.', 2, 5);

-- Seed sample guides
INSERT OR IGNORE INTO guides (id, slug, title, description, who_for, why_matters, last_updated, lifecycle_state, difficulty, tags, primary_cluster_id, order_in_cluster, show_in_cluster, show_in_discovery, view_count, created_at) VALUES
('getting-started-intro', 'getting-started', 'Getting Started with AI: A Gentle Introduction', 'Your first steps into AI, written specifically for those who feel overwhelmed or uncertain.', 'Absolute beginners who feel intimidated by AI', 'A calm starting point reduces anxiety and builds confidence', '2026-01-28', 'current', 'beginner', '["introduction","beginners","fundamentals"]', 'getting-started', 0, 1, 1, 0, '2026-01-01T00:00:00Z'),
('choosing-first-tool', 'choosing-first-tool', 'Choosing Your First AI Tool', 'How to select the right AI tool for your needs without getting lost in options.', 'Anyone unsure which AI tool to try first', 'Starting with the right tool saves frustration', '2026-01-22', 'current', 'beginner', '["tools","getting-started","decision-making"]', 'getting-started', 1, 1, 1, 0, '2026-01-02T00:00:00Z'),
('ai-privacy-security', 'ai-privacy-security', 'Privacy & Security When Using AI', 'What to know about keeping your data safe when using AI tools.', 'Privacy-conscious professionals', 'Using AI safely is non-negotiable', '2026-01-18', 'current', 'intermediate', '["security","privacy","data-safety"]', 'safety-and-privacy', 0, 1, 1, 0, '2026-01-03T00:00:00Z'),
('ai-small-business', 'ai-small-business', 'Setting Up AI for Your Small Business', 'Practical guide to implementing AI tools in a small business context.', 'Small business owners and freelancers', 'AI can level the playing field for smaller operations', '2026-01-12', 'current', 'intermediate', '["business","implementation","practical"]', 'practical-applications', 0, 1, 1, 0, '2026-01-04T00:00:00Z');

-- Seed default platform updates
INSERT OR IGNORE INTO app_visual_config (key, value) VALUES
('platform_updates', '[{"id":"pu-1","label":"UPDATED","title":"AI Foundations for Professionals","href":"/learn/courses/ai-foundations","date":"2026-02-19T00:00:00.000Z"},{"id":"pu-2","label":"NEW","title":"Tools Directory — latest additions","href":"/tools/directory","date":"2026-02-19T00:00:00.000Z"}]');

-- Seed default editor's picks
INSERT OR IGNORE INTO app_visual_config (key, value) VALUES
('editors_picks', '[{"id":"pick-1","headline":"Why Every Professional Needs an AI Strategy in 2026","summary":"The shift from experimentation to execution — and what it means for your career.","meta":"5 min read","href":"/daily/monday","thumbnailUrl":"","tag":"Founder Recommended"},{"id":"pick-2","headline":"Prompt Engineering Is Dead. Here''s What Replaced It.","summary":"Agentic workflows are rewriting the rules. A concise guide to the new paradigm.","meta":"4 min read","href":"/daily/tuesday","thumbnailUrl":"","tag":"Strategic"}]');

-- Seed default footer config
INSERT OR IGNORE INTO app_visual_config (key, value) VALUES
('footer_config', '{"courses":{"mode":"index_only","selectedItems":[]},"publications":{"mode":"index_only","selectedItems":[]},"apps":{"mode":"index_only","selectedItems":[]},"social":{}}');

-- Seed default control centre config
INSERT OR IGNORE INTO app_visual_config (key, value) VALUES
('control_centre', '{"featuredSlots":[{"courseId":"ai-foundations","thumbnailOverride":null,"titleOverride":null,"descriptionOverride":null},{"courseId":"prompt-engineering-basics","thumbnailOverride":null,"titleOverride":null,"descriptionOverride":null},{"courseId":"","thumbnailOverride":null,"titleOverride":null,"descriptionOverride":null}]}');
