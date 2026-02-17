// Lesson Store - CRUD operations for modules, lessons, and content blocks
// Reads from Cloudflare D1 via API, writes via admin API endpoints
// In-memory cache for synchronous access, hydrated per-course from API
// Hierarchy: Course → Module → Lesson → ContentBlock

import type { Lesson, ContentBlock, Quiz, QuizQuestion, Module } from './lessonTypes';
import {
  fetchLessons,
  fetchModules,
  createLessonApi,
  updateLessonApi,
  deleteLessonApi,
  reorderLessonsApi,
  createModuleApi,
  updateModuleApi,
  deleteModuleApi,
  reorderModulesApi,
} from './lessonApi';

// Generate unique IDs (for client-side block/question operations)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// In-memory caches for synchronous access (hydrated from API)
let lessonsCache: Lesson[] = [];
let modulesCache: Module[] = [];

/**
 * Load lessons + modules for a specific course from the D1-backed API.
 * Call this before accessing lessons/modules synchronously.
 */
export async function loadCourseLessons(courseId: string): Promise<void> {
  const [lessons, modules] = await Promise.all([
    fetchLessons(courseId),
    fetchModules(courseId),
  ]);

  // Replace entries for this course in cache (keep other courses intact)
  lessonsCache = [
    ...lessonsCache.filter((l) => l.courseId !== courseId),
    ...lessons,
  ];
  modulesCache = [
    ...modulesCache.filter((m) => m.courseId !== courseId),
    ...modules,
  ];
}

/**
 * Initialize the lesson store - now a no-op.
 * Use loadCourseLessons(courseId) instead.
 * Kept for backward compatibility during transition.
 */
export async function initLessonStore(): Promise<void> {
  // No-op — data is loaded per-course via loadCourseLessons()
}

// ─── Module Operations ─────────────────────────────────────

/**
 * Get all modules (synchronous)
 */
export function getAllModules(): Module[] {
  return modulesCache;
}

/**
 * Get modules for a specific course
 */
export function getModulesByCourse(courseId: string): Module[] {
  return modulesCache
    .filter((m) => m.courseId === courseId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get a single module by ID
 */
export function getModule(moduleId: string): Module | undefined {
  return modulesCache.find((m) => m.id === moduleId);
}

/**
 * Create a new module in a course
 */
export async function createModule(courseId: string, title: string): Promise<Module> {
  const mod = await createModuleApi(courseId, title);
  modulesCache.push(mod);
  return mod;
}

/**
 * Update a module
 */
export async function updateModule(
  moduleId: string,
  updates: Partial<Pick<Module, 'title'>>
): Promise<Module | undefined> {
  const mod = modulesCache.find((m) => m.id === moduleId);
  if (!mod) return undefined;

  await updateModuleApi(moduleId, updates);
  if (updates.title !== undefined) mod.title = updates.title;
  return mod;
}

/**
 * Delete a module and unassign its lessons
 */
export async function deleteModule(moduleId: string): Promise<boolean> {
  const initialLen = modulesCache.length;
  await deleteModuleApi(moduleId);
  modulesCache = modulesCache.filter((m) => m.id !== moduleId);
  if (modulesCache.length === initialLen) return false;

  // Unassign lessons from this module in cache
  lessonsCache.forEach((l) => {
    if (l.moduleId === moduleId) l.moduleId = undefined;
  });
  return true;
}

/**
 * Reorder modules within a course
 */
export async function reorderModules(courseId: string, moduleIds: string[]): Promise<void> {
  await reorderModulesApi(moduleIds);
  moduleIds.forEach((id, index) => {
    const mod = modulesCache.find((m) => m.id === id && m.courseId === courseId);
    if (mod) mod.order = index + 1;
  });
}

// ─── Lesson Operations ─────────────────────────────────────

/**
 * Get all lessons (synchronous for UI compatibility)
 */
export function getAllLessons(): Lesson[] {
  return lessonsCache;
}

/**
 * Get lessons for a specific course
 */
export function getLessonsByCourse(courseId: string): Lesson[] {
  return lessonsCache
    .filter((lesson) => lesson.courseId === courseId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get lessons for a specific module
 */
export function getLessonsByModule(moduleId: string): Lesson[] {
  return lessonsCache
    .filter((lesson) => lesson.moduleId === moduleId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get a single lesson by ID
 */
export function getLesson(lessonId: string): Lesson | undefined {
  return lessonsCache.find((lesson) => lesson.id === lessonId);
}

/**
 * Create a new lesson within a module
 */
export async function createLesson(
  courseId: string,
  title: string,
  moduleId?: string,
  chapterTitle?: string
): Promise<Lesson> {
  const newLesson = await createLessonApi(courseId, title, moduleId, chapterTitle);
  lessonsCache.push(newLesson);
  return newLesson;
}

/**
 * Update a lesson
 */
export async function updateLesson(
  lessonId: string,
  updates: Partial<Omit<Lesson, 'id' | 'courseId'>>
): Promise<Lesson | undefined> {
  const index = lessonsCache.findIndex((l) => l.id === lessonId);
  if (index === -1) return undefined;

  await updateLessonApi(lessonId, updates);
  lessonsCache[index] = { ...lessonsCache[index], ...updates };
  return lessonsCache[index];
}

/**
 * Delete a lesson
 */
export async function deleteLesson(lessonId: string): Promise<boolean> {
  const initialLength = lessonsCache.length;
  await deleteLessonApi(lessonId);
  lessonsCache = lessonsCache.filter((l) => l.id !== lessonId);
  return lessonsCache.length < initialLength;
}

/**
 * Reorder lessons within a module (or course if no module)
 */
export async function reorderLessons(courseId: string, lessonIds: string[]): Promise<void> {
  await reorderLessonsApi(lessonIds);
  lessonIds.forEach((id, index) => {
    const lesson = lessonsCache.find((l) => l.id === id && l.courseId === courseId);
    if (lesson) {
      lesson.order = index + 1;
    }
  });
}

// ─── Content Block Operations ──────────────────────────────

/**
 * Add a content block to a lesson
 */
export async function addContentBlock(
  lessonId: string,
  type: ContentBlock['type'],
  content: string,
  title?: string,
  altText?: string,
  displayWidth?: number
): Promise<ContentBlock | undefined> {
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson) return undefined;

  const maxOrder = lesson.contentBlocks.reduce((max, b) => Math.max(max, b.order), 0);
  
  const newBlock: ContentBlock = {
    id: generateId(),
    type,
    content,
    order: maxOrder + 1,
    title,
    altText,
    displayWidth,
  };

  lesson.contentBlocks.push(newBlock);
  await updateLessonApi(lessonId, { contentBlocks: lesson.contentBlocks });
  return newBlock;
}

/**
 * Update a content block
 */
export async function updateContentBlock(
  lessonId: string,
  blockId: string,
  updates: Partial<Omit<ContentBlock, 'id'>>
): Promise<ContentBlock | undefined> {
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson) return undefined;

  const blockIndex = lesson.contentBlocks.findIndex((b) => b.id === blockId);
  if (blockIndex === -1) return undefined;

  lesson.contentBlocks[blockIndex] = {
    ...lesson.contentBlocks[blockIndex],
    ...updates,
  };
  
  await updateLessonApi(lessonId, { contentBlocks: lesson.contentBlocks });
  return lesson.contentBlocks[blockIndex];
}

/**
 * Delete a content block
 */
export async function deleteContentBlock(lessonId: string, blockId: string): Promise<boolean> {
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson) return false;

  const initialLength = lesson.contentBlocks.length;
  lesson.contentBlocks = lesson.contentBlocks.filter((b) => b.id !== blockId);
  
  if (lesson.contentBlocks.length === initialLength) return false;
  
  await updateLessonApi(lessonId, { contentBlocks: lesson.contentBlocks });
  return true;
}

/**
 * Reorder content blocks within a lesson
 */
export async function reorderContentBlocks(lessonId: string, blockIds: string[]): Promise<void> {
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson) return;

  blockIds.forEach((id, index) => {
    const block = lesson.contentBlocks.find((b) => b.id === id);
    if (block) {
      block.order = index + 1;
    }
  });
  
  await updateLessonApi(lessonId, { contentBlocks: lesson.contentBlocks });
}

// --- Quiz Operations ---

/**
 * Add or update quiz for a lesson
 */
export async function setLessonQuiz(
  lessonId: string,
  questions: QuizQuestion[],
  passThreshold: number = 70,
  order?: number
): Promise<Quiz | undefined> {
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson) return undefined;

  const quiz: Quiz = {
    id: lesson.quiz?.id || generateId(),
    lessonId,
    questions,
    passThreshold,
    order: order ?? lesson.quiz?.order,
  };

  lesson.quiz = quiz;
  await updateLessonApi(lessonId, { quiz });
  return quiz;
}

/**
 * Remove quiz from a lesson
 */
export async function removeLessonQuiz(lessonId: string): Promise<boolean> {
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson || !lesson.quiz) return false;

  delete lesson.quiz;
  await updateLessonApi(lessonId, { quiz: null });
  return true;
}

/**
 * Add a question to an existing quiz
 */
export async function addQuizQuestion(
  lessonId: string,
  text: string,
  options: string[],
  correctOptionIndex: number
): Promise<QuizQuestion | undefined> {
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson || !lesson.quiz) return undefined;

  const question: QuizQuestion = {
    id: generateId(),
    text,
    options,
    correctOptionIndex,
  };

  lesson.quiz.questions.push(question);
  await updateLessonApi(lessonId, { quiz: lesson.quiz });
  return question;
}

/**
 * Update a quiz question
 */
export async function updateQuizQuestion(
  lessonId: string,
  questionId: string,
  updates: Partial<Omit<QuizQuestion, 'id'>>
): Promise<QuizQuestion | undefined> {
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson || !lesson.quiz) return undefined;

  const questionIndex = lesson.quiz.questions.findIndex((q) => q.id === questionId);
  if (questionIndex === -1) return undefined;

  lesson.quiz.questions[questionIndex] = {
    ...lesson.quiz.questions[questionIndex],
    ...updates,
  };
  
  await updateLessonApi(lessonId, { quiz: lesson.quiz });
  return lesson.quiz.questions[questionIndex];
}

/**
 * Delete a quiz question
 */
export async function deleteQuizQuestion(lessonId: string, questionId: string): Promise<boolean> {
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson || !lesson.quiz) return false;

  const initialLength = lesson.quiz.questions.length;
  lesson.quiz.questions = lesson.quiz.questions.filter((q) => q.id !== questionId);
  
  if (lesson.quiz.questions.length === initialLength) return false;
  
  await updateLessonApi(lessonId, { quiz: lesson.quiz });
  return true;
}

// --- Demo Seeding (Dev Only) ---

/**
 * Seed demo lessons — no-op now that data lives in D1.
 * Kept for backward compatibility with callers.
 */
export async function seedDemoLessons(courseId: string): Promise<Lesson[]> {
  return getLessonsByCourse(courseId);
}
