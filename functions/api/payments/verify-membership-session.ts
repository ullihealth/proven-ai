/**
 * POST /api/payments/verify-membership-session
 *
 * Verifies a completed Stripe checkout session for a membership purchase.
 * Requires a valid Better Auth session.
 *
 * Body: { session_id: string }
 * Returns: { verified: true, tier: number, email: string } | { verified: false }
 */

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface SessionResponse {
  data?: { user?: { id?: string; email?: string } };
  user?: { id?: string; email?: string };
}

async function getSessionUser(
  request: Request
): Promise<{ id: string; email: string } | null> {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/auth/get-session`, {
    method: "GET",
    headers: { cookie: request.headers.get("cookie") || "" },
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as SessionResponse;
  const user = data.data?.user || data.user;
  if (!user?.id || !user?.email) return null;
  return { id: user.id, email: user.email };
}

interface StripeSessionData {
  payment_status?: string;
  metadata?: {
    product_id?: string;
    tier?: string;
    user_id?: string;
  };
  customer_details?: { email?: string };
}

export const onRequestPost: PagesFunction<{
  STRIPE_SECRET_KEY?: string;
}> = async ({ request, env }) => {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) {
    return new Response(
      JSON.stringify({ verified: false, error: "Unauthorized" }),
      { status: 401, headers: JSON_HEADERS }
    );
  }

  if (!env.STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ verified: false, error: "Not configured" }),
      { status: 503, headers: JSON_HEADERS }
    );
  }

  let body: { session_id?: string };
  try {
    body = (await request.json()) as { session_id?: string };
  } catch {
    return new Response(
      JSON.stringify({ verified: false, error: "Invalid body" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const sessionId = (body.session_id ?? "").trim();
  if (!sessionId) {
    return new Response(
      JSON.stringify({ verified: false, error: "session_id required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      }
    );

    if (!res.ok) {
      return new Response(
        JSON.stringify({ verified: false }),
        { headers: JSON_HEADERS }
      );
    }

    const session = (await res.json()) as StripeSessionData;

    if (
      session.payment_status !== "paid" ||
      session.metadata?.product_id !== "proven_ai_membership"
    ) {
      return new Response(
        JSON.stringify({ verified: false }),
        { headers: JSON_HEADERS }
      );
    }

    const tier = parseInt(session.metadata?.tier ?? "0", 10);

    return new Response(
      JSON.stringify({
        verified: true,
        tier,
        email: sessionUser.email,
      }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[payments.verify-membership-session]", { error: message });
    return new Response(
      JSON.stringify({ verified: false }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
