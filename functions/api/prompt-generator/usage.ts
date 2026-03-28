/**
 * GET /api/prompt-generator/usage
 *
 * Returns today's usage counts per model for the current user.
 * Accepts either a Better Auth session or a guest token query param.
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";
import { JSON_HEADERS } from "../admin/lessons/_helpers";

type PgModel = "claude" | "groq" | "gemini";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

async function resolveUser(
  request: Request,
  env: LessonApiEnv,
  tokenParam: string | null
): Promise<{ identifier: string; userType: "paid_member" | "free_subscriber" } | null> {
  // 1. Try Better Auth session
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
        return { identifier: data.user.id, userType: "paid_member" };
      }
    }
  } catch { /* fall through */ }

  // 2. Try guest token
  if (tokenParam) {
    const nowIso = new Date().toISOString();
    const row = await env.PROVENAI_DB
      .prepare(
        "SELECT email FROM pg_guest_tokens WHERE token = ? AND expires_at > ? LIMIT 1"
      )
      .bind(tokenParam, nowIso)
      .first<{ email: string }>();
    if (row) {
      return { identifier: row.email, userType: "free_subscriber" };
    }
  }

  return null;
}

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get("token");

    const user = await resolveUser(request, env, tokenParam);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const db = env.PROVENAI_DB;
    const dateBucket = new Date().toISOString().slice(0, 10);
    const models: PgModel[] = ["claude", "groq", "gemini"];

    const usage: Record<string, { used_today: number; daily_limit: number; remaining: number }> = {};

    for (const model of models) {
      const countRow = await db
        .prepare(
          "SELECT COUNT(*) as cnt FROM pg_usage WHERE user_identifier = ? AND model = ? AND date_bucket = ?"
        )
        .bind(user.identifier, model, dateBucket)
        .first<{ cnt: number }>();

      const limitKey = user.userType === "paid_member"
        ? `pg_${model}_paid_daily_limit`
        : `pg_${model}_free_daily_limit`;
      const limitRow = await db
        .prepare("SELECT value FROM site_settings WHERE key = ?")
        .bind(limitKey)
        .first<{ value: string }>();

      const usedToday = countRow?.cnt ?? 0;
      const dailyLimit = parseInt(limitRow?.value ?? "0", 10);

      usage[model] = {
        used_today: usedToday,
        daily_limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - usedToday),
      };
    }

    return new Response(
      JSON.stringify({ success: true, user_type: user.userType, usage }),
      { headers: JSON_HEADERS }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
