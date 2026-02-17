/**
 * Admin Lessons API
 *
 * GET    /api/admin/lessons?courseId=xxx  — list lessons for a course
 * POST   /api/admin/lessons              — create a lesson
 * PUT    /api/admin/lessons              — update a lesson
 * DELETE /api/admin/lessons?id=xxx       — delete a lesson
 * PATCH  /api/admin/lessons              — bulk reorder / bulk save content blocks
 */

import {
  type LessonApiEnv,
  requireAdmin,
  JSON_HEADERS,
  mapLessonRow,
} from "./_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

// ─── GET: List lessons for a course ────────────────────────

export const onRequestGet: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  // Public read — any authenticated user can read lessons
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

// ─── POST: Create a lesson ──────────────────────────────────

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    courseId: string;
    title: string;
    moduleId?: string;
    chapterTitle?: string;
    order?: number;
  };

  if (!body.courseId || !body.title) {
    return new Response(JSON.stringify({ error: "courseId and title required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;

  // Calculate order if not provided
  let order = body.order;
  if (order == null) {
    const maxRow = await db
      .prepare(
        body.moduleId
          ? 'SELECT MAX("order") as max_order FROM lessons WHERE module_id = ?'
          : 'SELECT MAX("order") as max_order FROM lessons WHERE course_id = ?'
      )
      .bind(body.moduleId || body.courseId)
      .first<{ max_order: number | null }>();
    order = (maxRow?.max_order ?? 0) + 1;
  }

  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db
    .prepare(
      'INSERT INTO lessons (id, course_id, module_id, title, "order", content_blocks, quiz, chapter_title, stream_video_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      id,
      body.courseId,
      body.moduleId ?? null,
      body.title,
      order,
      "[]",
      null,
      body.chapterTitle ?? null,
      null
    )
    .run();

  const lesson = {
    id,
    courseId: body.courseId,
    moduleId: body.moduleId,
    title: body.title,
    order,
    contentBlocks: [],
    chapterTitle: body.chapterTitle,
  };

  return new Response(JSON.stringify({ ok: true, lesson }), {
    status: 201,
    headers: JSON_HEADERS,
  });
};

// ─── PUT: Update a lesson ───────────────────────────────────

export const onRequestPut: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    id: string;
    title?: string;
    moduleId?: string | null;
    order?: number;
    contentBlocks?: unknown[];
    quiz?: unknown | null;
    chapterTitle?: string | null;
    streamVideoId?: string | null;
  };

  if (!body.id) {
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const db = env.PROVENAI_DB;

  // Build dynamic SET clause
  const sets: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) {
    sets.push("title = ?");
    values.push(body.title);
  }
  if (body.moduleId !== undefined) {
    sets.push("module_id = ?");
    values.push(body.moduleId);
  }
  if (body.order !== undefined) {
    sets.push('"order" = ?');
    values.push(body.order);
  }
  if (body.contentBlocks !== undefined) {
    sets.push("content_blocks = ?");
    values.push(JSON.stringify(body.contentBlocks));
  }
  if (body.quiz !== undefined) {
    sets.push("quiz = ?");
    values.push(body.quiz ? JSON.stringify(body.quiz) : null);
  }
  if (body.chapterTitle !== undefined) {
    sets.push("chapter_title = ?");
    values.push(body.chapterTitle);
  }
  if (body.streamVideoId !== undefined) {
    sets.push("stream_video_id = ?");
    values.push(body.streamVideoId);
  }

  if (sets.length === 0) {
    return new Response(JSON.stringify({ error: "No fields to update" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  values.push(body.id);
  await db
    .prepare(`UPDATE lessons SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// ─── DELETE: Delete a lesson ────────────────────────────────

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
  await db.prepare("DELETE FROM lessons WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// ─── PATCH: Bulk operations (reorder, batch update) ─────────

export const onRequestPatch: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    action: "reorder" | "bulkUpdate";
    courseId?: string;
    // For reorder
    lessonIds?: string[];
    // For bulkUpdate — array of partial lesson objects (id + fields)
    lessons?: Array<{
      id: string;
      contentBlocks?: unknown[];
      quiz?: unknown | null;
      title?: string;
      order?: number;
      moduleId?: string | null;
      streamVideoId?: string | null;
    }>;
  };

  const db = env.PROVENAI_DB;

  if (body.action === "reorder" && body.lessonIds) {
    const statements = body.lessonIds.map((id, index) =>
      db.prepare('UPDATE lessons SET "order" = ? WHERE id = ?').bind(index + 1, id)
    );
    if (statements.length > 0) await db.batch(statements);
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }

  if (body.action === "bulkUpdate" && body.lessons) {
    const statements = body.lessons.map((lesson) => {
      const sets: string[] = [];
      const vals: unknown[] = [];

      if (lesson.contentBlocks !== undefined) {
        sets.push("content_blocks = ?");
        vals.push(JSON.stringify(lesson.contentBlocks));
      }
      if (lesson.quiz !== undefined) {
        sets.push("quiz = ?");
        vals.push(lesson.quiz ? JSON.stringify(lesson.quiz) : null);
      }
      if (lesson.title !== undefined) {
        sets.push("title = ?");
        vals.push(lesson.title);
      }
      if (lesson.order !== undefined) {
        sets.push('"order" = ?');
        vals.push(lesson.order);
      }
      if (lesson.moduleId !== undefined) {
        sets.push("module_id = ?");
        vals.push(lesson.moduleId);
      }
      if (lesson.streamVideoId !== undefined) {
        sets.push("stream_video_id = ?");
        vals.push(lesson.streamVideoId);
      }

      vals.push(lesson.id);
      return db.prepare(`UPDATE lessons SET ${sets.join(", ")} WHERE id = ?`).bind(...vals);
    });
    if (statements.length > 0) await db.batch(statements);
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
    headers: JSON_HEADERS,
  });
};
