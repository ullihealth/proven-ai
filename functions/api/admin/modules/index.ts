/**
 * Admin Modules API
 *
 * GET    /api/admin/modules?courseId=xxx  — list modules for a course
 * POST   /api/admin/modules              — create a module
 * PUT    /api/admin/modules              — update a module
 * DELETE /api/admin/modules?id=xxx       — delete a module
 * PATCH  /api/admin/modules              — reorder modules
 */

import {
  type LessonApiEnv,
  requireAdmin,
  JSON_HEADERS,
  mapModuleRow,
} from "../lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

// ─── GET: List modules for a course ─────────────────────────

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
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

// ─── POST: Create a module ──────────────────────────────────

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    courseId: string;
    title: string;
    order?: number;
  };

  if (!body.courseId || !body.title) {
    return new Response(JSON.stringify({ error: "courseId and title required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;

  let order = body.order;
  if (order == null) {
    const maxRow = await db
      .prepare('SELECT MAX("order") as max_order FROM modules WHERE course_id = ?')
      .bind(body.courseId)
      .first<{ max_order: number | null }>();
    order = (maxRow?.max_order ?? 0) + 1;
  }

  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db
    .prepare('INSERT INTO modules (id, course_id, title, "order") VALUES (?, ?, ?, ?)')
    .bind(id, body.courseId, body.title, order)
    .run();

  const mod = { id, courseId: body.courseId, title: body.title, order };

  return new Response(JSON.stringify({ ok: true, module: mod }), {
    status: 201,
    headers: JSON_HEADERS,
  });
};

// ─── PUT: Update a module ───────────────────────────────────

export const onRequestPut: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    id: string;
    title?: string;
    order?: number;
  };

  if (!body.id) {
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;
  const sets: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) {
    sets.push("title = ?");
    values.push(body.title);
  }
  if (body.order !== undefined) {
    sets.push('"order" = ?');
    values.push(body.order);
  }

  if (sets.length === 0) {
    return new Response(JSON.stringify({ error: "No fields to update" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  values.push(body.id);
  await db
    .prepare(`UPDATE modules SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// ─── DELETE: Delete a module ────────────────────────────────

export const onRequestDelete: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
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

  // Unassign lessons in this module + delete the module
  await db.batch([
    db.prepare("UPDATE lessons SET module_id = NULL WHERE module_id = ?").bind(id),
    db.prepare("DELETE FROM modules WHERE id = ?").bind(id),
  ]);

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// ─── PATCH: Reorder modules ─────────────────────────────────

export const onRequestPatch: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    moduleIds: string[];
  };

  if (!body.moduleIds?.length) {
    return new Response(JSON.stringify({ error: "moduleIds required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;
  const statements = body.moduleIds.map((id, index) =>
    db.prepare('UPDATE modules SET "order" = ? WHERE id = ?').bind(index + 1, id)
  );

  await db.batch(statements);

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
