/**
 * Public Modules API (read-only)
 *
 * GET /api/modules?courseId=xxx — list modules for a course
 */

import { mapModuleRow } from "../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

const JSON_HEADERS = { "Content-Type": "application/json" };

export const onRequestGet: PagesFunction<{ PROVENAI_DB: D1Database }> = async ({
  env,
  request,
}) => {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId");

  if (!courseId) {
    return new Response(JSON.stringify({ error: "courseId required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;
  const { results } = await db
    .prepare('SELECT id, course_id, title, "order" FROM modules WHERE course_id = ? ORDER BY "order"')
    .bind(courseId)
    .all();

  const modules = (results || []).map((row) => mapModuleRow(row as Record<string, unknown>));

  return new Response(JSON.stringify({ ok: true, modules }), {
    headers: JSON_HEADERS,
  });
};
