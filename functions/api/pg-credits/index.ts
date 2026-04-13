/**
 * GET /api/pg-credits
 *
 * Returns the current user's monthly credit balance.
 * Uses the same user resolution logic as generate.ts.
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";
import { JSON_HEADERS } from "../admin/lessons/_helpers";

type UserType = "paid_member" | "free_subscriber";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

async function resolveUser(
  request: Request,
  env: LessonApiEnv,
  token: string | null | undefined
): Promise<{ identifier: string; userType: UserType; tier: number } | null> {
  try {
    const sessionUrl = new URL("/api/auth/get-session", request.url);
    const res = await fetch(sessionUrl.toString(), {
      method: "GET",
      headers: request.headers,
      credentials: "include",
    });
    if (res.ok) {
      const data = (await res.json()) as { user?: { id?: string } };
      if (data.user?.id) {
        const userId = data.user.id;
        const row = await env.PROVENAI_DB
          .prepare("SELECT role FROM user WHERE id = ?")
          .bind(userId)
          .first<{ role: string }>();
        const role = row?.role ?? "member";
        const userType: UserType =
          role === "paid_member" || role === "admin"
            ? "paid_member"
            : "free_subscriber";

        let tier = 1;
        if (userType === "paid_member") {
          const signup = await env.PROVENAI_DB
            .prepare(
              "SELECT tier FROM membership_signups WHERE user_id = ? ORDER BY signed_up_at DESC LIMIT 1"
            )
            .bind(userId)
            .first<{ tier: number }>();
          tier = signup?.tier ?? 2;
        }

        return { identifier: userId, userType, tier };
      }
    }
  } catch { /* fall through */ }

  if (token) {
    const nowIso = new Date().toISOString();
    const row = await env.PROVENAI_DB
      .prepare(
        "SELECT email FROM pg_guest_tokens WHERE token = ? AND expires_at > ? LIMIT 1"
      )
      .bind(token, nowIso)
      .first<{ email: string }>();
    if (row) {
      return { identifier: row.email, userType: "free_subscriber", tier: 0 };
    }
  }

  return null;
}

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    const user = await resolveUser(request, env, token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const limits = await env.PROVENAI_DB
      .prepare(
        "SELECT tier, tier_name, monthly_credits FROM pg_limits WHERE tier = ?"
      )
      .bind(user.tier)
      .first<{ tier: number; tier_name: string; monthly_credits: number }>();

    const monthBucket = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usedRow = await env.PROVENAI_DB
      .prepare(
        "SELECT SUM(credits_deducted) as total FROM pg_usage WHERE user_identifier = ? AND date_bucket LIKE ?"
      )
      .bind(user.identifier, `${monthBucket}%`)
      .first<{ total: number | null }>();

    const creditsUsed = usedRow?.total ?? 0;
    const creditsTotal = limits?.monthly_credits ?? 10;
    const tierName = limits?.tier_name ?? "Guest";

    return new Response(
      JSON.stringify({
        credits_used: creditsUsed,
        credits_total: creditsTotal,
        credits_remaining: Math.max(0, creditsTotal - creditsUsed),
        tier: user.tier,
        tier_name: tierName,
      }),
      { headers: JSON_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
