/**
 * Admin Site Settings API
 *
 * GET  /api/admin/site-settings          — list all settings (or ?key=xxx for one)
 * POST /api/admin/site-settings          — upsert { key, value }
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

// GET — read setting(s)
export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const db = env.PROVENAI_DB;

  if (key) {
    const row = await db
      .prepare("SELECT key, value FROM site_settings WHERE key = ?")
      .bind(key)
      .first<{ key: string; value: string }>();

    return new Response(
      JSON.stringify({ success: true, key, value: row?.value ?? null }),
      { headers: JSON_HEADERS }
    );
  }

  // All settings
  const { results } = await db
    .prepare("SELECT key, value FROM site_settings")
    .all<{ key: string; value: string }>();

  const settings: Record<string, string> = {};
  for (const row of results || []) {
    settings[row.key] = row.value;
  }

  return new Response(JSON.stringify({ success: true, settings }), { headers: JSON_HEADERS });
};

// POST — upsert a setting
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
