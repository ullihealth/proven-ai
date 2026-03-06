-- Replace goal_deadline with warning_hours for RAG status on due dates
-- Drop goal_deadline if it exists (safe idempotent pattern)
-- Note: D1 doesn't support DROP COLUMN, so we just add warning_hours

ALTER TABLE pm_cards ADD COLUMN warning_hours INTEGER DEFAULT 48;
