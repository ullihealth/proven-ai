-- Migration 0046: Premium course infrastructure with auto price reduction
ALTER TABLE courses ADD COLUMN is_premium INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN premium_launch_date TEXT;
ALTER TABLE courses ADD COLUMN premium_launch_price_cents INTEGER;
ALTER TABLE courses ADD COLUMN premium_reduced_price_cents INTEGER;
ALTER TABLE courses ADD COLUMN premium_reduced_after_days INTEGER NOT NULL DEFAULT 90;
ALTER TABLE courses ADD COLUMN premium_included_after_days INTEGER NOT NULL DEFAULT 180;
ALTER TABLE courses ADD COLUMN premium_stripe_launch_price_id TEXT;
ALTER TABLE courses ADD COLUMN premium_stripe_reduced_price_id TEXT;
