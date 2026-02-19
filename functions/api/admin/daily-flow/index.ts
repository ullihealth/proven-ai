/**
 * Admin Daily Flow API — CRUD for daily flow posts
 *
 * GET    /api/admin/daily-flow           — list all posts (inc. drafts)
 * POST   /api/admin/daily-flow           — create a post
 * PUT    /api/admin/daily-flow           — update a post
 * DELETE /api/admin/daily-flow?id=xxx    — delete a post
 * PATCH  /api/admin/daily-flow           — publish or unpublish a post
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapPostRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    day: row.day as string,
    title: row.title as string,
    description: (row.description as string) || "",
    videoType: (row.video_type as string) || "url",
    videoUrl: (row.video_url as string) || "",
    caption: (row.caption as string) || "",
    status: (row.status as string) || "draft",
    publishedAt: (row.published_at as string) || undefined,
    visualSettings: safeJsonParse(row.visual_settings, {}),
    createdAt: (row.created_at as string) || "",
    updatedAt: (row.updated_at as string) || "",
  };
}

// GET — list all posts (admin sees drafts too)
export const onRequestGet: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const db = env.PROVENAI_DB;
  const url = new URL(request.url);
  const day = url.searchParams.get("day");

  let query = `SELECT id, day, title, description, video_type, video_url, caption, status,
                      published_at, visual_settings, created_at, updated_at
               FROM daily_flow_posts`;
  const binds: string[] = [];

  if (day) {
    query += " WHERE day = ?";
    binds.push(day);
  }

  query += " ORDER BY created_at DESC";

  const stmt = binds.length
    ? db.prepare(query).bind(...binds)
    : db.prepare(query);

  const { results } = await stmt.all();

  const posts = (results || []).map((r) =>
    mapPostRow(r as Record<string, unknown>)
  );

  return new Response(JSON.stringify({ ok: true, posts }), {
    headers: JSON_HEADERS,
  });
};

// POST — create a new post
export const onRequestPost: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const id =
    (body.id as string) ||
    `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const day = (body.day as string) || "monday";
  const title = (body.title as string) || "Untitled";
  const description = (body.description as string) || "";
  const videoType = (body.videoType as string) || "url";
  const videoUrl = (body.videoUrl as string) || "";
  const caption = (body.caption as string) || "";
  const status = (body.status as string) || "draft";
  const publishedAt =
    status === "published" ? new Date().toISOString() : null;
  const visualSettings = body.visualSettings
    ? JSON.stringify(body.visualSettings)
    : "{}";

  const db = env.PROVENAI_DB;
  await db
    .prepare(
      `INSERT INTO daily_flow_posts (id, day, title, description, video_type, video_url, caption,
        status, published_at, visual_settings, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
    .bind(
      id, day, title, description, videoType, videoUrl, caption,
      status, publishedAt, visualSettings
    )
    .run();

  return new Response(
    JSON.stringify({ ok: true, id }),
    { status: 201, headers: JSON_HEADERS }
  );
};

// PUT — update a post
export const onRequestPut: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const id = body.id as string;
  if (!id)
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });

  const db = env.PROVENAI_DB;
  await db
    .prepare(
      `UPDATE daily_flow_posts SET
        day = ?, title = ?, description = ?, video_type = ?, video_url = ?,
        caption = ?, status = ?, published_at = ?, visual_settings = ?,
        updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      (body.day as string) || "monday",
      (body.title as string) || "",
      (body.description as string) || "",
      (body.videoType as string) || "url",
      (body.videoUrl as string) || "",
      (body.caption as string) || "",
      (body.status as string) || "draft",
      (body.publishedAt as string) || null,
      body.visualSettings ? JSON.stringify(body.visualSettings) : "{}",
      id
    )
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// DELETE — remove a post
export const onRequestDelete: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id)
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });

  const db = env.PROVENAI_DB;
  await db.prepare("DELETE FROM daily_flow_posts WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// PATCH — publish or unpublish a post
export const onRequestPatch: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { id: string; action: "publish" | "unpublish" };
  if (!body.id || !body.action) {
    return new Response(
      JSON.stringify({ error: "id and action required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const db = env.PROVENAI_DB;

  if (body.action === "publish") {
    await db
      .prepare(
        `UPDATE daily_flow_posts SET status = 'published', published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
      )
      .bind(body.id)
      .run();
  } else {
    await db
      .prepare(
        `UPDATE daily_flow_posts SET status = 'draft', updated_at = datetime('now') WHERE id = ?`
      )
      .bind(body.id)
      .run();
  }

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
