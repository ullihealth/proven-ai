/**
 * GET /api/admin/prompt-generator/stats
 *
 * Returns usage stats for the admin stats page.
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

  const db = env.PROVENAI_DB;
  const nowIso = new Date().toISOString();
  const todayBucket = nowIso.slice(0, 10);
  const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRow, todayRow, weekRow, byModel, byUserType, recent] = await Promise.all([
    db.prepare("SELECT COUNT(*) as cnt FROM pg_usage").first<{ cnt: number }>(),
    db.prepare("SELECT COUNT(*) as cnt FROM pg_usage WHERE date_bucket = ?").bind(todayBucket).first<{ cnt: number }>(),
    db.prepare("SELECT COUNT(*) as cnt FROM pg_usage WHERE used_at >= ?").bind(weekAgoIso).first<{ cnt: number }>(),
    db.prepare("SELECT model, COUNT(*) as cnt FROM pg_usage GROUP BY model").all<{ model: string; cnt: number }>(),
    db.prepare("SELECT user_type, COUNT(*) as cnt FROM pg_usage GROUP BY user_type").all<{ user_type: string; cnt: number }>(),
    db.prepare(
      "SELECT id, user_identifier, user_type, model, used_at FROM pg_usage ORDER BY used_at DESC LIMIT 20"
    ).all<{ id: string; user_identifier: string; user_type: string; model: string; used_at: string }>(),
  ]);

  return new Response(
    JSON.stringify({
      success: true,
      total: totalRow?.cnt ?? 0,
      today: todayRow?.cnt ?? 0,
      thisWeek: weekRow?.cnt ?? 0,
      byModel: Object.fromEntries((byModel.results || []).map((r) => [r.model, r.cnt])),
      byUserType: Object.fromEntries((byUserType.results || []).map((r) => [r.user_type, r.cnt])),
      recent: (recent.results || []).map((r) => ({
        ...r,
        // Truncate identifier for privacy
        user_identifier: r.user_identifier.length > 20
          ? r.user_identifier.slice(0, 8) + "…" + r.user_identifier.slice(-6)
          : r.user_identifier,
      })),
    }),
    { headers: JSON_HEADERS }
  );
};
