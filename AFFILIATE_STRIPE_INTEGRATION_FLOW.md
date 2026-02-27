# Affiliate + Stripe Integration Flow

## Overview

- **ProvenAI** is source of truth for app access and purchases.
- **SaaSDesk** is source of truth for contacts, affiliate attribution, commissions, and payouts.
- Sales are initiated in ProvenAI via server-side Stripe checkout session creation.
- All SaaSDesk calls are server-side only.

## Environment Variables

Required runtime config:

- `SAASDESK_BASE_URL`
- `SAASDESK_WEBHOOK_API_KEY` (secret)
- `SAASDESK_APP_ID`
- `STRIPE_SECRET_KEY` (secret)
- `STRIPE_WEBHOOK_SECRET` (secret)

Set secrets with Wrangler (example):

```bash
npx wrangler secret put SAASDESK_WEBHOOK_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Server Endpoints

- `GET /api/ref/capture?ref=CODE`
  - Validates referral code (`^[A-Za-z0-9]{4,16}$`)
  - Stores `provenai_ref` as an httpOnly cookie (30 days)
- `POST /api/ref/attach`
  - Attaches cookie ref to authenticated BetterAuth `user` profile (`referred_by_code`, `referral_captured_at`)
- `POST /api/payments/checkout-session`
  - Creates Stripe Checkout session server-side
  - Metadata includes `user_id`, `email`, `ref_code`, `product_id`, `product_sku`
- `POST /api/payments/stripe-webhook`
  - Verifies Stripe signature
  - Idempotently records webhook event + purchase
  - Syncs commission to SaaSDesk idempotently

## Data Model Additions

Migration `0017_affiliate_stripe_integration.sql` adds:

- `user.referred_by_code`
- `user.referral_captured_at`
- `stripe_webhook_events`
- `purchases`
- `saasdesk_commission_sync`
- `saasdesk_product_map`

## Flow Summary

1. Landing with `?ref=CODE` triggers `GET /api/ref/capture` and stores httpOnly cookie.
2. On sign-up/sign-in success, ProvenAI attaches ref to BetterAuth user profile.
3. On sign-up success, ProvenAI posts subscriber payload to SaaSDesk webhook.
4. User starts checkout from ProvenAI; checkout session metadata carries ref + product context.
5. Stripe webhook (`checkout.session.completed`) is verified and processed once per event.
6. Purchase is persisted; user can be elevated from `public` to `member`.
7. ProvenAI resolves affiliate link from SaaSDesk and posts pending commission once per payment.

## Test Checklist

- [ ] **Signup with `?ref=CODE`**
  - Open app URL with valid `ref`
  - Confirm cookie is set (`HttpOnly`, 30-day TTL)
  - Complete signup/login and verify `user.referred_by_code` + `referral_captured_at`
- [ ] **Payment success webhook**
  - Trigger Stripe test checkout
  - Verify `/api/payments/stripe-webhook` stores a `stripe_webhook_events` row and `purchases` row
- [ ] **SaaSDesk contact creation**
  - On successful signup, verify POST to `/api/webhooks/subscriber` includes `source=ProvenAI` and `ref` when available
- [ ] **SaaSDesk commission creation**
  - For paid checkout with valid ref, verify POST to `https://saas-desk.pages.dev/api/commissions/by-ref`
- [ ] **Duplicate webhook replay safety**
  - Replay same Stripe event ID
  - Verify no duplicate purchase row and no duplicate commission post for same payment

## Temporary QA Test Offer

- Set `ENABLE_STRIPE_TEST_OFFER=true` to show the temporary **Test Course ($1)** button.
- The offer uses inline Stripe `price_data` (`unit_amount=100`, `currency=usd`, `product_data.name="Test Course ($1)"`), so no Stripe dashboard product is required.
- Metadata sent to checkout includes `user_id`, `email`, `ref_code`, `product_id=test-course-1`, `product_sku=test-course-1`.

### Cleanup after QA

- Disable visibility by setting `ENABLE_STRIPE_TEST_OFFER=false` (or removing the var).
- Remove the temporary UI block in [src/pages/courses/PaidCourses.tsx](src/pages/courses/PaidCourses.tsx) when QA is complete.
