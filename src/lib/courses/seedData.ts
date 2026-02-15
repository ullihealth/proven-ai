// Seed Data - Demo content for development and testing
// This file should NOT be imported in production builds

import type { Lesson, Module } from './lessonTypes';

/**
 * Check if we're in development mode
 * In production, seeding should be disabled
 */
export const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_ENABLE_SEED === 'true';

/**
 * Generate a unique ID for seed data
 */
function generateSeedId(): string {
  return `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create demo modules for a course
 */
export function createDemoModules(courseId: string): Module[] {
  if (!DEV_MODE) return [];

  return [
    {
      id: 'demo-mod-getting-started',
      courseId,
      title: 'Getting Started',
      order: 1,
    },
    {
      id: 'demo-mod-fundamentals',
      courseId,
      title: 'Fundamentals',
      order: 2,
    },
  ];
}

/**
 * Create demo lessons for a course
 * Only call this in development or when explicitly enabled
 */
export function createDemoLessons(courseId: string): Omit<Lesson, 'id'>[] {
  if (!DEV_MODE) {
    console.warn('[seedData] Attempted to create demo lessons in production mode');
    return [];
  }

  return [
    {
      courseId,
      moduleId: 'demo-mod-getting-started',
      title: 'Welcome & Course Overview',
      order: 1,
      contentBlocks: [
        {
          id: generateSeedId(),
          type: 'text' as const,
          content: '# Welcome to the Course\n\nIn this course, you\'ll learn the fundamentals step by step. Each lesson builds on the previous one.',
          order: 1,
        },
      ],
    },
    {
      courseId,
      moduleId: 'demo-mod-getting-started',
      title: 'Setting Up Your Environment',
      order: 2,
      contentBlocks: [
        {
          id: generateSeedId(),
          type: 'text' as const,
          content: '# Setting Up\n\nBefore we dive in, let\'s make sure you have everything you need.',
          order: 1,
        },
      ],
      quiz: {
        id: generateSeedId(),
        lessonId: '',
        passThreshold: 70,
        questions: [
          {
            id: generateSeedId(),
            text: 'What is the first step when starting a new project?',
            options: ['Jump straight into coding', 'Plan your approach', 'Skip documentation', 'Ignore requirements'],
            correctOptionIndex: 1,
          },
        ],
      },
    },
    {
      courseId,
      moduleId: 'demo-mod-fundamentals',
      title: 'Core Concepts',
      order: 1,
      contentBlocks: [
        {
          id: generateSeedId(),
          type: 'text' as const,
          content: '# Core Concepts\n\nNow let\'s explore the fundamental concepts you\'ll use throughout this course.',
          order: 1,
        },
      ],
    },
  ];
}

/**
 * Log when seed data is being used
 */
export function logSeedWarning(context: string): void {
  if (DEV_MODE) {
    console.log(`[DEV] ${context}: Using seed/demo data`);
  }
}
