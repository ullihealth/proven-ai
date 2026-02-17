// Lesson Store - CRUD operations for modules, lessons, and content blocks
// Uses storage adapter for persistence abstraction
// Hierarchy: Course → Module → Lesson → ContentBlock

import type { Lesson, ContentBlock, Quiz, QuizQuestion, Module } from './lessonTypes';
import { getStorageAdapter, STORAGE_KEYS } from '../storage';
import { createDemoLessons, createDemoModules, DEV_MODE, logSeedWarning } from './seedData';

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// In-memory caches for synchronous access (hydrated from storage)
let lessonsCache: Lesson[] = [];
let modulesCache: Module[] = [];
let cacheInitialized = false;

/**
 * Initialize the cache from storage
 * Called once on first access
 */
async function initCache(): Promise<void> {
  if (cacheInitialized) return;
  
  const storage = getStorageAdapter();
  const [storedLessons, storedModules] = await Promise.all([
    storage.get<Lesson[]>(STORAGE_KEYS.LESSONS),
    storage.get<Module[]>(STORAGE_KEYS.MODULES),
  ]);
  lessonsCache = storedLessons || [];
  modulesCache = storedModules || [];
  cacheInitialized = true;
}

/**
 * Sync caches to storage
 */
async function persistCache(): Promise<void> {
  const storage = getStorageAdapter();
  await Promise.all([
    storage.set(STORAGE_KEYS.LESSONS, lessonsCache),
    storage.set(STORAGE_KEYS.MODULES, modulesCache),
  ]);
}

/**
 * Initialize the lesson store - call this on app startup
 */
export async function initLessonStore(): Promise<void> {
  await initCache();
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
  await initCache();
  const courseModules = modulesCache.filter((m) => m.courseId === courseId);
  const maxOrder = courseModules.reduce((max, m) => Math.max(max, m.order), 0);

  const mod: Module = {
    id: generateId(),
    courseId,
    title,
    order: maxOrder + 1,
  };

  modulesCache.push(mod);
  await persistCache();
  return mod;
}

/**
 * Update a module
 */
export async function updateModule(
  moduleId: string,
  updates: Partial<Pick<Module, 'title'>>
): Promise<Module | undefined> {
  await initCache();
  const mod = modulesCache.find((m) => m.id === moduleId);
  if (!mod) return undefined;

  if (updates.title !== undefined) mod.title = updates.title;
  await persistCache();
  return mod;
}

/**
 * Delete a module and all its lessons
 */
export async function deleteModule(moduleId: string): Promise<boolean> {
  await initCache();
  const initialLen = modulesCache.length;
  modulesCache = modulesCache.filter((m) => m.id !== moduleId);
  if (modulesCache.length === initialLen) return false;

  // Remove all lessons in this module
  lessonsCache = lessonsCache.filter((l) => l.moduleId !== moduleId);
  await persistCache();
  return true;
}

/**
 * Reorder modules within a course
 */
export async function reorderModules(courseId: string, moduleIds: string[]): Promise<void> {
  await initCache();
  moduleIds.forEach((id, index) => {
    const mod = modulesCache.find((m) => m.id === id && m.courseId === courseId);
    if (mod) mod.order = index + 1;
  });
  await persistCache();
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
  await initCache();
  
  // If moduleId provided, count lessons in that module for ordering
  const siblingLessons = moduleId
    ? lessonsCache.filter((l) => l.moduleId === moduleId)
    : lessonsCache.filter((l) => l.courseId === courseId);
  const maxOrder = siblingLessons.reduce((max, l) => Math.max(max, l.order), 0);

  const newLesson: Lesson = {
    id: generateId(),
    courseId,
    moduleId,
    title,
    order: maxOrder + 1,
    contentBlocks: [],
    chapterTitle,
  };

  lessonsCache.push(newLesson);
  await persistCache();
  return newLesson;
}

/**
 * Update a lesson
 */
export async function updateLesson(
  lessonId: string,
  updates: Partial<Omit<Lesson, 'id' | 'courseId'>>
): Promise<Lesson | undefined> {
  await initCache();
  
  const index = lessonsCache.findIndex((l) => l.id === lessonId);
  if (index === -1) return undefined;

  lessonsCache[index] = { ...lessonsCache[index], ...updates };
  await persistCache();
  return lessonsCache[index];
}

/**
 * Delete a lesson
 */
export async function deleteLesson(lessonId: string): Promise<boolean> {
  await initCache();
  
  const initialLength = lessonsCache.length;
  lessonsCache = lessonsCache.filter((l) => l.id !== lessonId);
  
  if (lessonsCache.length === initialLength) return false;
  
  await persistCache();
  return true;
}

/**
 * Reorder lessons within a module (or course if no module)
 */
export async function reorderLessons(courseId: string, lessonIds: string[]): Promise<void> {
  await initCache();
  
  lessonIds.forEach((id, index) => {
    const lesson = lessonsCache.find((l) => l.id === id && l.courseId === courseId);
    if (lesson) {
      lesson.order = index + 1;
    }
  });
  
  await persistCache();
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
  await initCache();
  
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
  await persistCache();
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
  await initCache();
  
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson) return undefined;

  const blockIndex = lesson.contentBlocks.findIndex((b) => b.id === blockId);
  if (blockIndex === -1) return undefined;

  lesson.contentBlocks[blockIndex] = {
    ...lesson.contentBlocks[blockIndex],
    ...updates,
  };
  
  await persistCache();
  return lesson.contentBlocks[blockIndex];
}

/**
 * Delete a content block
 */
export async function deleteContentBlock(lessonId: string, blockId: string): Promise<boolean> {
  await initCache();
  
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson) return false;

  const initialLength = lesson.contentBlocks.length;
  lesson.contentBlocks = lesson.contentBlocks.filter((b) => b.id !== blockId);
  
  if (lesson.contentBlocks.length === initialLength) return false;
  
  await persistCache();
  return true;
}

/**
 * Reorder content blocks within a lesson
 */
export async function reorderContentBlocks(lessonId: string, blockIds: string[]): Promise<void> {
  await initCache();
  
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson) return;

  blockIds.forEach((id, index) => {
    const block = lesson.contentBlocks.find((b) => b.id === id);
    if (block) {
      block.order = index + 1;
    }
  });
  
  await persistCache();
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
  await initCache();
  
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
  await persistCache();
  return quiz;
}

/**
 * Remove quiz from a lesson
 */
export async function removeLessonQuiz(lessonId: string): Promise<boolean> {
  await initCache();
  
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson || !lesson.quiz) return false;

  delete lesson.quiz;
  await persistCache();
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
  await initCache();
  
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson || !lesson.quiz) return undefined;

  const question: QuizQuestion = {
    id: generateId(),
    text,
    options,
    correctOptionIndex,
  };

  lesson.quiz.questions.push(question);
  await persistCache();
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
  await initCache();
  
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson || !lesson.quiz) return undefined;

  const questionIndex = lesson.quiz.questions.findIndex((q) => q.id === questionId);
  if (questionIndex === -1) return undefined;

  lesson.quiz.questions[questionIndex] = {
    ...lesson.quiz.questions[questionIndex],
    ...updates,
  };
  
  await persistCache();
  return lesson.quiz.questions[questionIndex];
}

/**
 * Delete a quiz question
 */
export async function deleteQuizQuestion(lessonId: string, questionId: string): Promise<boolean> {
  await initCache();
  
  const lesson = lessonsCache.find((l) => l.id === lessonId);
  if (!lesson || !lesson.quiz) return false;

  const initialLength = lesson.quiz.questions.length;
  lesson.quiz.questions = lesson.quiz.questions.filter((q) => q.id !== questionId);
  
  if (lesson.quiz.questions.length === initialLength) return false;
  
  await persistCache();
  return true;
}

// --- Demo Seeding (Dev Only) ---

/**
 * Seed demo lessons and modules for a course
 * Only works in development mode
 */
export async function seedDemoLessons(courseId: string): Promise<Lesson[]> {
  const existingLessons = getLessonsByCourse(courseId);
  if (existingLessons.length > 0) return existingLessons;

  if (!DEV_MODE) {
    console.warn('[lessonStore] seedDemoLessons called in production - skipping');
    return [];
  }

  logSeedWarning('seedDemoLessons');
  
  await initCache();

  // Seed modules first
  const demoModules = createDemoModules(courseId);
  const moduleMap = new Map<string, string>(); // placeholder key → real id
  for (const modData of demoModules) {
    const mod: Module = { ...modData, id: generateId() };
    modulesCache.push(mod);
    moduleMap.set(modData.id, mod.id);
  }

  const demoLessonsData = createDemoLessons(courseId);
  const createdLessons: Lesson[] = [];

  for (const lessonData of demoLessonsData) {
    const newLesson: Lesson = {
      ...lessonData,
      id: generateId(),
      moduleId: lessonData.moduleId ? (moduleMap.get(lessonData.moduleId) || lessonData.moduleId) : undefined,
    };
    
    // Fix quiz lessonId reference
    if (newLesson.quiz) {
      newLesson.quiz.lessonId = newLesson.id;
    }
    
    lessonsCache.push(newLesson);
    createdLessons.push(newLesson);
  }

  await persistCache();
  return createdLessons;
}
