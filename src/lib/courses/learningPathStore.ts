// Learning Path CRUD Store
import type { LearningPath } from './types';
import { getCourseById } from './coursesStore';
import type { Course } from './types';

const LEARNING_PATHS_KEY = 'provenai_learning_paths';

// Sample data for initialization
const defaultLearningPaths: (LearningPath & { defaultOpen?: boolean })[] = [
  {
    id: 'complete-beginner',
    title: 'Complete Beginner',
    description: 'Never used AI before? Start here for a gentle introduction.',
    courseIds: ['ai-foundations', 'ai-safety', 'mastering-chatgpt'],
    defaultOpen: true,
  },
  {
    id: 'productivity-boost',
    title: 'Productivity Boost',
    description: 'Already using AI? Level up your daily workflows.',
    courseIds: ['mastering-chatgpt', 'ai-email', 'prompt-engineering-basics'],
    defaultOpen: false,
  },
  {
    id: 'professional-communicator',
    title: 'Professional Communicator',
    description: 'Focus on AI-assisted writing and communication.',
    courseIds: ['ai-email', 'prompt-engineering-basics'],
    defaultOpen: false,
  },
  {
    id: 'responsible-ai-user',
    title: 'Responsible AI User',
    description: 'Understand the ethical and safety considerations.',
    courseIds: ['ai-safety', 'ai-foundations'],
    defaultOpen: false,
  },
];

// Extended type with defaultOpen
export interface LearningPathWithSettings extends LearningPath {
  defaultOpen?: boolean;
}

// Initialize storage with default data if empty
function initializePaths(): void {
  if (!localStorage.getItem(LEARNING_PATHS_KEY)) {
    localStorage.setItem(LEARNING_PATHS_KEY, JSON.stringify(defaultLearningPaths));
  }
}

// Get all learning paths
export function getLearningPaths(): LearningPathWithSettings[] {
  initializePaths();
  try {
    const stored = localStorage.getItem(LEARNING_PATHS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Get a specific path by ID
export function getLearningPathById(id: string): LearningPathWithSettings | undefined {
  return getLearningPaths().find(p => p.id === id);
}

// Save (create or update) a learning path
export function saveLearningPath(path: LearningPathWithSettings): void {
  const paths = getLearningPaths();
  const existingIndex = paths.findIndex(p => p.id === path.id);
  
  if (existingIndex >= 0) {
    paths[existingIndex] = path;
  } else {
    paths.push(path);
  }
  
  localStorage.setItem(LEARNING_PATHS_KEY, JSON.stringify(paths));
}

// Delete a learning path
export function deleteLearningPath(id: string): void {
  const paths = getLearningPaths().filter(p => p.id !== id);
  localStorage.setItem(LEARNING_PATHS_KEY, JSON.stringify(paths));
}

// Reorder learning paths
export function reorderLearningPaths(orderedIds: string[]): void {
  const paths = getLearningPaths();
  const reordered = orderedIds
    .map(id => paths.find(p => p.id === id))
    .filter((p): p is LearningPathWithSettings => p !== undefined);
  
  // Add any paths not in the ordered list at the end
  paths.forEach(p => {
    if (!orderedIds.includes(p.id)) {
      reordered.push(p);
    }
  });
  
  localStorage.setItem(LEARNING_PATHS_KEY, JSON.stringify(reordered));
}

// Get courses for a learning path
export function getCoursesForLearningPath(pathId: string): Course[] {
  const path = getLearningPathById(pathId);
  if (!path) return [];
  
  return path.courseIds
    .map(id => getCourseById(id))
    .filter((course): course is Course => course !== undefined);
}
