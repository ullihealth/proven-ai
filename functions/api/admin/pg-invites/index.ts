/**
 * GET /api/admin/pg-invites
 *
 * Returns all rows from pg_invite_tokens, sorted by created_at DESC.
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface InviteRow {
  id: number;
  token: string;
  email: string;
  created_at: string;
  activated_at: string | null;
  activated: number;
}

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  try {
    const { results } = await env.PROVENAI_DB
      .prepare("SELECT id, token, email, created_at, activated_at, activated FROM pg_invite_tokens ORDER BY created_at DESC")
      .all<InviteRow>();

    return new Response(
      JSON.stringify({ ok: true, tokens: results ?? [] }),
      { headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("[admin/pg-invites] GET error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
