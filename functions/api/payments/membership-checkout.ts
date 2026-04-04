/**
 * POST /api/payments/membership-checkout
 *
 * Creates a Stripe Checkout session for the current membership tier.
 * Requires a valid Better Auth session — user must be logged in.
 */

import { createStripeCheckoutSession } from "../_services/stripe";
import { getReferralCodeFromCookie } from "../_services/referral";

const FOUNDING_PRICE_ID = "price_1TIb5xPfo4k2CwqTnaEHqThG";
const STANDARD_PRICE_ID = "price_1TIbZWPfo4k2CwqTVbhAeIgD";
const FOUNDING_LIMIT = 50;

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = Record<string, unknown>>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
      all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
    };
    first: <T = Record<string, unknown>>() => Promise<T | null>;
  };
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface SessionResponse {
  data?: { user?: { id?: string } };
  user?: { id?: string };
}

async function getSessionUserId(request: Request): Promise<string | null> {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/auth/get-session`, {
    method: "GET",
    headers: { cookie: request.headers.get("cookie") || "" },
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as SessionResponse;
  return data.data?.user?.id || data.user?.id || null;
}

export const onRequestPost: PagesFunction<{
  PROVENAI_DB: D1Database;
  STRIPE_SECRET_KEY?: string;
}> = async ({ request, env }) => {
  try {
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Stripe not configured" }),
        { status: 503, headers: JSON_HEADERS }
      );
    }

    const userId = await getSessionUserId(request);
    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: JSON_HEADERS }
      );
    }

    const db = env.PROVENAI_DB;

    // Check if user is already a paid member
    const userRow = await db
      .prepare("SELECT email, role, referred_by_code FROM user WHERE id = ?")
      .bind(userId)
      .first<{ email: string; role: string; referred_by_code: string | null }>()
      .catch(async () => {
        // Fallback if referred_by_code column missing
        return db
          .prepare("SELECT email, role FROM user WHERE id = ?")
          .bind(userId)
          .first<{ email: string; role: string; referred_by_code?: null }>();
      });

    if (!userRow?.email) {
      return new Response(
        JSON.stringify({ ok: false, error: "User not found" }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    if (userRow.role === "paid_member" || userRow.role === "admin") {
      return new Response(
        JSON.stringify({ error: "You are already a Proven AI member" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const paidCountRow = await db
      .prepare("SELECT COUNT(*) as total FROM user WHERE role = 'paid_member'")
      .first<{ total: number }>();
    const paidCount = paidCountRow?.total ?? 0;
    const stripePriceId = paidCount < FOUNDING_LIMIT ? FOUNDING_PRICE_ID : STANDARD_PRICE_ID;

    const cookieRef = getReferralCodeFromCookie(request.headers.get("cookie"));
    const refCode = userRow.referred_by_code || cookieRef || "";

    const session = await createStripeCheckoutSession(
      { secretKey: stripeSecretKey, webhookSecret: "" },
      {
        mode: "subscription",
        successUrl: `https://provenai.app/membership/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `https://provenai.app/membership?checkout=cancelled`,
        customerEmail: userRow.email,
        stripePriceId: stripePriceId,
        metadata: {
          user_id: userId,
          email: userRow.email,
          ref_code: refCode,
          product_id: "proven_ai_business_membership",
          product_sku: "proven_ai_business_founding_member",
          product_name: "ProvenAI Business Founding Member",
        },
      }
    );

    return new Response(
      JSON.stringify({ ok: true, url: session.url }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[payments.membership-checkout]", { error: message });
    return new Response(
      JSON.stringify({ ok: false, error: `Unable to create checkout session: ${message}` }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
