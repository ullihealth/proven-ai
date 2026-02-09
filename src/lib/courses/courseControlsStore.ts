import type { CourseControlsSettings } from "./lessonTypes";
import { defaultCourseControlsSettings } from "./lessonTypes";
import { getStorageAdapter, STORAGE_KEYS } from "../storage";

let controlsCache: Record<string, CourseControlsSettings> = {};
let cacheInitialized = false;

async function initCache(): Promise<void> {
  if (cacheInitialized) return;

  const storage = getStorageAdapter();
  const stored = await storage.get<Record<string, CourseControlsSettings>>(
    STORAGE_KEYS.COURSE_CONTROLS
  );
  controlsCache = stored || {};
  cacheInitialized = true;
}

async function persistCache(): Promise<void> {
  const storage = getStorageAdapter();
  await storage.set(STORAGE_KEYS.COURSE_CONTROLS, controlsCache);
}

export async function initCourseControlsStore(): Promise<void> {
  await initCache();
}

export function getCourseControls(courseId: string): CourseControlsSettings {
  return controlsCache[courseId] || defaultCourseControlsSettings;
}

export async function saveCourseControls(
  courseId: string,
  settings: CourseControlsSettings
): Promise<CourseControlsSettings> {
  await initCache();
  controlsCache = {
    ...controlsCache,
    [courseId]: settings,
  };
  await persistCache();
  return settings;
}
