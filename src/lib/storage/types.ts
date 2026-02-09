// Storage Adapter Types - Abstraction layer for data persistence
// Enables seamless migration from localStorage to Cloudflare D1

/**
 * Generic storage adapter interface
 * All data stores should use this instead of calling localStorage directly
 */
export interface StorageAdapter {
  /**
   * Get an item from storage
   * @returns The parsed value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set an item in storage
   * @param key Storage key
   * @param value Value to store (will be serialized)
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Remove an item from storage
   */
  remove(key: string): Promise<void>;

  /**
   * Check if a key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all items (use with caution)
   */
  clear(): Promise<void>;
}

/**
 * Storage keys used across the application
 * Centralized here for consistency and refactoring safety
 */
export const STORAGE_KEYS = {
  LESSONS: 'provenai-lessons',
  COURSE_PROGRESS: 'provenai-course-progress',
  COURSE_CONTROLS: 'provenai-course-controls',
  LESSON_TEMPLATES: 'provenai-lesson-templates',
  COURSES: 'provenai-courses',
  LEARNING_PATHS: 'provenai-learning-paths',
  GUIDES: 'provenai-guides',
  TOOLS: 'provenai-tools-directory',
  DAILY_FLOW: 'provenai-daily-flow',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
