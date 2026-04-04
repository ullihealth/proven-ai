/**
 * Admin Business Pre-registrations API
 *
 * GET /api/admin/business-preregistrations — list all, newest first
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const { results } = await env.PROVENAI_DB
    .prepare(
      "SELECT id, email, created_at FROM business_preregistrations ORDER BY id DESC LIMIT 500"
    )
    .all<{ id: number; email: string; created_at: string }>();

  return new Response(
    JSON.stringify({ ok: true, registrations: results || [], total: (results || []).length }),
    { headers: JSON_HEADERS }
  );
};
