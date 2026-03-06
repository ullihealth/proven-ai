-- Add warning_hours column to pm_cards for RAG due-date alerting
-- Each card can have its own warning window (default 48 hours)

-- If 0026 already added it, this will be a no-op in practice.
-- Keeping as a separate migration for clarity.

ALTER TABLE pm_cards ADD COLUMN warning_hours INTEGER DEFAULT 48;
