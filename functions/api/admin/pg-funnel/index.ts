/**
 * GET /api/admin/pg-funnel
 *
 * Returns prompt generator funnel stats for the current calendar month.
 * All percentage calculations are done on the frontend.
 *
 * Returns:
 * {
 *   page_views: number,
 *   anonymous_prompts: number,
 *   email_signups: number,
 *   saasdesk_failures: number
 * }
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  try {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const db = env.PROVENAI_DB;

    const [pageViewsRow, anonPromptsRow, signupsRow, failuresRow] = await Promise.all([
      db
        .prepare("SELECT COUNT(*) as count FROM pg_page_views WHERE date_bucket = ?")
        .bind(month)
        .first<{ count: number }>(),
      db
        .prepare("SELECT COUNT(*) as count FROM pg_usage WHERE user_type = 'guest' AND date_bucket = ?")
        .bind(month)
        .first<{ count: number }>(),
      db
        .prepare("SELECT COUNT(*) as count FROM pg_leads WHERE date_bucket = ?")
        .bind(month)
        .first<{ count: number }>(),
      db
        .prepare("SELECT COUNT(*) as count FROM pg_leads WHERE saasdesk_synced = 0")
        .first<{ count: number }>(),
    ]);

    return new Response(
      JSON.stringify({
        page_views: pageViewsRow?.count ?? 0,
        anonymous_prompts: anonPromptsRow?.count ?? 0,
        email_signups: signupsRow?.count ?? 0,
        saasdesk_failures: failuresRow?.count ?? 0,
      }),
      { headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("[admin/pg-funnel] error:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
