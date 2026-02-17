/**
 * Courses API Client — HTTP calls to /api/courses and /api/admin/courses
 *
 * Used by coursesStore.ts to persist course metadata in Cloudflare D1
 * instead of localStorage.
 */

import type { Course } from './types';

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

async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API DELETE ${url} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Course API Calls ───────────────────────────────────────

/** Fetch all courses from D1 (public, no auth required) */
export async function fetchCourses(): Promise<Course[]> {
  const data = await apiGet<{ ok: boolean; courses: Course[] }>('/api/courses');
  return data.courses || [];
}

/** Create a new course (admin only) */
export async function createCourseApi(course: Partial<Course>): Promise<string> {
  const data = await apiPost<{ ok: boolean; id: string }>('/api/admin/courses', course);
  return data.id;
}

/** Update an existing course (admin only) */
export async function updateCourseApi(course: Course): Promise<void> {
  await apiPut<{ ok: boolean }>('/api/admin/courses', course);
}

/** Delete a course (admin only) */
export async function deleteCourseApi(id: string): Promise<void> {
  await apiDelete<{ ok: boolean }>(`/api/admin/courses?id=${encodeURIComponent(id)}`);
}

/** Reorder courses (admin only) */
export async function reorderCoursesApi(orderedIds: string[]): Promise<void> {
  const res = await fetch('/api/admin/courses', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reorder failed (${res.status}): ${text}`);
  }
}
