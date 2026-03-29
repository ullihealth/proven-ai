import { requireAdmin } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const db = env.PROVENAI_DB;

  const [totalRow, byTierRows, recentRows, tierSettings] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) as count FROM membership_signups")
      .first<{ count: number }>(),
    db
      .prepare(
        "SELECT tier, COUNT(*) as count FROM membership_signups GROUP BY tier ORDER BY tier ASC"
      )
      .all<{ tier: number; count: number }>(),
    db
      .prepare(
        "SELECT email, tier, price_paid, signed_up_at FROM membership_signups ORDER BY signed_up_at DESC LIMIT 10"
      )
      .all<{
        email: string;
        tier: number;
        price_paid: number;
        signed_up_at: string;
      }>(),
    db
      .prepare(
        "SELECT key, value FROM site_settings WHERE key IN ('stripe_tier1_max','stripe_tier2_max','stripe_tier1_price_id','stripe_tier2_price_id','stripe_tier3_price_id')"
      )
      .all<{ key: string; value: string }>(),
  ]);

  const settings: Record<string, string> = {};
  for (const row of tierSettings.results) {
    settings[row.key] = row.value;
  }

  const tier1Max = parseInt(settings["stripe_tier1_max"] ?? "100", 10);
  const tier2Max = parseInt(settings["stripe_tier2_max"] ?? "250", 10);
  const totalMembers = totalRow?.count ?? 0;

  let currentTier: number;
  let tierLimit: number;
  let priceUsd: number;
  let membersAtThisTier: number;

  if (totalMembers < tier1Max) {
    currentTier = 1;
    tierLimit = tier1Max;
    priceUsd = 97;
    membersAtThisTier = totalMembers;
  } else if (totalMembers < tier2Max) {
    currentTier = 2;
    tierLimit = tier2Max;
    priceUsd = 197;
    membersAtThisTier = totalMembers - tier1Max;
  } else {
    currentTier = 3;
    tierLimit = 0;
    priceUsd = 497;
    membersAtThisTier = totalMembers - tier2Max;
  }

  const spotsRemaining =
    currentTier === 1
      ? tier1Max - totalMembers
      : currentTier === 2
      ? tier2Max - totalMembers
      : 0;

  return new Response(
    JSON.stringify({
      total_paid_members: totalMembers,
      by_tier: byTierRows.results,
      recent: recentRows.results,
      current_tier: {
        tier: currentTier,
        price_usd: priceUsd,
        spots_remaining: spotsRemaining,
        tier_limit: tierLimit,
        members_at_this_tier: membersAtThisTier,
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
