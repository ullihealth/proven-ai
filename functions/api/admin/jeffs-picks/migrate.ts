/**
 * GET /api/admin/jeffs-picks/migrate
 *
 * Creates the jeffs_picks table if it does not already exist.
 * Admin-only. Run once after deployment.
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

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS jeffs_picks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_id TEXT NOT NULL,
        category TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        added_at TEXT DEFAULT (datetime('now')),
        UNIQUE(tool_id, category)
      )`
    )
    .run();

  return new Response(
    JSON.stringify({ success: true, message: "jeffs_picks table ready" }),
    { headers: JSON_HEADERS }
  );
};
