-- Rate-limiting: track failed/attempted logins per IP
CREATE TABLE IF NOT EXISTS login_attempts (
  ip           TEXT NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS login_attempts_ip_time_idx
  ON login_attempts (ip, attempted_at);
