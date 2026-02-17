/**
 * Public Lessons API (read-only)
 *
 * GET /api/lessons?courseId=xxx — list lessons for a course (any authenticated user)
 */

import { mapLessonRow } from "../admin/lessons/_helpers";

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
    .prepare(
      'SELECT id, course_id, module_id, title, "order", content_blocks, quiz, chapter_title, stream_video_id FROM lessons WHERE course_id = ? ORDER BY "order"'
    )
    .bind(courseId)
    .all();

  const lessons = (results || []).map((row) => mapLessonRow(row as Record<string, unknown>));

  return new Response(JSON.stringify({ ok: true, lessons }), {
    headers: JSON_HEADERS,
  });
};
