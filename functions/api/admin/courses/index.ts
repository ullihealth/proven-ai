/**
 * Admin Courses API — CRUD for courses
 *
 * GET    /api/admin/courses          — list all courses (public read)
 * POST   /api/admin/courses          — create a course
 * PUT    /api/admin/courses          — update a course
 * DELETE /api/admin/courses?id=xxx   — delete a course
 * PATCH  /api/admin/courses          — reorder courses
 */

import { requireAdmin, JSON_HEADERS } from "../lessons/_helpers";
import type { LessonApiEnv } from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapCourseRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string) || '',
    estimatedTime: (row.estimated_time as string) || '',
    courseType: (row.course_type as string) || 'short',
    lifecycleState: (row.lifecycle_state as string) || 'current',
    difficulty: (row.difficulty as string) || undefined,
    capabilityTags: safeJsonParse(row.capability_tags, []),
    lastUpdated: (row.last_updated as string) || '',
    href: (row.href as string) || '',
    sections: safeJsonParse(row.sections, []),
    toolsUsed: safeJsonParse(row.tools_used, []),
    releaseDate: (row.release_date as string) || undefined,
    order: (row.order as number) ?? 0,
    cardTitle: (row.card_title as string) || undefined,
    thumbnailUrl: (row.thumbnail_url as string) || undefined,
    pageStyle: safeJsonParse(row.page_style, undefined),
    visualSettings: safeJsonParse(row.visual_settings, undefined),
  };
}

// GET — list all courses (no auth required — public read)
export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ env }) => {
  const db = env.PROVENAI_DB;
  const { results } = await db
    .prepare(
      'SELECT id, slug, title, description, estimated_time, course_type, lifecycle_state, difficulty, capability_tags, last_updated, href, sections, tools_used, release_date, "order", card_title, thumbnail_url, page_style, visual_settings FROM courses ORDER BY "order", title'
    )
    .all();

  const courses = (results || []).map((row) =>
    mapCourseRow(row as Record<string, unknown>)
  );

  return new Response(JSON.stringify({ ok: true, courses }), {
    headers: JSON_HEADERS,
  });
};

// POST — create a new course
export const onRequestPost: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const id = (body.id as string) || `course-${Date.now()}`;
  const slug = (body.slug as string) || id;
  const title = (body.title as string) || 'Untitled Course';
  const description = (body.description as string) || '';
  const estimatedTime = (body.estimatedTime as string) || '';
  const courseType = (body.courseType as string) || 'short';
  const lifecycleState = (body.lifecycleState as string) || 'current';
  const difficulty = (body.difficulty as string) || null;
  const capabilityTags = JSON.stringify(body.capabilityTags || []);
  const lastUpdated = (body.lastUpdated as string) || new Date().toISOString().split('T')[0];
  const href = (body.href as string) || `/learn/courses/${slug}`;
  const sections = JSON.stringify(body.sections || []);
  const toolsUsed = JSON.stringify(body.toolsUsed || []);
  const releaseDate = (body.releaseDate as string) || null;
  const order = (body.order as number) ?? 0;
  const cardTitle = (body.cardTitle as string) || null;
  const thumbnailUrl = (body.thumbnailUrl as string) || null;
  const pageStyle = body.pageStyle ? JSON.stringify(body.pageStyle) : null;
  const visualSettings = body.visualSettings ? JSON.stringify(body.visualSettings) : null;

  const db = env.PROVENAI_DB;

  await db
    .prepare(
      `INSERT INTO courses (id, slug, title, description, estimated_time, course_type, lifecycle_state, difficulty, capability_tags, last_updated, href, sections, tools_used, release_date, "order", card_title, thumbnail_url, page_style, visual_settings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, slug, title, description, estimatedTime, courseType, lifecycleState, difficulty, capabilityTags, lastUpdated, href, sections, toolsUsed, releaseDate, order, cardTitle, thumbnailUrl, pageStyle, visualSettings)
    .run();

  return new Response(
    JSON.stringify({ ok: true, id }),
    { status: 201, headers: JSON_HEADERS }
  );
};

// PUT — update an existing course
export const onRequestPut: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const id = body.id as string;
  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;

  await db
    .prepare(
      `UPDATE courses SET
        slug = ?, title = ?, description = ?, estimated_time = ?,
        course_type = ?, lifecycle_state = ?, difficulty = ?,
        capability_tags = ?, last_updated = ?, href = ?,
        sections = ?, tools_used = ?, release_date = ?, "order" = ?,
        card_title = ?, thumbnail_url = ?, page_style = ?, visual_settings = ?,
        updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      (body.slug as string) || id,
      (body.title as string) || '',
      (body.description as string) || '',
      (body.estimatedTime as string) || '',
      (body.courseType as string) || 'short',
      (body.lifecycleState as string) || 'current',
      (body.difficulty as string) || null,
      JSON.stringify(body.capabilityTags || []),
      (body.lastUpdated as string) || '',
      (body.href as string) || '',
      JSON.stringify(body.sections || []),
      JSON.stringify(body.toolsUsed || []),
      (body.releaseDate as string) || null,
      (body.order as number) ?? 0,
      (body.cardTitle as string) || null,
      (body.thumbnailUrl as string) || null,
      body.pageStyle ? JSON.stringify(body.pageStyle) : null,
      body.visualSettings ? JSON.stringify(body.visualSettings) : null,
      id
    )
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// DELETE — delete a course
export const onRequestDelete: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;
  await db.prepare("DELETE FROM courses WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// PATCH — reorder courses
export const onRequestPatch: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { orderedIds: string[] };
  if (!body.orderedIds?.length) {
    return new Response(JSON.stringify({ error: "orderedIds required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;
  const statements = body.orderedIds.map((id, i) =>
    db.prepare('UPDATE courses SET "order" = ? WHERE id = ?').bind(i, id)
  );
  await db.batch(statements);

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
