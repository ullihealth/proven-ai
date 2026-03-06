-- Card enhancements: attachments, hyperlinks, related-card links

CREATE TABLE IF NOT EXISTS pm_card_attachments (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES pm_cards(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pm_card_links (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES pm_cards(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pm_card_relations (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES pm_cards(id) ON DELETE CASCADE,
  related_card_id TEXT NOT NULL REFERENCES pm_cards(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(card_id, related_card_id)
);

CREATE INDEX IF NOT EXISTS idx_pm_attachments_card ON pm_card_attachments(card_id);
CREATE INDEX IF NOT EXISTS idx_pm_links_card ON pm_card_links(card_id);
CREATE INDEX IF NOT EXISTS idx_pm_relations_card ON pm_card_relations(card_id);
CREATE INDEX IF NOT EXISTS idx_pm_relations_related ON pm_card_relations(related_card_id);
