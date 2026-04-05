/**
 * POST /api/business/onboarding-assessment
 *
 * Requires auth. Inserts a new row into business_onboarding.
 */

import { requireAuth, JSON_HEADERS } from "../../admin/lessons/_helpers";
import type { LessonApiEnv } from "../../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface AssessmentBody {
  name?: string;
  business_type?: string;
  years_running?: string;
  time_drains?: string;
  ai_experience?: string;
  success_definition?: string;
}

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => ({}))) as AssessmentBody;
    const business_type = typeof body.business_type === "string" ? body.business_type.trim() : "";

    if (!business_type) {
      return new Response(
        JSON.stringify({ ok: false, error: "business_type is required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    await env.PROVENAI_DB
      .prepare(
        `INSERT INTO business_onboarding
          (user_id, name, business_type, years_running, time_drains, ai_experience, success_definition)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        auth.userId,
        typeof body.name === "string" ? body.name.trim() : null,
        business_type,
        typeof body.years_running === "string" ? body.years_running.trim() : null,
        typeof body.time_drains === "string" ? body.time_drains.trim() : null,
        typeof body.ai_experience === "string" ? body.ai_experience.trim() : null,
        typeof body.success_definition === "string" ? body.success_definition.trim() : null,
      )
      .run();

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[business.onboarding-assessment]", { error: message });
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to save assessment" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
