/**
 * One-time migration endpoint: push localStorage lessons + modules into D1.
 *
 * POST /api/admin/migrate-lessons
 * Body: { lessons: Lesson[], modules: Module[] }
 *
 * • Skips any lesson / module whose id already exists in D1.
 * • Returns counts of inserted vs skipped items.
 */

import type { LessonApiEnv } from "./lessons/_helpers";
import { requireAdmin, JSON_HEADERS } from "./lessons/_helpers";

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({
  request,
  env,
}) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    lessons: Array<{
      id: string;
      courseId: string;
      moduleId?: string | null;
      title: string;
      order: number;
      contentBlocks?: unknown[];
      quiz?: unknown | null;
      chapterTitle?: string | null;
      streamVideoId?: string | null;
    }>;
    modules: Array<{
      id: string;
      courseId: string;
      title: string;
      order: number;
    }>;
  };

  if (!Array.isArray(body.lessons) && !Array.isArray(body.modules)) {
    return new Response(
      JSON.stringify({ error: "lessons and/or modules array required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const db = env.PROVENAI_DB;
  const stats = {
    modulesInserted: 0,
    modulesSkipped: 0,
    lessonsInserted: 0,
    lessonsSkipped: 0,
  };

  // ── Modules first ──────────────────────────────────────────
  const modules = body.modules || [];
  if (modules.length > 0) {
    // Get existing module ids
    const { results: existingModules } = await db
      .prepare("SELECT id FROM modules")
      .all();
    const existingModuleIds = new Set(
      (existingModules || []).map((r: Record<string, unknown>) => r.id as string)
    );

    const moduleStmts = [];
    for (const mod of modules) {
      if (existingModuleIds.has(mod.id)) {
        stats.modulesSkipped++;
        continue;
      }
      moduleStmts.push(
        db
          .prepare(
            'INSERT INTO modules (id, course_id, title, "order") VALUES (?, ?, ?, ?)'
          )
          .bind(mod.id, mod.courseId, mod.title, mod.order ?? 0)
      );
      stats.modulesInserted++;
    }
    if (moduleStmts.length > 0) {
      await db.batch(moduleStmts);
    }
  }

  // ── Lessons ────────────────────────────────────────────────
  const lessons = body.lessons || [];
  if (lessons.length > 0) {
    const { results: existingLessons } = await db
      .prepare("SELECT id FROM lessons")
      .all();
    const existingLessonIds = new Set(
      (existingLessons || []).map((r: Record<string, unknown>) => r.id as string)
    );

    const lessonStmts = [];
    for (const lesson of lessons) {
      if (existingLessonIds.has(lesson.id)) {
        stats.lessonsSkipped++;
        continue;
      }
      lessonStmts.push(
        db
          .prepare(
            'INSERT INTO lessons (id, course_id, module_id, title, "order", content_blocks, quiz, chapter_title, stream_video_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          )
          .bind(
            lesson.id,
            lesson.courseId,
            lesson.moduleId ?? null,
            lesson.title,
            lesson.order ?? 0,
            JSON.stringify(lesson.contentBlocks ?? []),
            lesson.quiz ? JSON.stringify(lesson.quiz) : null,
            lesson.chapterTitle ?? null,
            lesson.streamVideoId ?? null
          )
      );
      stats.lessonsInserted++;
    }
    if (lessonStmts.length > 0) {
      await db.batch(lessonStmts);
    }
  }

  return new Response(JSON.stringify({ ok: true, ...stats }), {
    headers: JSON_HEADERS,
  });
};
