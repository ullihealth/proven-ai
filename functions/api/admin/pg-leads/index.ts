/**
 * GET /api/admin/pg-leads
 *
 * Returns funnel stats for the current month:
 *   page views, anonymous prompts generated, email signups,
 *   SaasDesk sync failures, and conversion rates.
 */

import type { LessonApiEnv } from "../../lessons/_helpers";
import { requireAdmin, JSON_HEADERS } from "../../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const db = env.PROVENAI_DB;
  const monthBucket = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [pageViews, anonPrompts, signups, syncFailures] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) as count FROM pg_page_views WHERE date_bucket = ?")
      .bind(monthBucket)
      .first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) as count FROM pg_usage WHERE user_type = 'guest' AND date_bucket LIKE ?")
      .bind(`${monthBucket}%`)
      .first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) as count FROM pg_leads WHERE date_bucket = ?")
      .bind(monthBucket)
      .first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) as count FROM pg_leads WHERE saasdesk_synced = 0")
      .first<{ count: number }>(),
  ]);

  const views = pageViews?.count ?? 0;
  const prompts = anonPrompts?.count ?? 0;
  const subs = signups?.count ?? 0;
  const failures = syncFailures?.count ?? 0;

  return new Response(
    JSON.stringify({
      ok: true,
      month: monthBucket,
      page_views: views,
      anon_prompts: prompts,
      signups: subs,
      saasdesk_failures: failures,
      pct_tried: views > 0 ? Math.round((prompts / views) * 100) : 0,
      pct_signed_up: views > 0 ? Math.round((subs / views) * 100) : 0,
    }),
    { headers: JSON_HEADERS }
  );
};
