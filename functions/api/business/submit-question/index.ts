/**
 * POST /api/business/submit-question
 *
 * Requires auth. Accepts { question } and inserts into business_questions.
 */

import { requireAuth, JSON_HEADERS } from "../../admin/lessons/_helpers";
import type { LessonApiEnv } from "../../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => ({}))) as { question?: string };
    const question = typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return new Response(
        JSON.stringify({ ok: false, error: "Question is required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    await env.PROVENAI_DB
      .prepare(
        "INSERT INTO business_questions (user_id, question) VALUES (?, ?)"
      )
      .bind(auth.userId, question)
      .run();

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[business.submit-question]", { error: message });
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to submit question" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
