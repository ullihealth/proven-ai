/**
 * GET /api/business/feed
 *
 * Public — no auth required. Returns all business feed posts newest first.
 */

import { JSON_HEADERS } from "../../admin/lessons/_helpers";
import type { LessonApiEnv } from "../../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ env }) => {
  try {
    const { results } = await env.PROVENAI_DB
      .prepare(
        "SELECT id, title, body, created_at FROM business_feed ORDER BY created_at DESC"
      )
      .all<{ id: number; title: string; body: string; created_at: string }>();

    return new Response(
      JSON.stringify({ ok: true, posts: results || [] }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[business.feed]", { error: message });
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to fetch feed" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
