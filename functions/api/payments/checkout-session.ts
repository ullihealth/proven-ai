import { createStripeCheckoutSession } from "../_services/stripe";
import { getReferralCodeFromCookie } from "../_services/referral";

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = Record<string, unknown>>() => Promise<T | null>;
      run: () => Promise<{ success: boolean }>;
    };
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

interface CheckoutBody {
  product_id?: string;
  product_sku?: string;
  product_name?: string;
  stripe_price_id?: string;
  amount?: number;
  currency?: string;
  success_url?: string;
  cancel_url?: string;
}

async function getSessionUserId(request: Request): Promise<string | null> {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/auth/get-session`, {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
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
      return new Response(JSON.stringify({ ok: false, error: "Stripe not configured" }), {
        status: 503,
        headers: JSON_HEADERS,
      });
    }

    const userId = await getSessionUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const body = (await request.json()) as CheckoutBody;
    const productId = (body.product_id || "").trim();
    const productSku = (body.product_sku || "").trim();
    const productName = (body.product_name || "").trim();
    const stripePriceId = (body.stripe_price_id || "").trim();
    const currency = (body.currency || "usd").trim().toLowerCase();

    if (!productId) {
      return new Response(JSON.stringify({ ok: false, error: "product_id is required" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    if (!stripePriceId && (!Number.isFinite(body.amount) || (body.amount as number) <= 0 || !productName)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Provide stripe_price_id or amount + product_name",
        }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    let userRow: { email: string; referred_by_code: string | null } | null = null;
    try {
      userRow = await env.PROVENAI_DB
        .prepare("SELECT email, referred_by_code FROM user WHERE id = ?")
        .bind(userId)
        .first<{ email: string; referred_by_code: string | null }>();
    } catch (dbError) {
      const message = dbError instanceof Error ? dbError.message : String(dbError);
      if (message.includes("no such column: referred_by_code")) {
        const fallback = await env.PROVENAI_DB
          .prepare("SELECT email FROM user WHERE id = ?")
          .bind(userId)
          .first<{ email: string }>();

        userRow = fallback ? { email: fallback.email, referred_by_code: null } : null;
        console.warn("[payments.checkout.schema_fallback]", {
          reason: "missing_referred_by_code_column",
          userId,
        });
      } else {
        throw dbError;
      }
    }

    if (!userRow?.email) {
      return new Response(JSON.stringify({ ok: false, error: "User not found" }), {
        status: 404,
        headers: JSON_HEADERS,
      });
    }

    const cookieRef = getReferralCodeFromCookie(request.headers.get("cookie"));
    const refCode = userRow.referred_by_code || cookieRef || "";

    const url = new URL(request.url);
    const session = await createStripeCheckoutSession(
      {
        secretKey: stripeSecretKey,
        webhookSecret: "",
      },
      {
        successUrl: body.success_url || `${url.origin}/courses/paid?checkout=success`,
        cancelUrl: body.cancel_url || `${url.origin}/courses/paid?checkout=cancelled`,
        customerEmail: userRow.email,
        stripePriceId: stripePriceId || undefined,
        amountCents: stripePriceId ? undefined : Math.round((body.amount as number) * 100),
        currency,
        productName: stripePriceId ? undefined : productName,
        metadata: {
          user_id: userId,
          email: userRow.email,
          ref_code: refCode,
          product_id: productId,
          product_sku: productSku || productId,
        },
      }
    );

    return new Response(JSON.stringify({ ok: true, id: session.id, url: session.url }), {
      headers: JSON_HEADERS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[payments.checkout]", {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(JSON.stringify({ ok: false, error: `Unable to create checkout session: ${message}` }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
};
