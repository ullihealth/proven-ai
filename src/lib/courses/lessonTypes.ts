// Lesson System Types for ProvenAI Course Platform

// Content block types for rich lesson content
export type ContentBlockType = 'video' | 'text' | 'image' | 'pdf';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string; // URL for video/image/pdf, markdown for text
  order: number;
  title?: string; // Optional title for the block
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
  questions: QuizQuestion[];
  passThreshold: number; // 0-100 percentage required to pass
}

// Individual lesson within a course
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  contentBlocks: ContentBlock[];
  quiz?: Quiz;
  chapterTitle?: string; // Optional grouping for sidebar display
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
