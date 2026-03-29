-- Migration 0045: Membership tables + tiered Stripe pricing
-- Apply the missing tables from migration 0017 (Stripe/affiliate) first,
-- using schemas that match the existing webhook handler code.

-- Stripe webhook idempotency tracking
-- Column names match functions/api/payments/stripe-webhook.ts exactly
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  processed_at TEXT,
  error TEXT
);

-- Purchases recorded from successful Stripe webhook events
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_sku TEXT,
  amount_gross REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_event_id TEXT NOT NULL UNIQUE,
  ref_code TEXT,
  purchased_at TEXT NOT NULL,
  FOREIGN KEY (stripe_event_id) REFERENCES stripe_webhook_events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_payment_intent 
  ON purchases(stripe_payment_intent_id);

-- SaaS Desk commission sync tracking
-- Column names match functions/api/payments/stripe-webhook.ts exactly
CREATE TABLE IF NOT EXISTS saasdesk_commission_sync (
  stripe_payment_id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  payload TEXT,
  commission_id TEXT,
  synced_at TEXT
);

-- Product ID mapping from ProvenAI product IDs to SaaS Desk product IDs
CREATE TABLE IF NOT EXISTS saasdesk_product_map (
  proven_product_id TEXT PRIMARY KEY,
  saasdesk_product_id TEXT NOT NULL
);

-- Membership signups counter table
-- Used for tiered pricing: count rows to determine current tier
CREATE TABLE IF NOT EXISTS membership_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  tier INTEGER NOT NULL,
  price_paid INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  signed_up_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_membership_signups_tier 
  ON membership_signups(tier);

-- Add paid_member role support
-- (role column already exists on user table with default 'member')
-- No schema change needed — role is TEXT,
-- 'paid_member' just becomes a new valid value written by the webhook handler.

-- Tiered pricing configuration in site_settings
INSERT OR IGNORE INTO site_settings (key, value) 
  VALUES ('stripe_tier1_price_id', 'price_1TGG5SPfo4k2CwqTbzfNQ1ud');
INSERT OR IGNORE INTO site_settings (key, value) 
  VALUES ('stripe_tier1_max', '100');
INSERT OR IGNORE INTO site_settings (key, value) 
  VALUES ('stripe_tier2_price_id', 'price_1TGG6KPfo4k2CwqT70jObbEy');
INSERT OR IGNORE INTO site_settings (key, value) 
  VALUES ('stripe_tier2_max', '250');
INSERT OR IGNORE INTO site_settings (key, value) 
  VALUES ('stripe_tier3_price_id', 'price_1TGG6vPfo4k2CwqTlF9cCLmD');
INSERT OR IGNORE INTO site_settings (key, value) 
  VALUES ('stripe_secret_key', '');
INSERT OR IGNORE INTO site_settings (key, value) 
  VALUES ('stripe_webhook_secret', '');
