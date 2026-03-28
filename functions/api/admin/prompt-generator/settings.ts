/**
 * Admin Prompt Generator Settings API
 *
 * GET  /api/admin/prompt-generator/settings  — list all pg_ settings
 * POST /api/admin/prompt-generator/settings  — upsert { key, value }
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
  const { results } = await db
    .prepare("SELECT key, value FROM site_settings WHERE key LIKE 'pg_%'")
    .all<{ key: string; value: string }>();

  const settings: Record<string, string> = {};
  for (const row of results || []) {
    settings[row.key] = row.value;
  }

  return new Response(JSON.stringify({ success: true, settings }), { headers: JSON_HEADERS });
};

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { key?: string; value?: string };
  if (!body.key || typeof body.value !== "string") {
    return new Response(
      JSON.stringify({ success: false, error: "key and value (string) required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  // Only allow pg_ keys through this endpoint
  if (!body.key.startsWith("pg_")) {
    return new Response(
      JSON.stringify({ success: false, error: "Only pg_ keys are allowed" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const db = env.PROVENAI_DB;
  await db
    .prepare(
      `INSERT INTO site_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = ?`
    )
    .bind(body.key, body.value, body.value)
    .run();

  return new Response(
    JSON.stringify({ success: true, key: body.key, value: body.value }),
    { headers: JSON_HEADERS }
  );
};
