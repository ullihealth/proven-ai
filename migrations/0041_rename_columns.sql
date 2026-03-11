-- Rename Platform board column "In Build" → "Active"
UPDATE pm_columns SET name = '🔨 Active' WHERE id = 'platform-build';

-- Rename Platform board column "Live" → "Completed"
UPDATE pm_columns SET name = '✅ Completed' WHERE id = 'platform-live';
