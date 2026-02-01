// Courses Store - localStorage persistence for course visual settings
import type { CourseVisualSettings, VisualPreset } from './types';
import { defaultVisualSettings } from './types';

const STORAGE_KEY = 'courseVisualSettings';
const PRESETS_KEY = 'courseVisualPresets';

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
