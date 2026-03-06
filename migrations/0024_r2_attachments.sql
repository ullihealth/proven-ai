-- Replace base64 file_data with R2 references
-- Step 1: Add new columns
ALTER TABLE pm_card_attachments ADD COLUMN file_url TEXT NOT NULL DEFAULT '';
ALTER TABLE pm_card_attachments ADD COLUMN r2_key TEXT NOT NULL DEFAULT '';

-- Step 2: Drop the old base64 column (D1 supports DROP COLUMN)
ALTER TABLE pm_card_attachments DROP COLUMN file_data;
