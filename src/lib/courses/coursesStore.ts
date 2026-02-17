/**
 * Courses Store — D1-backed with in-memory cache
 *
 * loadCourses() fetches from D1 API and populates cache.
 * getCourses() is synchronous and returns cached data.
 * saveCourse() / deleteCourse() call the API and update cache.
 *
 * Visual settings & presets remain in localStorage (admin-only cosmetic data).
 */
import type { Course, CourseVisualSettings, VisualPreset, LearningPath } from './types';
import { defaultVisualSettings } from './types';
import { fetchCourses, createCourseApi, updateCourseApi, deleteCourseApi } from './coursesApi';

const STORAGE_KEY = 'courseVisualSettings';
const PRESETS_KEY = 'courseVisualPresets';

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
  // Also remove visual settings for this course
  resetCourseVisualSettings(id);
};

/** Sort courses by lifecycle state */
export const sortCoursesByLifecycle = (coursesToSort: Course[]): Course[] => {
  const order = { current: 0, reference: 1, legacy: 2 };
  return [...coursesToSort].sort((a, b) => order[a.lifecycleState] - order[b.lifecycleState]);
};

// ========== VISUAL SETTINGS (remain in localStorage) ==========

export const getAllVisualSettings = (): Record<string, CourseVisualSettings> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const getCourseVisualSettings = (courseId: string): CourseVisualSettings => {
  const all = getAllVisualSettings();
  return all[courseId] || { ...defaultVisualSettings };
};

export const saveCourseVisualSettings = (
  courseId: string,
  settings: Partial<CourseVisualSettings>
): void => {
  const all = getAllVisualSettings();
  all[courseId] = {
    ...defaultVisualSettings,
    ...all[courseId],
    ...settings,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

export const resetCourseVisualSettings = (courseId: string): void => {
  const all = getAllVisualSettings();
  delete all[courseId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

export const applySettingsToAllCourses = (
  courseIds: string[],
  settings: CourseVisualSettings
): void => {
  const all = getAllVisualSettings();
  courseIds.forEach(id => {
    all[id] = { ...settings };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

export const getCoursesWithVisualSettings = <T extends { id: string; visualSettings?: CourseVisualSettings }>(
  courses: T[]
): T[] => {
  const allSettings = getAllVisualSettings();
  return courses.map(course => ({
    ...course,
    visualSettings: {
      ...defaultVisualSettings,
      ...course.visualSettings,
      ...allSettings[course.id],
    },
  }));
};

// ========== PRESETS (remain in localStorage) ==========

export const getAllPresets = (): VisualPreset[] => {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const savePreset = (name: string, settings: CourseVisualSettings): VisualPreset => {
  const presets = getAllPresets();
  const newPreset: VisualPreset = {
    id: `preset-${Date.now()}`,
    name,
    settings: { ...settings },
    createdAt: new Date().toISOString(),
  };
  presets.push(newPreset);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  return newPreset;
};

export const deletePreset = (presetId: string): void => {
  const presets = getAllPresets().filter(p => p.id !== presetId);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
};

export const getPresetById = (presetId: string): VisualPreset | undefined => {
  return getAllPresets().find(p => p.id === presetId);
};

// ========== LEARNING PATHS (hardcoded definitions) ==========

export const learningPaths: LearningPath[] = [
  {
    id: 'complete-beginner',
    title: 'Complete Beginner',
    description: 'Never used AI before? Start here for a gentle introduction.',
    courseIds: ['ai-foundations', 'ai-safety', 'mastering-chatgpt'],
  },
  {
    id: 'productivity-boost',
    title: 'Productivity Boost',
    description: 'Already using AI? Level up your daily workflows.',
    courseIds: ['mastering-chatgpt', 'ai-email', 'prompt-engineering-basics'],
  },
  {
    id: 'professional-communicator',
    title: 'Professional Communicator',
    description: 'Focus on AI-assisted writing and communication.',
    courseIds: ['ai-email', 'prompt-engineering-basics'],
  },
  {
    id: 'responsible-ai-user',
    title: 'Responsible AI User',
    description: 'Understand the ethical and safety considerations.',
    courseIds: ['ai-safety', 'ai-foundations'],
  },
];

export const getCoursesForPath = (pathId: string): Course[] => {
  const path = learningPaths.find(p => p.id === pathId);
  if (!path) return [];
  return path.courseIds
    .map(id => getCourseById(id))
    .filter((course): course is Course => course !== undefined);
};
