// D1 Adapter - Cloudflare D1 implementation for lesson and progress storage

import type { StorageAdapter } from './types';
import { STORAGE_KEYS } from './types';
import type { CourseProgress, Lesson } from '../courses/lessonTypes';

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  run: () => Promise<{ success: boolean }>;
};

export type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<Array<{ success: boolean }>>;
};

const LESSON_COLUMNS = 'id, course_id, title, "order", content_blocks, quiz, chapter_title';
const PROGRESS_COLUMNS =
  'user_id, course_id, completed_lesson_ids, quiz_scores, current_lesson_id, started_at, last_accessed_at';

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class D1Adapter implements StorageAdapter {
  constructor(private db: D1Database) {}

  async get<T>(key: string): Promise<T | null> {
    if (key === STORAGE_KEYS.LESSONS) {
      const { results } = await this.db
        .prepare(`SELECT ${LESSON_COLUMNS} FROM lessons ORDER BY course_id, "order"`)
        .all<{
          id: string;
          course_id: string;
          title: string;
          order: number;
          content_blocks: string | null;
          quiz: string | null;
          chapter_title: string | null;
        }>();

      const lessons = results.map((row) => ({
        id: row.id,
        courseId: row.course_id,
        title: row.title,
        order: row.order,
        contentBlocks: parseJson(row.content_blocks, []),
        quiz: parseJson(row.quiz, undefined),
        chapterTitle: row.chapter_title ?? undefined,
      })) as Lesson[];

      return lessons as T;
    }

    if (key === STORAGE_KEYS.COURSE_PROGRESS) {
      const { results } = await this.db
        .prepare(`SELECT ${PROGRESS_COLUMNS} FROM user_progress`)
        .all<{
          user_id: string;
          course_id: string;
          completed_lesson_ids: string | null;
          quiz_scores: string | null;
          current_lesson_id: string | null;
          started_at: string;
          last_accessed_at: string;
        }>();

      const progress = results.map((row) => ({
        userId: row.user_id,
        courseId: row.course_id,
        completedLessonIds: parseJson(row.completed_lesson_ids, []),
        quizScores: parseJson(row.quiz_scores, {}),
        currentLessonId: row.current_lesson_id ?? undefined,
        startedAt: row.started_at,
        lastAccessedAt: row.last_accessed_at,
      })) as CourseProgress[];

      return progress as T;
    }

    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (key === STORAGE_KEYS.LESSONS) {
      const lessons = Array.isArray(value) ? (value as Lesson[]) : [];
      await this.db.prepare('DELETE FROM lessons').run();
      if (lessons.length === 0) return;

      const statements = lessons.map((lesson) =>
        this.db
          .prepare(
            'INSERT INTO lessons (id, course_id, title, "order", content_blocks, quiz, chapter_title) VALUES (?, ?, ?, ?, ?, ?, ?)'
          )
          .bind(
            lesson.id,
            lesson.courseId,
            lesson.title,
            lesson.order,
            JSON.stringify(lesson.contentBlocks || []),
            lesson.quiz ? JSON.stringify(lesson.quiz) : null,
            lesson.chapterTitle ?? null
          )
      );

      await this.db.batch(statements);
      return;
    }

    if (key === STORAGE_KEYS.COURSE_PROGRESS) {
      const progress = Array.isArray(value) ? (value as CourseProgress[]) : [];
      await this.db.prepare('DELETE FROM user_progress').run();
      if (progress.length === 0) return;

      const statements = progress.map((entry) =>
        this.db
          .prepare(
            'INSERT INTO user_progress (user_id, course_id, completed_lesson_ids, quiz_scores, current_lesson_id, started_at, last_accessed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          )
          .bind(
            entry.userId,
            entry.courseId,
            JSON.stringify(entry.completedLessonIds || []),
            JSON.stringify(entry.quizScores || {}),
            entry.currentLessonId ?? null,
            entry.startedAt,
            entry.lastAccessedAt
          )
      );

      await this.db.batch(statements);
      return;
    }
  }

  async remove(key: string): Promise<void> {
    if (key === STORAGE_KEYS.LESSONS) {
      await this.db.prepare('DELETE FROM lessons').run();
      return;
    }

    if (key === STORAGE_KEYS.COURSE_PROGRESS) {
      await this.db.prepare('DELETE FROM user_progress').run();
    }
  }

  async has(key: string): Promise<boolean> {
    if (key === STORAGE_KEYS.LESSONS) {
      const { results } = await this.db
        .prepare('SELECT 1 as found FROM lessons LIMIT 1')
        .all<{ found: number }>();
      return results.length > 0;
    }

    if (key === STORAGE_KEYS.COURSE_PROGRESS) {
      const { results } = await this.db
        .prepare('SELECT 1 as found FROM user_progress LIMIT 1')
        .all<{ found: number }>();
      return results.length > 0;
    }

    return false;
  }

  async clear(): Promise<void> {
    await this.db.prepare('DELETE FROM lessons').run();
    await this.db.prepare('DELETE FROM user_progress').run();
  }
}

export function createD1Adapter(db: D1Database): D1Adapter {
  return new D1Adapter(db);
}
