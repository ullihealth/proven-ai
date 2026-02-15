-- Server-side image storage (replaces localStorage base64)
-- Stores compressed JPEG data-URLs keyed by a semantic name.
-- Typical row size: ~40-60 KB (well within D1 row limit).

CREATE TABLE IF NOT EXISTS images (
  key        TEXT PRIMARY KEY,          -- e.g. "featured-slot-0", "topic-pick-1"
  data       TEXT NOT NULL,             -- base64 data-URL (data:image/jpeg;base64,...)
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
