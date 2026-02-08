// Progress Store - User progress tracking for courses and lessons
import type { CourseProgress, QuizAttempt, Lesson } from './lessonTypes';
import { getLessonsByCourse } from './lessonStore';

const PROGRESS_STORAGE_KEY = 'provenai-course-progress';

// Get current user ID (mock - will be replaced with auth)
function getCurrentUserId(): string {
  // For now, use a mock user ID
  // This will be replaced with actual auth user ID
  return 'current-user';
}

// Get all progress records from localStorage
function getAllProgress(): CourseProgress[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save all progress to localStorage
function saveProgress(progressRecords: CourseProgress[]): void {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressRecords));
}

// Get progress for a specific course and user
export function getCourseProgress(courseId: string): CourseProgress | undefined {
  const userId = getCurrentUserId();
  return getAllProgress().find(
    (p) => p.courseId === courseId && p.userId === userId
  );
}

// Initialize or get progress for a course
export function getOrCreateProgress(courseId: string): CourseProgress {
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

  const allProgress = getAllProgress();
  allProgress.push(newProgress);
  saveProgress(allProgress);

  return newProgress;
}

// Update progress for a course
function updateCourseProgress(
  courseId: string,
  updates: Partial<Omit<CourseProgress, 'userId' | 'courseId' | 'startedAt'>>
): CourseProgress {
  const progress = getOrCreateProgress(courseId);
  const allProgress = getAllProgress();
  const index = allProgress.findIndex(
    (p) => p.courseId === courseId && p.userId === progress.userId
  );

  const updatedProgress = {
    ...progress,
    ...updates,
    lastAccessedAt: new Date().toISOString(),
  };

  if (index !== -1) {
    allProgress[index] = updatedProgress;
  } else {
    allProgress.push(updatedProgress);
  }

  saveProgress(allProgress);
  return updatedProgress;
}

// Mark a lesson as completed
export function completeLesson(courseId: string, lessonId: string): CourseProgress {
  const progress = getOrCreateProgress(courseId);
  
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

// Mark a lesson as incomplete (uncomplete)
export function uncompleteLesson(courseId: string, lessonId: string): CourseProgress {
  const progress = getOrCreateProgress(courseId);
  
  return updateCourseProgress(courseId, {
    completedLessonIds: progress.completedLessonIds.filter((id) => id !== lessonId),
  });
}

// Record a quiz attempt
export function recordQuizAttempt(
  courseId: string,
  lessonId: string,
  score: number,
  passed: boolean,
  answers: number[]
): CourseProgress {
  const progress = getOrCreateProgress(courseId);

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

// Check if a lesson is accessible (not locked)
export function isLessonAccessible(courseId: string, lessonId: string): boolean {
  const progress = getOrCreateProgress(courseId);
  const lessons = getLessonsByCourse(courseId);
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  
  const lessonIndex = sortedLessons.findIndex((l) => l.id === lessonId);
  
  // First lesson is always accessible
  if (lessonIndex === 0) return true;
  
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

// Check if a lesson can be marked as complete
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

// Calculate course completion percentage
export function getCourseCompletionPercent(courseId: string): number {
  const progress = getCourseProgress(courseId);
  if (!progress) return 0;

  const lessons = getLessonsByCourse(courseId);
  if (lessons.length === 0) return 0;

  return Math.round((progress.completedLessonIds.length / lessons.length) * 100);
}

// Get the next available lesson (first uncompleted accessible lesson)
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

// Reset course progress (for testing or user request)
export function resetCourseProgress(courseId: string): void {
  const userId = getCurrentUserId();
  const allProgress = getAllProgress();
  const filtered = allProgress.filter(
    (p) => !(p.courseId === courseId && p.userId === userId)
  );
  saveProgress(filtered);
}

// Get all courses with progress for current user
export function getAllUserProgress(): CourseProgress[] {
  const userId = getCurrentUserId();
  return getAllProgress().filter((p) => p.userId === userId);
}
