// Learning Path CRUD Store — D1-backed with in-memory cache
import type { LearningPath } from './types';
import { getCourseById } from './coursesStore';
import type { Course } from './types';

// Extended type with defaultOpen
export interface LearningPathWithSettings extends LearningPath {
  defaultOpen?: boolean;
}

// Sample data for initialization (fallback until D1 loads)
const defaultLearningPaths: LearningPathWithSettings[] = [
  {
    id: 'complete-beginner',
    title: 'Complete Beginner',
    description: 'Never used AI before? Start here for a gentle introduction.',
    courseIds: ['ai-foundations', 'ai-safety', 'mastering-chatgpt'],
    defaultOpen: true,
  },
  {
    id: 'productivity-boost',
    title: 'Productivity Boost',
    description: 'Already using AI? Level up your daily workflows.',
    courseIds: ['mastering-chatgpt', 'ai-email', 'prompt-engineering-basics'],
    defaultOpen: false,
  },
  {
    id: 'professional-communicator',
    title: 'Professional Communicator',
    description: 'Focus on AI-assisted writing and communication.',
    courseIds: ['ai-email', 'prompt-engineering-basics'],
    defaultOpen: false,
  },
  {
    id: 'responsible-ai-user',
    title: 'Responsible AI User',
    description: 'Understand the ethical and safety considerations.',
    courseIds: ['ai-safety', 'ai-foundations'],
    defaultOpen: false,
  },
];

// ========== IN-MEMORY CACHE ==========

let pathsCache: LearningPathWithSettings[] = [...defaultLearningPaths];
let pathsCacheLoaded = false;

/** Load learning paths from D1 API */
export async function loadLearningPaths(force = false): Promise<void> {
  if (pathsCacheLoaded && !force) return;
  try {
    const res = await fetch('/api/learning-paths', { credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json() as { ok: boolean; paths: LearningPathWithSettings[] };
    if (data.paths && data.paths.length > 0) {
      pathsCache = data.paths;
    }
    pathsCacheLoaded = true;
  } catch (err) {
    console.warn('Failed to load learning paths from API, using defaults:', err);
  }
}

// ========== CRUD ==========

export function getLearningPaths(): LearningPathWithSettings[] {
  return pathsCache;
}

export function getLearningPathById(id: string): LearningPathWithSettings | undefined {
  return pathsCache.find(p => p.id === id);
}

export async function saveLearningPath(path: LearningPathWithSettings): Promise<void> {
  const existingIndex = pathsCache.findIndex(p => p.id === path.id);
  const body = { ...path };

  if (existingIndex >= 0) {
    const res = await fetch('/api/admin/learning-paths', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    pathsCache[existingIndex] = path;
  } else {
    const res = await fetch('/api/admin/learning-paths', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Create failed: ${res.status}`);
    pathsCache.push(path);
  }
}

export async function deleteLearningPath(id: string): Promise<void> {
  const res = await fetch(`/api/admin/learning-paths?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  pathsCache = pathsCache.filter(p => p.id !== id);
}

export async function reorderLearningPaths(orderedIds: string[]): Promise<void> {
  const res = await fetch('/api/admin/learning-paths', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error(`Reorder failed: ${res.status}`);

  const reordered = orderedIds
    .map(id => pathsCache.find(p => p.id === id))
    .filter((p): p is LearningPathWithSettings => p !== undefined);
  pathsCache.forEach(p => {
    if (!orderedIds.includes(p.id)) reordered.push(p);
  });
  pathsCache = reordered;
}

// Get courses for a learning path
export function getCoursesForLearningPath(pathId: string): Course[] {
  const path = getLearningPathById(pathId);
  if (!path) return [];
  return path.courseIds
    .map(id => getCourseById(id))
    .filter((course): course is Course => course !== undefined);
}
