/**
 * Public Daily Flow API (read-only)
 *
 * GET /api/daily-flow           — all published posts
 * GET /api/daily-flow?day=xxx   — published posts for a specific day
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";

const JSON_HEADERS = { "Content-Type": "application/json" };

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

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const db = env.PROVENAI_DB;
  const url = new URL(request.url);
  const day = url.searchParams.get("day");

  let query = `SELECT id, day, title, description, video_type, video_url, caption, status,
                      published_at, visual_settings, created_at, updated_at
               FROM daily_flow_posts WHERE status = 'published'`;
  const binds: string[] = [];

  if (day) {
    query += " AND day = ?";
    binds.push(day);
  }

  query += " ORDER BY published_at DESC";

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
