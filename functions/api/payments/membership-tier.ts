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

const TIER_PRICES: Record<number, number> = { 1: 97, 2: 197, 3: 497 };

async function getSetting(db: D1Database, key: string): Promise<string | null> {
  const row = await db
    .prepare("SELECT value FROM site_settings WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

export async function getCurrentTierData(db: D1Database): Promise<{
  tier: number;
  price_id: string;
  price_usd: number;
  members_at_this_tier: number;
  tier_limit: number;
  spots_remaining: number;
}> {
  const countRow = await db
    .prepare("SELECT COUNT(*) as total FROM membership_signups")
    .first<{ total: number }>();
  const total = countRow?.total ?? 0;

  const [tier1Max, tier2Max, tier1PriceId, tier2PriceId, tier3PriceId] =
    await Promise.all([
      getSetting(db, "stripe_tier1_max"),
      getSetting(db, "stripe_tier2_max"),
      getSetting(db, "stripe_tier1_price_id"),
      getSetting(db, "stripe_tier2_price_id"),
      getSetting(db, "stripe_tier3_price_id"),
    ]);

  const t1Max = parseInt(tier1Max ?? "100", 10);
  const t2Max = parseInt(tier2Max ?? "250", 10);

  let tier: number;
  let priceId: string;
  let tierLimit: number;

  if (total < t1Max) {
    tier = 1;
    priceId = tier1PriceId ?? "price_1TGG5SPfo4k2CwqTbzfNQ1ud";
    tierLimit = t1Max;
  } else if (total < t2Max) {
    tier = 2;
    priceId = tier2PriceId ?? "price_1TGG6KPfo4k2CwqT70jObbEy";
    tierLimit = t2Max;
  } else {
    tier = 3;
    priceId = tier3PriceId ?? "price_1TGG6vPfo4k2CwqTlF9cCLmD";
    tierLimit = t2Max; // no hard cap on tier 3
  }

  const membersAtThisTier = tier === 1
    ? total
    : tier === 2
    ? total - t1Max
    : total - t2Max;

  const spotsRemaining = tier === 3 ? 999 : Math.max(0, tierLimit - total);

  return {
    tier,
    price_id: priceId,
    price_usd: TIER_PRICES[tier],
    members_at_this_tier: membersAtThisTier,
    tier_limit: tierLimit,
    spots_remaining: spotsRemaining,
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
