-- Migrate legacy priority values to new A/B/C/D system
UPDATE pm_cards SET priority = 'A' WHERE priority = 'critical';
UPDATE pm_cards SET priority = 'B' WHERE priority = 'this_week';
UPDATE pm_cards SET priority = 'D' WHERE priority = 'backlog';
UPDATE pm_cards SET priority = 'D' WHERE priority IS NULL OR priority = '';
