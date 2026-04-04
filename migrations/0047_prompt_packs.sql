-- Migration: 0047_prompt_packs
-- Adds prompt_packs table for downloadable prompt pack cards

CREATE TABLE IF NOT EXISTS prompt_packs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT,
  image_url   TEXT    NOT NULL,
  pdf_url     TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO prompt_packs (title, description, image_url, pdf_url, sort_order) VALUES
  (
    'Content Creation Prompt Pack',
    'Five expertly crafted prompts for blogs, video scripts, article outlines, introductions, and beginner summaries.',
    'https://pub-placeholder.r2.dev/prompt-packs/content-creation-cover.jpg',
    'https://pub-placeholder.r2.dev/prompt-packs/content-creation-prompt-pack.pdf',
    1
  );
