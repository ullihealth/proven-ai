-- Board-scoped labels and card-label assignments

CREATE TABLE IF NOT EXISTS pm_labels (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES pm_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pm_card_labels (
  card_id TEXT NOT NULL REFERENCES pm_cards(id) ON DELETE CASCADE,
  label_id TEXT NOT NULL REFERENCES pm_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_pm_labels_board ON pm_labels(board_id);
CREATE INDEX IF NOT EXISTS idx_pm_card_labels_card ON pm_card_labels(card_id);
CREATE INDEX IF NOT EXISTS idx_pm_card_labels_label ON pm_card_labels(label_id);
