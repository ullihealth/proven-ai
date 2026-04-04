/**
 * GET /api/payments/membership-tier
 *
 * Returns the current tier, live price ID, price, and spots remaining.
 * Public — no auth required so the pricing page can show live tier info.
 */

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

const FOUNDING_LIMIT = 50;
const FOUNDING_PRICE_USD = 27;
const STANDARD_PRICE_USD = 47;

export async function getCurrentTierData(db: D1Database): Promise<{
  members_at_this_tier: number;
  tier_limit: number;
  spots_remaining: number;
  price_usd: number;
  is_founding: boolean;
}> {
  const countRow = await db
    .prepare("SELECT COUNT(*) as total FROM user WHERE role = 'paid_member'")
    .first<{ total: number }>();
  const count = countRow?.total ?? 0;
  const spotsRemaining = Math.max(0, FOUNDING_LIMIT - count);
  return {
    members_at_this_tier: count,
    tier_limit: FOUNDING_LIMIT,
    spots_remaining: spotsRemaining,
    price_usd: count < FOUNDING_LIMIT ? FOUNDING_PRICE_USD : STANDARD_PRICE_USD,
    is_founding: count < FOUNDING_LIMIT,
  };
}

export const onRequestGet: PagesFunction<{ PROVENAI_DB: D1Database }> = async ({
  env,
}) => {
  try {
    const data = await getCurrentTierData(env.PROVENAI_DB);
    return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[payments.membership-tier]", { error: message });
    return new Response(
      JSON.stringify({ error: "Failed to fetch tier data" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
