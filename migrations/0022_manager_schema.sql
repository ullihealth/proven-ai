-- ProvenAI Manager: boards, columns, cards, checklists, labels

CREATE TABLE IF NOT EXISTS pm_boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pm_columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES pm_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pm_cards (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES pm_boards(id) ON DELETE CASCADE,
  column_id TEXT NOT NULL REFERENCES pm_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TEXT,
  priority TEXT NOT NULL DEFAULT 'backlog', -- critical | this_week | backlog
  assignee TEXT NOT NULL DEFAULT 'jeff',    -- jeff | wife
  content_type TEXT DEFAULT '',
  platform TEXT DEFAULT '',
  card_type TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pm_checklists (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES pm_cards(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pm_labels (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES pm_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#00bcd4'
);

CREATE TABLE IF NOT EXISTS pm_card_labels (
  card_id TEXT NOT NULL REFERENCES pm_cards(id) ON DELETE CASCADE,
  label_id TEXT NOT NULL REFERENCES pm_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_pm_cards_board ON pm_cards(board_id);
CREATE INDEX IF NOT EXISTS idx_pm_cards_column ON pm_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_pm_cards_due ON pm_cards(due_date);
CREATE INDEX IF NOT EXISTS idx_pm_checklists_card ON pm_checklists(card_id);

-- Seed boards
INSERT INTO pm_boards (id, name, icon, sort_order) VALUES
  ('content', 'Content Pipeline', '📝', 1),
  ('platform', 'ProvenAI Platform', '🚀', 2),
  ('funnel', 'Funnel & Email', '📧', 3),
  ('bizdev', 'Business Development', '🤝', 4),
  ('strategy', 'Strategy & Horizon', '🧠', 5);

-- Seed columns for Content Pipeline
INSERT INTO pm_columns (id, board_id, name, sort_order) VALUES
  ('content-idea', 'content', '💡 Idea', 1),
  ('content-scripted', 'content', '✍️ Scripted', 2),
  ('content-recording', 'content', '🎬 Recording', 3),
  ('content-scheduled', 'content', '📅 Scheduled', 4),
  ('content-published', 'content', '✅ Published', 5);

-- Seed columns for ProvenAI Platform
INSERT INTO pm_columns (id, board_id, name, sort_order) VALUES
  ('platform-planned', 'platform', '🗂️ Planned', 1),
  ('platform-build', 'platform', '🔨 In Build', 2),
  ('platform-review', 'platform', '👀 Review', 3),
  ('platform-live', 'platform', '🚀 Live', 4);

-- Seed columns for Funnel & Email
INSERT INTO pm_columns (id, board_id, name, sort_order) VALUES
  ('funnel-planned', 'funnel', '📋 Planned', 1),
  ('funnel-building', 'funnel', '🔧 Building', 2),
  ('funnel-testing', 'funnel', '🧪 Testing', 3),
  ('funnel-active', 'funnel', '✅ Active', 4),
  ('funnel-archived', 'funnel', '📦 Archived', 5);

-- Seed columns for Business Development
INSERT INTO pm_columns (id, board_id, name, sort_order) VALUES
  ('bizdev-research', 'bizdev', '🔍 Researching', 1),
  ('bizdev-outreach', 'bizdev', '📬 Outreach Sent', 2),
  ('bizdev-convo', 'bizdev', '💬 In Conversation', 3),
  ('bizdev-agreed', 'bizdev', '🤝 Agreed', 4),
  ('bizdev-active', 'bizdev', '✅ Active / Complete', 5);

-- Seed columns for Strategy & Horizon
INSERT INTO pm_columns (id, board_id, name, sort_order) VALUES
  ('strategy-parking', 'strategy', '🧠 Ideas Parking Lot', 1),
  ('strategy-exploring', 'strategy', '🔍 Exploring', 2),
  ('strategy-pending', 'strategy', '⏳ Decision Pending', 3),
  ('strategy-decided', 'strategy', '✅ Decided / Active', 4),
  ('strategy-archived', 'strategy', '🗄️ Archived', 5);

-- Seed cards
INSERT INTO pm_cards (id, board_id, column_id, title, priority, assignee, content_type, sort_order) VALUES
  ('c1', 'content', 'content-scripted', 'Post 2 — HeyGen avatar video script (AI landscape + reporting role)', 'critical', 'jeff', 'HeyGen Video', 1),
  ('c2', 'content', 'content-scripted', 'Post 3 — Written caption for Gen E infographic', 'this_week', 'jeff', 'FB Profile Post', 2),
  ('c3', 'content', 'content-idea', 'Post 4 — ChatGPT vs full AI landscape gap post', 'this_week', 'jeff', 'FB Profile Post', 1),
  ('c4', 'content', 'content-idea', 'Build 15-post rolling buffer for FB profile', 'critical', 'jeff', 'FB Profile Post', 2),
  ('c5', 'content', 'content-idea', '10 pre-load posts for FB group before launch', 'critical', 'jeff', 'FB Group Post', 3),
  ('c6', 'content', 'content-idea', 'Monday–Friday HeyGen video structure (awareness/myth/outcomes/wins/tease)', 'backlog', 'jeff', 'HeyGen Video', 4);

INSERT INTO pm_cards (id, board_id, column_id, title, priority, assignee, card_type, sort_order) VALUES
  ('p1', 'platform', 'platform-planned', 'Add Course 3 content', 'this_week', 'jeff', 'Course', 1),
  ('p2', 'platform', 'platform-planned', 'Member experience review — onboarding flow', 'backlog', 'jeff', 'Design', 2);

INSERT INTO pm_cards (id, board_id, column_id, title, priority, assignee, card_type, sort_order) VALUES
  ('f1', 'funnel', 'funnel-building', 'Day 7 value email — evergreen sequence', 'this_week', 'jeff', 'Evergreen Sequence', 1),
  ('f2', 'funnel', 'funnel-planned', 'Group launch broadcast email', 'critical', 'jeff', 'Broadcast Campaign', 1),
  ('f3', 'funnel', 'funnel-planned', 'ProvenAI launch email to full list', 'critical', 'jeff', 'Broadcast Campaign', 2),
  ('f4', 'funnel', 'funnel-testing', 'Landing page provenai.app/book — final test', 'critical', 'jeff', 'Landing Page', 1);

INSERT INTO pm_cards (id, board_id, column_id, title, priority, assignee, card_type, sort_order) VALUES
  ('b1', 'bizdev', 'bizdev-research', 'Identify podcast guesting targets in AI/over-40 niche', 'backlog', 'jeff', 'Podcast', 1),
  ('b2', 'strategy', 'strategy-exploring', 'LinkedIn + YouTube Shorts expansion strategy', 'backlog', 'jeff', '', 1),
  ('b3', 'bizdev', 'bizdev-research', 'Identify mid-sized Facebook accounts for collaborative posts', 'this_week', 'jeff', 'Collaboration', 2);

INSERT INTO pm_cards (id, board_id, column_id, title, priority, assignee, sort_order) VALUES
  ('s1', 'strategy', 'strategy-pending', 'Facebook group launch date — confirm and set', 'critical', 'jeff', 1),
  ('s2', 'strategy', 'strategy-exploring', 'ProvenAI pricing ladder review', 'backlog', 'jeff', 2),
  ('s3', 'strategy', 'strategy-parking', 'Email list referral mechanics', 'backlog', 'jeff', 1);
