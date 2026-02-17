// Courses Store - localStorage persistence for courses and visual settings
import type { Course, CourseVisualSettings, VisualPreset, CourseType, LifecycleState } from './types';
import { defaultVisualSettings } from './types';

const STORAGE_KEY = 'courseVisualSettings';
const PRESETS_KEY = 'courseVisualPresets';
const COURSES_KEY = 'provenai_courses';

// ========== SAMPLE DATA FOR INITIALIZATION ==========

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
    releaseDate: '2025-07-01', // 7+ months old - included
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
    releaseDate: '2025-10-15', // 3-6 months old - $247
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
    releaseDate: '2025-12-01', // <3 months old - $497
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
    releaseDate: '2025-06-01', // 8+ months old - included
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
    releaseDate: '2025-05-01', // 9+ months old - included
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
    releaseDate: '2024-03-01', // Very old - included
  },
];

// ========== COURSES CRUD ==========

// Initialize storage with sample data if empty
function initializeCourses(): void {
  if (!localStorage.getItem(COURSES_KEY)) {
    localStorage.setItem(COURSES_KEY, JSON.stringify(sampleCourses));
  }
}

// Get all courses
export const getCourses = (): Course[] => {
  initializeCourses();
  try {
    const stored = localStorage.getItem(COURSES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Get a specific course by ID
export const getCourseById = (id: string): Course | undefined => {
  return getCourses().find(c => c.id === id);
};

// Get a specific course by slug
export const getCourseBySlug = (slug: string): Course | undefined => {
  return getCourses().find(c => c.slug === slug);
};

// Save (create or update) a course
export const saveCourse = (course: Course): void => {
  const courses = getCourses();
  const existingIndex = courses.findIndex(c => c.id === course.id);
  
  if (existingIndex >= 0) {
    courses[existingIndex] = course;
  } else {
    courses.push(course);
  }
  
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
};

// Delete a course
export const deleteCourse = (id: string): void => {
  const courses = getCourses().filter(c => c.id !== id);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  
  // Also remove visual settings for this course
  resetCourseVisualSettings(id);
};

// Sort courses by lifecycle state
export const sortCoursesByLifecycle = (coursesToSort: Course[]): Course[] => {
  const order = { current: 0, reference: 1, legacy: 2 };
  return [...coursesToSort].sort((a, b) => order[a.lifecycleState] - order[b.lifecycleState]);
};

// ========== VISUAL SETTINGS ==========

// Get all visual settings from storage
export const getAllVisualSettings = (): Record<string, CourseVisualSettings> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Get visual settings for a specific course
export const getCourseVisualSettings = (courseId: string): CourseVisualSettings => {
  const all = getAllVisualSettings();
  return all[courseId] || { ...defaultVisualSettings };
};

// Save visual settings for a specific course
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

// Delete visual settings for a course (reset to defaults)
export const resetCourseVisualSettings = (courseId: string): void => {
  const all = getAllVisualSettings();
  delete all[courseId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

// Apply settings to ALL courses
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

// Get courses with visual settings applied (merges stored settings with course data)
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

// ========== PRESETS ==========

// Get all saved presets
export const getAllPresets = (): VisualPreset[] => {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save a new preset
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

// Delete a preset
export const deletePreset = (presetId: string): void => {
  const presets = getAllPresets().filter(p => p.id !== presetId);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
};

// Get a specific preset by ID
export const getPresetById = (presetId: string): VisualPreset | undefined => {
  return getAllPresets().find(p => p.id === presetId);
};

// ========== LEARNING PATHS ==========

import type { LearningPath } from './types';

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

// Helper to get courses for a path
export const getCoursesForPath = (pathId: string): Course[] => {
  const path = learningPaths.find(p => p.id === pathId);
  if (!path) return [];
  return path.courseIds
    .map(id => getCourseById(id))
    .filter((course): course is Course => course !== undefined);
};
