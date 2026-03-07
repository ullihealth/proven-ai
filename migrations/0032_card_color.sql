-- Add color column to pm_cards for per-card bar color on timeline
ALTER TABLE pm_cards ADD COLUMN color TEXT DEFAULT NULL;
