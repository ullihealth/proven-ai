// Lesson Store - CRUD operations for lessons and content blocks
import type { Lesson, ContentBlock, Quiz, QuizQuestion } from './lessonTypes';

const LESSONS_STORAGE_KEY = 'provenai-lessons';

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all lessons from localStorage
export function getAllLessons(): Lesson[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LESSONS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Get lessons for a specific course
export function getLessonsByCourse(courseId: string): Lesson[] {
  return getAllLessons()
    .filter((lesson) => lesson.courseId === courseId)
    .sort((a, b) => a.order - b.order);
}

// Get a single lesson by ID
export function getLesson(lessonId: string): Lesson | undefined {
  return getAllLessons().find((lesson) => lesson.id === lessonId);
}

// Save all lessons to localStorage
function saveLessons(lessons: Lesson[]): void {
  localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons));
}

// Create a new lesson
export function createLesson(
  courseId: string,
  title: string,
  chapterTitle?: string
): Lesson {
  const lessons = getAllLessons();
  const courseLessons = lessons.filter((l) => l.courseId === courseId);
  const maxOrder = courseLessons.reduce((max, l) => Math.max(max, l.order), 0);

  const newLesson: Lesson = {
    id: generateId(),
    courseId,
    title,
    order: maxOrder + 1,
    contentBlocks: [],
    chapterTitle,
  };

  saveLessons([...lessons, newLesson]);
  return newLesson;
}

// Update a lesson
export function updateLesson(
  lessonId: string,
  updates: Partial<Omit<Lesson, 'id' | 'courseId'>>
): Lesson | undefined {
  const lessons = getAllLessons();
  const index = lessons.findIndex((l) => l.id === lessonId);
  
  if (index === -1) return undefined;

  const updatedLesson = { ...lessons[index], ...updates };
  lessons[index] = updatedLesson;
  saveLessons(lessons);
  
  return updatedLesson;
}

// Delete a lesson
export function deleteLesson(lessonId: string): boolean {
  const lessons = getAllLessons();
  const filtered = lessons.filter((l) => l.id !== lessonId);
  
  if (filtered.length === lessons.length) return false;
  
  saveLessons(filtered);
  return true;
}

// Reorder lessons within a course
export function reorderLessons(courseId: string, lessonIds: string[]): void {
  const lessons = getAllLessons();
  
  lessonIds.forEach((id, index) => {
    const lesson = lessons.find((l) => l.id === id && l.courseId === courseId);
    if (lesson) {
      lesson.order = index + 1;
    }
  });
  
  saveLessons(lessons);
}

// --- Content Block Operations ---

// Add a content block to a lesson
export function addContentBlock(
  lessonId: string,
  type: ContentBlock['type'],
  content: string,
  title?: string
): ContentBlock | undefined {
  const lessons = getAllLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  
  if (!lesson) return undefined;

  const maxOrder = lesson.contentBlocks.reduce((max, b) => Math.max(max, b.order), 0);
  
  const newBlock: ContentBlock = {
    id: generateId(),
    type,
    content,
    order: maxOrder + 1,
    title,
  };

  lesson.contentBlocks.push(newBlock);
  saveLessons(lessons);
  
  return newBlock;
}

// Update a content block
export function updateContentBlock(
  lessonId: string,
  blockId: string,
  updates: Partial<Omit<ContentBlock, 'id'>>
): ContentBlock | undefined {
  const lessons = getAllLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  
  if (!lesson) return undefined;

  const blockIndex = lesson.contentBlocks.findIndex((b) => b.id === blockId);
  if (blockIndex === -1) return undefined;

  lesson.contentBlocks[blockIndex] = {
    ...lesson.contentBlocks[blockIndex],
    ...updates,
  };
  
  saveLessons(lessons);
  return lesson.contentBlocks[blockIndex];
}

// Delete a content block
export function deleteContentBlock(lessonId: string, blockId: string): boolean {
  const lessons = getAllLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  
  if (!lesson) return false;

  const initialLength = lesson.contentBlocks.length;
  lesson.contentBlocks = lesson.contentBlocks.filter((b) => b.id !== blockId);
  
  if (lesson.contentBlocks.length === initialLength) return false;
  
  saveLessons(lessons);
  return true;
}

// Reorder content blocks within a lesson
export function reorderContentBlocks(lessonId: string, blockIds: string[]): void {
  const lessons = getAllLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  
  if (!lesson) return;

  blockIds.forEach((id, index) => {
    const block = lesson.contentBlocks.find((b) => b.id === id);
    if (block) {
      block.order = index + 1;
    }
  });
  
  saveLessons(lessons);
}

// --- Quiz Operations ---

// Add or update quiz for a lesson
export function setLessonQuiz(
  lessonId: string,
  questions: QuizQuestion[],
  passThreshold: number = 70
): Quiz | undefined {
  const lessons = getAllLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  
  if (!lesson) return undefined;

  const quiz: Quiz = {
    id: lesson.quiz?.id || generateId(),
    lessonId,
    questions,
    passThreshold,
  };

  lesson.quiz = quiz;
  saveLessons(lessons);
  
  return quiz;
}

// Remove quiz from a lesson
export function removeLessonQuiz(lessonId: string): boolean {
  const lessons = getAllLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  
  if (!lesson || !lesson.quiz) return false;

  delete lesson.quiz;
  saveLessons(lessons);
  
  return true;
}

// Add a question to an existing quiz
export function addQuizQuestion(
  lessonId: string,
  text: string,
  options: string[],
  correctOptionIndex: number
): QuizQuestion | undefined {
  const lessons = getAllLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  
  if (!lesson || !lesson.quiz) return undefined;

  const question: QuizQuestion = {
    id: generateId(),
    text,
    options,
    correctOptionIndex,
  };

  lesson.quiz.questions.push(question);
  saveLessons(lessons);
  
  return question;
}

// Update a quiz question
export function updateQuizQuestion(
  lessonId: string,
  questionId: string,
  updates: Partial<Omit<QuizQuestion, 'id'>>
): QuizQuestion | undefined {
  const lessons = getAllLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  
  if (!lesson || !lesson.quiz) return undefined;

  const questionIndex = lesson.quiz.questions.findIndex((q) => q.id === questionId);
  if (questionIndex === -1) return undefined;

  lesson.quiz.questions[questionIndex] = {
    ...lesson.quiz.questions[questionIndex],
    ...updates,
  };
  
  saveLessons(lessons);
  return lesson.quiz.questions[questionIndex];
}

// Delete a quiz question
export function deleteQuizQuestion(lessonId: string, questionId: string): boolean {
  const lessons = getAllLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  
  if (!lesson || !lesson.quiz) return false;

  const initialLength = lesson.quiz.questions.length;
  lesson.quiz.questions = lesson.quiz.questions.filter((q) => q.id !== questionId);
  
  if (lesson.quiz.questions.length === initialLength) return false;
  
  saveLessons(lessons);
  return true;
}

// --- Seed Data for Testing ---

export function seedDemoLessons(courseId: string): Lesson[] {
  const existingLessons = getLessonsByCourse(courseId);
  if (existingLessons.length > 0) return existingLessons;

  const demoLessons: Omit<Lesson, 'id'>[] = [
    {
      courseId,
      title: 'Welcome & Course Overview',
      order: 1,
      chapterTitle: 'Getting Started',
      contentBlocks: [
        {
          id: generateId(),
          type: 'text',
          content: '# Welcome to the Course\n\nIn this course, you\'ll learn the fundamentals step by step. Each lesson builds on the previous one.',
          order: 1,
        },
      ],
    },
    {
      courseId,
      title: 'Setting Up Your Environment',
      order: 2,
      chapterTitle: 'Getting Started',
      contentBlocks: [
        {
          id: generateId(),
          type: 'text',
          content: '# Setting Up\n\nBefore we dive in, let\'s make sure you have everything you need.',
          order: 1,
        },
      ],
      quiz: {
        id: generateId(),
        lessonId: '', // Will be set below
        passThreshold: 70,
        questions: [
          {
            id: generateId(),
            text: 'What is the first step when starting a new project?',
            options: ['Jump straight into coding', 'Plan your approach', 'Skip documentation', 'Ignore requirements'],
            correctOptionIndex: 1,
          },
        ],
      },
    },
    {
      courseId,
      title: 'Core Concepts',
      order: 3,
      chapterTitle: 'Fundamentals',
      contentBlocks: [
        {
          id: generateId(),
          type: 'text',
          content: '# Core Concepts\n\nNow let\'s explore the fundamental concepts you\'ll use throughout this course.',
          order: 1,
        },
      ],
    },
  ];

  const createdLessons: Lesson[] = [];
  const lessons = getAllLessons();

  demoLessons.forEach((lessonData) => {
    const newLesson: Lesson = {
      ...lessonData,
      id: generateId(),
    };
    
    // Fix quiz lessonId reference
    if (newLesson.quiz) {
      newLesson.quiz.lessonId = newLesson.id;
    }
    
    lessons.push(newLesson);
    createdLessons.push(newLesson);
  });

  saveLessons(lessons);
  return createdLessons;
}
