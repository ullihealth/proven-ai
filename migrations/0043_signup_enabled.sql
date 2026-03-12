-- Enable/disable public signup on the auth page
-- Default: false (closed to new signups — admin must explicitly enable)
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('signup_enabled', 'false');
