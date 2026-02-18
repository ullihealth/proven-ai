/**
 * Admin App Visual Config API
 *
 * PUT /api/admin/visual-config — upsert a key-value pair
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

// PUT — upsert a config value
export const onRequestPut: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { key: string; value: unknown };
  if (!body.key) {
    return new Response(JSON.stringify({ error: "key required" }), { status: 400, headers: JSON_HEADERS });
  }

  const db = env.PROVENAI_DB;
  const valueStr = typeof body.value === 'string' ? body.value : JSON.stringify(body.value);

  await db
    .prepare(
      `INSERT INTO app_visual_config (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`
    )
    .bind(body.key, valueStr, valueStr)
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
