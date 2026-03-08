ALTER TABLE pm_cards ADD COLUMN category TEXT;

CREATE TABLE IF NOT EXISTS manager_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO manager_settings (key, value) VALUES 
  ('cat_a_days', '7'),
  ('cat_b_days', '30'),
  ('cat_c_days', '90'),
  ('cat_d_days', '180');
