/**
 * GET /api/prompt-generator/validate-token?token=xxx
 *
 * Validates a guest token and returns user info if valid.
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: JSON_HEADERS }
      );
    }

    const db = env.PROVENAI_DB;
    const nowIso = new Date().toISOString();

    const row = await db
      .prepare(
        "SELECT id, email, expires_at FROM pg_guest_tokens WHERE token = ? AND expires_at > ? LIMIT 1"
      )
      .bind(token, nowIso)
      .first<{ id: string; email: string; expires_at: string }>();

    if (!row) {
      return new Response(JSON.stringify({ valid: false }), { headers: JSON_HEADERS });
    }

    // Update last_used_at without extending expiry
    await db
      .prepare("UPDATE pg_guest_tokens SET last_used_at = ? WHERE id = ?")
      .bind(nowIso, row.id)
      .run();

    return new Response(
      JSON.stringify({ valid: true, email: row.email, user_type: "free_subscriber" }),
      { headers: JSON_HEADERS }
    );
  } catch {
    return new Response(
      JSON.stringify({ valid: false }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
