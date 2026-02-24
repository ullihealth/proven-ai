/**
 * Courses Store — D1-backed with in-memory cache
 *
 * loadCourses() fetches from D1 API and populates cache.
 * getCourses() is synchronous and returns cached data.
 * saveCourse() / deleteCourse() call the API and update cache.
 *
 * Visual presets are also D1-backed via app_visual_config.
 */
import type { Course, CourseVisualSettings, VisualPreset, LearningPath } from './types';
import { defaultVisualSettings } from './types';
import { fetchCourses, createCourseApi, updateCourseApi, deleteCourseApi } from './coursesApi';

const PRESETS_CONFIG_KEY = 'course_visual_presets';

// ========== SEED DATA (used as fallback until D1 loads) ==========

const sampleCourses: Course[] = [
  {
    id: 'ai-foundations',
    slug: 'ai-foundations',
    title: 'AI Foundations',
    description: 'A comprehensive introduction to AI concepts and tools for beginners.',
    estimatedTime: '1 hour',
    courseType: 'deep',
    lifecycleState: 'current',
    capabilityTags: ['Fundamentals', 'Concepts', 'Getting Started'],
    lastUpdated: 'January 25, 2026',
    href: '/learn/courses/ai-foundations',
    releaseDate: '2025-07-01',
    sections: [
      { id: 'intro', title: 'Introduction', anchor: 'intro' },
      { id: 'what-is-ai', title: 'What is AI?', anchor: 'what-is-ai' },
      { id: 'how-llms-work', title: 'How LLMs Work', anchor: 'how-llms-work' },
      { id: 'practical-uses', title: 'Practical Uses', anchor: 'practical-uses' },
    ],
    toolsUsed: ['chatgpt', 'claude'],
  },
  {
    id: 'mastering-chatgpt',
    slug: 'mastering-chatgpt',
    title: 'Mastering AI Prompts: Professional Skills for Real-World Results',
    description: 'Why most prompts produce average results — and the professional techniques that fix it.',
    estimatedTime: '90 min',
    courseType: 'deep',
    lifecycleState: 'current',
    capabilityTags: ['ChatGPT', 'Prompting', 'Productivity'],
    lastUpdated: 'January 20, 2026',
    href: '/learn/courses/mastering-chatgpt',
    releaseDate: '2025-10-15',
    toolsUsed: ['chatgpt'],
  },
  {
    id: 'ai-email',
    slug: 'ai-email',
    title: 'AI for Email & Communication',
    description: 'Practical course on using AI to write better emails, messages, and professional communications.',
    estimatedTime: '45 min',
    courseType: 'short',
    lifecycleState: 'current',
    capabilityTags: ['Email', 'Writing', 'Communication'],
    lastUpdated: 'January 15, 2026',
    href: '/learn/courses/ai-email',
    releaseDate: '2025-12-01',
    toolsUsed: ['chatgpt', 'claude'],
  },
  {
    id: 'ai-safety',
    slug: 'ai-safety',
    title: 'Understanding AI Safety & Ethics',
    description: 'What you need to know about using AI responsibly and safely in personal and professional contexts.',
    estimatedTime: '30 min',
    courseType: 'reference',
    lifecycleState: 'current',
    capabilityTags: ['Safety', 'Ethics', 'Privacy'],
    lastUpdated: 'January 10, 2026',
    href: '/learn/courses/ai-safety',
    releaseDate: '2025-06-01',
  },
  {
    id: 'prompt-engineering-basics',
    slug: 'prompt-engineering-basics',
    title: 'Prompt Engineering Basics',
    description: 'Learn the fundamentals of writing effective prompts that get better AI responses.',
    estimatedTime: '60 min',
    courseType: 'short',
    lifecycleState: 'reference',
    capabilityTags: ['Prompting', 'Fundamentals'],
    lastUpdated: 'December 15, 2025',
    href: '/learn/courses/prompt-engineering-basics',
    releaseDate: '2025-05-01',
  },
  {
    id: 'gpt-3-to-4-migration',
    slug: 'gpt-3-to-4-migration',
    title: 'GPT-3 to GPT-4 Migration Guide',
    description: 'Historical reference for users transitioning from GPT-3 to GPT-4 capabilities.',
    estimatedTime: '20 min',
    courseType: 'reference',
    lifecycleState: 'legacy',
    capabilityTags: ['ChatGPT', 'Migration'],
    lastUpdated: 'March 1, 2024',
    href: '/learn/courses/gpt-3-to-4-migration',
    releaseDate: '2024-03-01',
  },
];

// ========== IN-MEMORY CACHE ==========

let coursesCache: Course[] = [...sampleCourses];
let cacheLoaded = false;

/**
 * Load courses from D1 API into the in-memory cache.
 * Safe to call multiple times — only fetches once unless forced.
 */
export async function loadCourses(force = false): Promise<void> {
  if (cacheLoaded && !force) return;
  try {
    const courses = await fetchCourses();
    if (courses.length > 0) {
      coursesCache = courses;
    }
    // If D1 returned empty, keep seed data as fallback
    cacheLoaded = true;
  } catch (err) {
    console.warn('Failed to load courses from API, using cached data:', err);
    // Keep existing cache (seed data or previous load)
  }
}

// ========== COURSES CRUD ==========

/** Get all courses (synchronous, returns cached data) */
export const getCourses = (): Course[] => {
  return coursesCache;
};

/** Get a specific course by ID */
export const getCourseById = (id: string): Course | undefined => {
  return coursesCache.find(c => c.id === id);
};

/** Get a specific course by slug */
export const getCourseBySlug = (slug: string): Course | undefined => {
  return coursesCache.find(c => c.slug === slug);
};

/**
 * Save (create or update) a course — persists to D1 via API.
 * Also updates the in-memory cache immediately.
 */
export const saveCourse = async (course: Course): Promise<void> => {
  const existingIndex = coursesCache.findIndex(c => c.id === course.id);

  if (existingIndex >= 0) {
    // Update existing
    await updateCourseApi(course);
    coursesCache[existingIndex] = course;
  } else {
    // Create new
    await createCourseApi(course);
    coursesCache.push(course);
  }
};

/**
 * Delete a course — removes from D1 via API.
 * Also updates the in-memory cache immediately.
 */
export const deleteCourse = async (id: string): Promise<void> => {
  await deleteCourseApi(id);
  coursesCache = coursesCache.filter(c => c.id !== id);
  // Visual settings were part of the course object — already removed from cache
};

/** Sort courses by lifecycle state */
export const sortCoursesByLifecycle = (coursesToSort: Course[]): Course[] => {
  const order = { current: 0, reference: 1, legacy: 2 };
  return [...coursesToSort].sort((a, b) => order[a.lifecycleState] - order[b.lifecycleState]);
};

// ========== VISUAL SETTINGS (stored in D1 as part of course) ==========

export const getAllVisualSettings = (): Record<string, CourseVisualSettings> => {
  const result: Record<string, CourseVisualSettings> = {};
  for (const course of coursesCache) {
    if (course.visualSettings) {
      result[course.id] = course.visualSettings;
    }
  }
  return result;
};

export const getCourseVisualSettings = (courseId: string): CourseVisualSettings => {
  const course = coursesCache.find(c => c.id === courseId);
  return course?.visualSettings || { ...defaultVisualSettings };
};

export const saveCourseVisualSettings = async (
  courseId: string,
  settings: Partial<CourseVisualSettings>
): Promise<void> => {
  const course = coursesCache.find(c => c.id === courseId);
  if (!course) return;
  const merged: CourseVisualSettings = {
    ...defaultVisualSettings,
    ...course.visualSettings,
    ...settings,
  };
  const updated = { ...course, visualSettings: merged };
  await saveCourse(updated);
};

export const resetCourseVisualSettings = async (courseId: string): Promise<void> => {
  const course = coursesCache.find(c => c.id === courseId);
  if (!course) return;
  const updated = { ...course, visualSettings: undefined };
  // Update cache immediately; skip API if this is called during deleteCourse
  const idx = coursesCache.findIndex(c => c.id === courseId);
  if (idx >= 0) coursesCache[idx] = updated;
};

export const applySettingsToAllCourses = async (
  courseIds: string[],
  settings: CourseVisualSettings
): Promise<void> => {
  for (const id of courseIds) {
    const course = coursesCache.find(c => c.id === id);
    if (course) {
      const updated = { ...course, visualSettings: { ...settings } };
      await saveCourse(updated);
    }
  }
};

export const getCoursesWithVisualSettings = <T extends { id: string; visualSettings?: CourseVisualSettings }>(
  courses: T[]
): T[] => {
  return courses.map(course => {
    // Visual settings already on the course object from D1
    return {
      ...course,
      visualSettings: {
        ...defaultVisualSettings,
        ...course.visualSettings,
      },
    };
  });
};

// ========== PRESETS (D1-backed via app_visual_config) ==========

let presetsCache: VisualPreset[] = [];
let presetsCacheLoaded = false;

/** Load presets from D1 — call once on app init */
export async function loadCoursePresets(): Promise<void> {
  if (presetsCacheLoaded) return;
  try {
    const res = await fetch(`/api/visual-config?key=${PRESETS_CONFIG_KEY}`);
    if (res.ok) {
      const json = (await res.json()) as { ok: boolean; value: VisualPreset[] | null };
      if (json.ok && Array.isArray(json.value)) presetsCache = json.value;
    }
  } catch (err) {
    console.error('[coursePresets] load failed:', err);
  }
  presetsCacheLoaded = true;
}

export const getAllPresets = (): VisualPreset[] => {
  return presetsCache;
};

export const savePreset = async (name: string, settings: CourseVisualSettings): Promise<VisualPreset> => {
  const newPreset: VisualPreset = {
    id: `preset-${Date.now()}`,
    name,
    settings: { ...settings },
    createdAt: new Date().toISOString(),
  };
  presetsCache = [...presetsCache, newPreset];
  await _persistCoursePresets();
  return newPreset;
};

export const deletePreset = async (presetId: string): Promise<void> => {
  presetsCache = presetsCache.filter(p => p.id !== presetId);
  await _persistCoursePresets();
};

export const getPresetById = (presetId: string): VisualPreset | undefined => {
  return presetsCache.find(p => p.id === presetId);
};

async function _persistCoursePresets(): Promise<void> {
  try {
    const res = await fetch('/api/admin/visual-config', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: PRESETS_CONFIG_KEY, value: presetsCache }),
    });
    if (!res.ok) console.error('[coursePresets] save rejected:', res.status);
  } catch (err) {
    console.error('[coursePresets] save failed:', err);
  }
}

// ========== LEARNING PATHS (moved to learningPathStore.ts — D1-backed) ==========
// Re-export for backwards compatibility
export { getLearningPaths as getLearningPathsLegacy, getCoursesForLearningPath as getCoursesForPath } from './learningPathStore';
