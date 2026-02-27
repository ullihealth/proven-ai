-- Affiliate + Stripe integration schema

-- BetterAuth user profile referral attribution
ALTER TABLE user ADD COLUMN referred_by_code TEXT;
ALTER TABLE user ADD COLUMN referral_captured_at TEXT;

CREATE INDEX IF NOT EXISTS idx_user_referred_by_code ON user(referred_by_code);

-- Stripe webhook idempotency tracking
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT
);

-- Purchases recorded from successful Stripe webhook events
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  product_id TEXT,
  product_sku TEXT,
  amount_gross REAL NOT NULL,
  currency TEXT NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_event_id TEXT NOT NULL UNIQUE,
  ref_code TEXT,
  purchased_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stripe_event_id) REFERENCES stripe_webhook_events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_ref_code ON purchases(ref_code);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_intent ON purchases(stripe_payment_intent_id);

-- Prevent duplicate commission POSTs to SaaSDesk
CREATE TABLE IF NOT EXISTS saasdesk_commission_sync (
  stripe_payment_id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  commission_id TEXT,
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payload TEXT
);

-- Optional local product mapping from ProvenAI product_id -> SaaSDesk product_id
CREATE TABLE IF NOT EXISTS saasdesk_product_map (
  proven_product_id TEXT PRIMARY KEY,
  saasdesk_product_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
