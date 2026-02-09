-- Add role column for BetterAuth user

ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'member';
