/**
 * GET /api/admin/business-questions
 *
 * Admin only. Returns all member questions newest first.
 */

import { requireAdmin, JSON_HEADERS } from "../../admin/lessons/_helpers";
import type { LessonApiEnv } from "../../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const auth = await requireAdmin(request, env);
    if (!auth.ok) return auth.response;

    const { results } = await env.PROVENAI_DB
      .prepare(
        "SELECT id, user_id, question, created_at FROM business_questions ORDER BY created_at DESC"
      )
      .all<{ id: number; user_id: string; question: string; created_at: string }>();

    return new Response(
      JSON.stringify({ ok: true, questions: results || [] }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[admin.business-questions]", { error: message });
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to fetch questions" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
