/**
 * /api/admin/business-feed
 *
 * GET    — list all posts newest first
 * POST   — create a new post { title, body }
 * DELETE /:id — delete a post by id
 */

import { requireAdmin, JSON_HEADERS } from "../../admin/lessons/_helpers";
import type { LessonApiEnv } from "../../admin/lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Response | Promise<Response>;

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const auth = await requireAdmin(request, env);
    if (!auth.ok) return auth.response;

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
    console.error("[admin.business-feed GET]", { error: message });
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to fetch posts" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const auth = await requireAdmin(request, env);
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => ({}))) as { title?: string; body?: string };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const postBody = typeof body.body === "string" ? body.body.trim() : "";

    if (!title || !postBody) {
      return new Response(
        JSON.stringify({ ok: false, error: "title and body are required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    await env.PROVENAI_DB
      .prepare(
        "INSERT INTO business_feed (title, body, created_at) VALUES (?, ?, datetime('now'))"
      )
      .bind(title, postBody)
      .run();

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[admin.business-feed POST]", { error: message });
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to create post" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};

export const onRequestDelete: PagesFunction<LessonApiEnv> = async ({ request, env, params }) => {
  try {
    const auth = await requireAdmin(request, env);
    if (!auth.ok) return auth.response;

    const id = params?.id;
    if (!id) {
      return new Response(
        JSON.stringify({ ok: false, error: "id is required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    await env.PROVENAI_DB
      .prepare("DELETE FROM business_feed WHERE id = ?")
      .bind(Number(id))
      .run();

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[admin.business-feed DELETE]", { error: message });
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to delete post" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
