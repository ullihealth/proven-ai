/**
 * Lesson API Client — HTTP calls to /api/lessons and /api/admin/lessons
 *
 * Used by lessonStore.ts to persist lessons & modules in Cloudflare D1
 * instead of localStorage.
 */

import type { Lesson, Module, ContentBlock, Quiz, QuizQuestion } from './lessonTypes';

// ─── Helpers ────────────────────────────────────────────────

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API GET ${url} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API POST ${url} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API PUT ${url} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API PATCH ${url} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiDelete(url: string): Promise<void> {
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API DELETE ${url} failed (${res.status}): ${text}`);
  }
}

// ─── Lessons ────────────────────────────────────────────────

export async function fetchLessons(courseId: string): Promise<Lesson[]> {
  const data = await apiGet<{ ok: boolean; lessons: Lesson[] }>(
    `/api/lessons?courseId=${encodeURIComponent(courseId)}`
  );
  return data.lessons || [];
}

export async function fetchLessonsAdmin(courseId: string): Promise<Lesson[]> {
  const data = await apiGet<{ ok: boolean; lessons: Lesson[] }>(
    `/api/admin/lessons?courseId=${encodeURIComponent(courseId)}`
  );
  return data.lessons || [];
}

export async function createLessonApi(
  courseId: string,
  title: string,
  moduleId?: string,
  chapterTitle?: string
): Promise<Lesson> {
  const data = await apiPost<{ ok: boolean; lesson: Lesson }>(
    '/api/admin/lessons',
    { courseId, title, moduleId, chapterTitle }
  );
  return data.lesson;
}

export async function updateLessonApi(
  id: string,
  updates: {
    title?: string;
    moduleId?: string | null;
    order?: number;
    contentBlocks?: ContentBlock[];
    quiz?: Quiz | null;
    chapterTitle?: string | null;
    streamVideoId?: string | null;
  }
): Promise<void> {
  await apiPut('/api/admin/lessons', { id, ...updates });
}

export async function deleteLessonApi(id: string): Promise<void> {
  await apiDelete(`/api/admin/lessons?id=${encodeURIComponent(id)}`);
}

export async function reorderLessonsApi(lessonIds: string[]): Promise<void> {
  await apiPatch('/api/admin/lessons', {
    action: 'reorder',
    lessonIds,
  });
}

export async function bulkUpdateLessonsApi(
  lessons: Array<{
    id: string;
    contentBlocks?: ContentBlock[];
    quiz?: Quiz | null;
    title?: string;
    order?: number;
    moduleId?: string | null;
    streamVideoId?: string | null;
  }>
): Promise<void> {
  await apiPatch('/api/admin/lessons', {
    action: 'bulkUpdate',
    lessons,
  });
}

// ─── Modules ────────────────────────────────────────────────

export async function fetchModules(courseId: string): Promise<Module[]> {
  const data = await apiGet<{ ok: boolean; modules: Module[] }>(
    `/api/modules?courseId=${encodeURIComponent(courseId)}`
  );
  return data.modules || [];
}

export async function fetchModulesAdmin(courseId: string): Promise<Module[]> {
  const data = await apiGet<{ ok: boolean; modules: Module[] }>(
    `/api/admin/modules?courseId=${encodeURIComponent(courseId)}`
  );
  return data.modules || [];
}

export async function createModuleApi(
  courseId: string,
  title: string
): Promise<Module> {
  const data = await apiPost<{ ok: boolean; module: Module }>(
    '/api/admin/modules',
    { courseId, title }
  );
  return data.module;
}

export async function updateModuleApi(
  id: string,
  updates: { title?: string; order?: number }
): Promise<void> {
  await apiPut('/api/admin/modules', { id, ...updates });
}

export async function deleteModuleApi(id: string): Promise<void> {
  await apiDelete(`/api/admin/modules?id=${encodeURIComponent(id)}`);
}

export async function reorderModulesApi(moduleIds: string[]): Promise<void> {
  await apiPatch('/api/admin/modules', { moduleIds });
}
