// Progress Store - User progress tracking for courses and lessons
// Uses storage adapter for persistence abstraction

import type { CourseProgress, QuizAttempt, Lesson } from './lessonTypes';
import { getLessonsByCourse } from './lessonStore';
import { getStorageAdapter, STORAGE_KEYS } from '../storage';
import { authAPI } from '../auth/api';

// In-memory cache for synchronous access
let progressCache: CourseProgress[] = [];
let cacheInitialized = false;

/**
 * Get current user ID (mock - will be replaced with BetterAuth)
 */
function getCurrentUserId(): string {
  return authAPI.getCurrentUserId() ?? 'guest';
}

/**
 * Initialize the cache from storage
 */
async function initCache(): Promise<void> {
  if (cacheInitialized) return;
  
  const storage = getStorageAdapter();
  const stored = await storage.get<CourseProgress[]>(STORAGE_KEYS.COURSE_PROGRESS);
  progressCache = stored || [];
  cacheInitialized = true;
}

/**
 * Sync cache to storage
 */
async function persistCache(): Promise<void> {
  const storage = getStorageAdapter();
  await storage.set(STORAGE_KEYS.COURSE_PROGRESS, progressCache);
}

/**
 * Initialize the progress store - call on app startup
 */
export async function initProgressStore(): Promise<void> {
  await initCache();
}

/**
 * Get all progress records (for sync compatibility)
 */
function getAllProgress(): CourseProgress[] {
  return progressCache;
}

/**
 * Get progress for a specific course and user
 */
export function getCourseProgress(courseId: string): CourseProgress | undefined {
  const userId = getCurrentUserId();
  return getAllProgress().find(
    (p) => p.courseId === courseId && p.userId === userId
  );
}

/**
 * Initialize or get progress for a course
 */
export async function getOrCreateProgress(courseId: string): Promise<CourseProgress> {
  await initCache();
  
  const existing = getCourseProgress(courseId);
  if (existing) return existing;

  const userId = getCurrentUserId();
  const lessons = getLessonsByCourse(courseId);
  const now = new Date().toISOString();

  const newProgress: CourseProgress = {
    userId,
    courseId,
    completedLessonIds: [],
    quizScores: {},
    currentLessonId: lessons[0]?.id,
    startedAt: now,
    lastAccessedAt: now,
  };

  progressCache.push(newProgress);
  await persistCache();

  return newProgress;
}

/**
 * Update progress for a course
 */
async function updateCourseProgress(
  courseId: string,
  updates: Partial<Omit<CourseProgress, 'userId' | 'courseId' | 'startedAt'>>
): Promise<CourseProgress> {
  const progress = await getOrCreateProgress(courseId);
  
  const index = progressCache.findIndex(
    (p) => p.courseId === courseId && p.userId === progress.userId
  );

  const updatedProgress = {
    ...progress,
    ...updates,
    lastAccessedAt: new Date().toISOString(),
  };

  if (index !== -1) {
    progressCache[index] = updatedProgress;
  } else {
    progressCache.push(updatedProgress);
  }

  await persistCache();
  return updatedProgress;
}

/**
 * Mark a lesson as completed
 */
export async function completeLesson(courseId: string, lessonId: string): Promise<CourseProgress> {
  const progress = await getOrCreateProgress(courseId);
  
  if (progress.completedLessonIds.includes(lessonId)) {
    return progress; // Already completed
  }

  const lessons = getLessonsByCourse(courseId);
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const nextLesson = lessons[currentIndex + 1];

  return updateCourseProgress(courseId, {
    completedLessonIds: [...progress.completedLessonIds, lessonId],
    currentLessonId: nextLesson?.id || lessonId,
  });
}

/**
 * Mark a lesson as incomplete (uncomplete)
 */
export async function uncompleteLesson(courseId: string, lessonId: string): Promise<CourseProgress> {
  const progress = await getOrCreateProgress(courseId);
  
  return updateCourseProgress(courseId, {
    completedLessonIds: progress.completedLessonIds.filter((id) => id !== lessonId),
  });
}

/**
 * Record a quiz attempt
 */
export async function recordQuizAttempt(
  courseId: string,
  lessonId: string,
  score: number,
  passed: boolean,
  answers: number[]
): Promise<CourseProgress> {
  const progress = await getOrCreateProgress(courseId);

  const attempt: QuizAttempt = {
    lessonId,
    score,
    passed,
    attemptedAt: new Date().toISOString(),
    answers,
  };

  return updateCourseProgress(courseId, {
    quizScores: {
      ...progress.quizScores,
      [lessonId]: attempt,
    },
  });
}

/**
 * Check if a lesson is accessible (not locked)
 */
export function isLessonAccessible(courseId: string, lessonId: string): boolean {
  const progress = getCourseProgress(courseId);
  const lessons = getLessonsByCourse(courseId);
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  
  const lessonIndex = sortedLessons.findIndex((l) => l.id === lessonId);
  
  // First lesson is always accessible
  if (lessonIndex === 0) return true;
  
  // No progress yet - only first lesson accessible
  if (!progress) return lessonIndex === 0;
  
  // Check if previous lesson is completed
  const previousLesson = sortedLessons[lessonIndex - 1];
  if (!previousLesson) return true;

  // Previous lesson must be completed
  if (!progress.completedLessonIds.includes(previousLesson.id)) {
    return false;
  }

  // If previous lesson has a quiz, check if passed
  if (previousLesson.quiz) {
    const quizAttempt = progress.quizScores[previousLesson.id];
    if (!quizAttempt || !quizAttempt.passed) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a lesson can be marked as complete
 */
export function canCompleteLesson(lesson: Lesson, courseId: string): boolean {
  // If lesson has a quiz, must have passed it
  if (lesson.quiz) {
    const progress = getCourseProgress(courseId);
    const quizAttempt = progress?.quizScores[lesson.id];
    return quizAttempt?.passed === true;
  }
  
  // No quiz, can always complete
  return true;
}

/**
 * Calculate course completion percentage
 */
export function getCourseCompletionPercent(courseId: string): number {
  const progress = getCourseProgress(courseId);
  if (!progress) return 0;

  const lessons = getLessonsByCourse(courseId);
  if (lessons.length === 0) return 0;

  return Math.round((progress.completedLessonIds.length / lessons.length) * 100);
}

/**
 * Get the next available lesson (first uncompleted accessible lesson)
 */
export function getNextAvailableLesson(courseId: string): Lesson | undefined {
  const progress = getCourseProgress(courseId);
  const lessons = getLessonsByCourse(courseId);
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  for (const lesson of sortedLessons) {
    if (!progress?.completedLessonIds.includes(lesson.id)) {
      if (isLessonAccessible(courseId, lesson.id)) {
        return lesson;
      }
    }
  }

  // All lessons completed, return last lesson
  return sortedLessons[sortedLessons.length - 1];
}

/**
 * Reset course progress (for testing or user request)
 */
export async function resetCourseProgress(courseId: string): Promise<void> {
  await initCache();
  
  const userId = getCurrentUserId();
  progressCache = progressCache.filter(
    (p) => !(p.courseId === courseId && p.userId === userId)
  );
  
  await persistCache();
}

/**
 * Get all courses with progress for current user
 */
export function getAllUserProgress(): CourseProgress[] {
  const userId = getCurrentUserId();
  return getAllProgress().filter((p) => p.userId === userId);
}
