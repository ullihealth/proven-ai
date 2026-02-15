// Lesson System Types for ProvenAI Course Platform

// Content block types for rich lesson content
export type ContentBlockType = 'video' | 'text' | 'image' | 'pdf' | 'audio' | 'quiz';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string; // URL for video/image/pdf, markdown for text, JSON for quiz
  order: number;
  title?: string; // Optional title for the block
  altText?: string; // Optional alt text for images
  displayWidth?: number; // Percent width for media blocks (40-100)
}

// Module — a named group of content blocks within a lesson
export interface Module {
  id: string;
  title: string;
  order: number;
  contentBlocks: ContentBlock[];
}

// Quiz question with multiple choice options
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

// Quiz attached to a lesson
export interface Quiz {
  id: string;
  lessonId: string;
  title?: string; // Quiz identity/name
  questions: QuizQuestion[];
  passThreshold: number; // 0-100 percentage required to pass
}

// Data stored in a quiz content block's content field (JSON stringified)
export interface QuizBlockData {
  title: string;
  questions: QuizQuestion[];
  passThreshold: number;
}

// Individual lesson within a course
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  modules: Module[];
  /** @deprecated — use modules[].contentBlocks. Kept for migration compatibility. */
  contentBlocks: ContentBlock[];
  quiz?: Quiz;
  chapterTitle?: string; // Optional grouping for sidebar display
  streamVideoId?: string; // Optional Cloudflare Stream video ID
}

/**
 * Migrate a lesson from flat contentBlocks to modules.
 * If modules already exist, returns as-is.
 * If only flat contentBlocks exist, wraps them in a single default module.
 */
export function ensureLessonModules(lesson: Lesson): Lesson {
  if (lesson.modules && lesson.modules.length > 0) return lesson;
  // Wrap legacy flat blocks into a default module
  const blocks = lesson.contentBlocks || [];
  const defaultModule: Module = {
    id: `mod-${lesson.id}-default`,
    title: 'Content',
    order: 1,
    contentBlocks: blocks,
  };
  return { ...lesson, modules: [defaultModule] };
}

/**
 * Flatten all modules' content blocks into a single ordered array
 * (used by renderers that paginate block-by-block).
 */
export function flattenModuleBlocks(lesson: Lesson): ContentBlock[] {
  const migrated = ensureLessonModules(lesson);
  return migrated.modules
    .sort((a, b) => a.order - b.order)
    .flatMap((mod) =>
      [...mod.contentBlocks].sort((a, b) => a.order - b.order)
    );
}

// User's quiz attempt result
export interface QuizAttempt {
  lessonId: string;
  score: number; // 0-100
  passed: boolean;
  attemptedAt: string; // ISO date
  answers: number[]; // User's selected option indices
}

// User progress for a specific course
export interface CourseProgress {
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  quizScores: Record<string, QuizAttempt>; // lessonId -> attempt
  currentLessonId?: string;
  lastAccessedAt: string; // ISO date
  startedAt: string; // ISO date
}

// Lesson status for UI display
export type LessonStatus = 'completed' | 'current' | 'locked' | 'available';

// Helper to get lesson status based on progress
export function getLessonStatus(
  lesson: Lesson,
  lessons: Lesson[],
  completedLessonIds: string[]
): LessonStatus {
  // If already completed
  if (completedLessonIds.includes(lesson.id)) {
    return 'completed';
  }

  // Sort lessons by order
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const lessonIndex = sortedLessons.findIndex((l) => l.id === lesson.id);

  // First lesson is always available
  if (lessonIndex === 0) {
    return 'available';
  }

  // Check if previous lesson is completed
  const previousLesson = sortedLessons[lessonIndex - 1];
  if (previousLesson && completedLessonIds.includes(previousLesson.id)) {
    return 'available';
  }

  // Otherwise locked
  return 'locked';
}

// Calculate overall course progress percentage
export function calculateCourseProgress(
  lessons: Lesson[],
  completedLessonIds: string[]
): number {
  if (lessons.length === 0) return 0;
  return Math.round((completedLessonIds.length / lessons.length) * 100);
}

// Group lessons by chapter for sidebar display
export function groupLessonsByChapter(
  lessons: Lesson[]
): Map<string, Lesson[]> {
  const groups = new Map<string, Lesson[]>();
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  sortedLessons.forEach((lesson) => {
    const chapter = lesson.chapterTitle || 'Lessons';
    if (!groups.has(chapter)) {
      groups.set(chapter, []);
    }
    groups.get(chapter)!.push(lesson);
  });

  return groups;
}

// Default quiz pass threshold (can be overridden per quiz or globally)
export const DEFAULT_QUIZ_PASS_THRESHOLD = 70;

// Global course controls settings
export interface CourseControlsSettings {
  defaultQuizPassThreshold: number;
  allowRetakes: boolean;
  showCorrectAnswersAfterQuiz: boolean;
}

export const defaultCourseControlsSettings: CourseControlsSettings = {
  defaultQuizPassThreshold: 70,
  allowRetakes: true,
  showCorrectAnswersAfterQuiz: true,
};
