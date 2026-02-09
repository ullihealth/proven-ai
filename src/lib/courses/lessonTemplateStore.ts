import type { CoursePageStyle } from "./types";
import type { ContentBlock, ContentBlockType } from "./lessonTypes";
import { defaultCoursePageStyle } from "./types";
import { getStorageAdapter, STORAGE_KEYS } from "../storage";

export interface LessonTemplateBlock {
  type: ContentBlockType;
  title?: string;
  content: string;
  order: number;
  altText?: string;
}

export interface LessonTemplate {
  id: string;
  name: string;
  createdAt: string;
  blocks: LessonTemplateBlock[];
  pageStyle: CoursePageStyle;
}

let templatesCache: LessonTemplate[] = [];
let cacheInitialized = false;

async function initCache(): Promise<void> {
  if (cacheInitialized) return;
  const storage = getStorageAdapter();
  const stored = await storage.get<LessonTemplate[]>(STORAGE_KEYS.LESSON_TEMPLATES);
  templatesCache = stored || [];
  cacheInitialized = true;
}

async function persistCache(): Promise<void> {
  const storage = getStorageAdapter();
  await storage.set(STORAGE_KEYS.LESSON_TEMPLATES, templatesCache);
}

export async function initLessonTemplateStore(): Promise<void> {
  await initCache();
}

export function getLessonTemplates(): LessonTemplate[] {
  return templatesCache;
}

export function getLessonTemplateById(id: string): LessonTemplate | undefined {
  return templatesCache.find((template) => template.id === id);
}

export async function saveLessonTemplate(
  name: string,
  blocks: ContentBlock[],
  pageStyle?: CoursePageStyle
): Promise<LessonTemplate> {
  await initCache();
  const template: LessonTemplate = {
    id: `lesson-template-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    blocks: blocks
      .map((block) => ({
        type: block.type,
        title: block.title,
        content: block.content,
        order: block.order,
        altText: block.altText,
      }))
      .sort((a, b) => a.order - b.order),
    pageStyle: pageStyle || defaultCoursePageStyle,
  };
  templatesCache = [...templatesCache, template];
  await persistCache();
  return template;
}

export async function deleteLessonTemplate(id: string): Promise<void> {
  await initCache();
  templatesCache = templatesCache.filter((template) => template.id !== id);
  await persistCache();
}
