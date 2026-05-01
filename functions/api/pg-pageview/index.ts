/**
 * POST /api/pg-pageview
 *
 * Fire-and-forget page view tracking for the prompt generator.
 * No auth required. Inserts one row into pg_page_views.
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";
import { JSON_HEADERS } from "../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ env }) => {
  try {
    const now = new Date();
    await env.PROVENAI_DB
      .prepare("INSERT INTO pg_page_views (viewed_at, date_bucket) VALUES (?, ?)")
      .bind(now.toISOString(), now.toISOString().slice(0, 7))
      .run();
  } catch { /* silently fail — never block page load */ }

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
