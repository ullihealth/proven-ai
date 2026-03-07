-- Add color column to pm_boards
ALTER TABLE pm_boards ADD COLUMN color TEXT NOT NULL DEFAULT '#00bcd4';
