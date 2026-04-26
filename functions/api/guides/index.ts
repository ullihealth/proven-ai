/**
 * Public Guides API (read-only)
 *
 * GET /api/guides — list all active guides
 */

import { JSON_HEADERS } from "../admin/lessons/_helpers";
import type { LessonApiEnv } from "../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({
  env,
}) => {
  const db = env.PROVENAI_DB;
  const { results } = await db
    .prepare(
      "SELECT id, title, description, image_url, pdf_url, sort_order FROM guides WHERE is_active = 1 ORDER BY sort_order ASC"
    )
    .all();

  return new Response(JSON.stringify({ ok: true, guides: results || [] }), {
    headers: JSON_HEADERS,
  });
};
