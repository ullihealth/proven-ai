/**
 * GET /api/admin/tools/migrate
 *
 * Creates the added_tools table if it does not already exist.
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

  await env.PROVENAI_DB.prepare(`
    CREATE TABLE IF NOT EXISTS added_tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      best_for TEXT NOT NULL DEFAULT '',
      primary_category TEXT NOT NULL,
      secondary_categories TEXT NOT NULL DEFAULT '[]',
      intent_tags TEXT NOT NULL DEFAULT '[]',
      platforms TEXT NOT NULL DEFAULT '["web"]',
      pricing_model TEXT NOT NULL DEFAULT 'freemium',
      skill_level TEXT NOT NULL DEFAULT 'beginner',
      trust_level TEXT NOT NULL DEFAULT 'unreviewed',
      official_url TEXT NOT NULL,
      last_reviewed TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      added_at TEXT DEFAULT (datetime('now'))
    )
  `).run();

  return new Response(
    JSON.stringify({ success: true, message: "added_tools table ready" }),
    { headers: JSON_HEADERS }
  );
};
