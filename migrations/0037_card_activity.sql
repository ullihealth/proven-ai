-- Card activity log for Performance page heatmap
CREATE TABLE IF NOT EXISTS pm_card_activity (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  card_id     TEXT NOT NULL,
  card_title  TEXT NOT NULL DEFAULT '',
  board_id    TEXT NOT NULL DEFAULT '',
  board_name  TEXT NOT NULL DEFAULT '',
  event_type  TEXT NOT NULL,          -- 'opened' | 'edited' | 'checklist' | 'moved'
  occurred_at TEXT NOT NULL,          -- ISO-8601 timestamp
  date        TEXT NOT NULL           -- YYYY-MM-DD (for grouping)
);

CREATE INDEX IF NOT EXISTS idx_pm_card_activity_user_date ON pm_card_activity(user_id, date);
CREATE INDEX IF NOT EXISTS idx_pm_card_activity_user_card ON pm_card_activity(user_id, card_id);
