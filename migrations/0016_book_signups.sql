-- Book landing page signups (mirrors data sent to Sender.net)
CREATE TABLE IF NOT EXISTS book_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  firstname TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'book_page',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_book_signups_email ON book_signups (email);
