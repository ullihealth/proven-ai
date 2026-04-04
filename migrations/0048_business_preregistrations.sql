-- Migration: 0048_business_preregistrations
-- Adds table for Business Founding Member pre-registration signups

CREATE TABLE IF NOT EXISTS business_preregistrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
