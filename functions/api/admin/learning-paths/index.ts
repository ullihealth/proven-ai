/**
 * Admin Learning Paths API — CRUD
 *
 * GET    /api/admin/learning-paths         — list all
 * POST   /api/admin/learning-paths         — create
 * PUT    /api/admin/learning-paths         — update
 * DELETE /api/admin/learning-paths?id=xxx  — delete
 * PATCH  /api/admin/learning-paths         — reorder
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

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    courseIds: safeJsonParse(row.course_ids, []),
    order: (row.order as number) ?? 0,
  };
}

// GET — list all
export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ env }) => {
  const db = env.PROVENAI_DB;
  const { results } = await db
    .prepare('SELECT id, title, description, course_ids, "order" FROM learning_paths ORDER BY "order", title')
    .all();

  const paths = (results || []).map((row) => mapRow(row as Record<string, unknown>));
  return new Response(JSON.stringify({ ok: true, paths }), { headers: JSON_HEADERS });
};

// POST — create
export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const id = (body.id as string) || `path-${Date.now()}`;
  const title = (body.title as string) || 'Untitled Path';
  const description = (body.description as string) || '';
  const courseIds = JSON.stringify(body.courseIds || []);
  const order = (body.order as number) ?? 0;

  const db = env.PROVENAI_DB;
  await db
    .prepare('INSERT INTO learning_paths (id, title, description, course_ids, "order") VALUES (?, ?, ?, ?, ?)')
    .bind(id, title, description, courseIds, order)
    .run();

  return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers: JSON_HEADERS });
};

// PUT — update
export const onRequestPut: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const id = body.id as string;
  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: JSON_HEADERS });
  }

  const db = env.PROVENAI_DB;
  await db
    .prepare(
      `UPDATE learning_paths SET title = ?, description = ?, course_ids = ?, "order" = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .bind(
      (body.title as string) || '',
      (body.description as string) || '',
      JSON.stringify(body.courseIds || []),
      (body.order as number) ?? 0,
      id
    )
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// DELETE
export const onRequestDelete: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: JSON_HEADERS });
  }

  const db = env.PROVENAI_DB;
  await db.prepare("DELETE FROM learning_paths WHERE id = ?").bind(id).run();
  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// PATCH — reorder
export const onRequestPatch: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { orderedIds: string[] };
  if (!body.orderedIds?.length) {
    return new Response(JSON.stringify({ error: "orderedIds required" }), { status: 400, headers: JSON_HEADERS });
  }

  const db = env.PROVENAI_DB;
  const stmts = body.orderedIds.map((id, i) =>
    db.prepare('UPDATE learning_paths SET "order" = ? WHERE id = ?').bind(i, id)
  );
  await db.batch(stmts);

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
