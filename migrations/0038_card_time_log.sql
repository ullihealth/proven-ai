CREATE TABLE IF NOT EXISTS pm_card_time_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  card_title TEXT NOT NULL,
  board_id TEXT NOT NULL,
  board_name TEXT NOT NULL,
  date TEXT NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_card_time_log_user ON pm_card_time_log(user_id);
CREATE INDEX IF NOT EXISTS idx_card_time_log_card ON pm_card_time_log(card_id);
CREATE INDEX IF NOT EXISTS idx_card_time_log_date ON pm_card_time_log(date);
