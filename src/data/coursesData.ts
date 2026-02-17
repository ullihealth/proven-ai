import type { Course, LearningPath } from '@/lib/courses/types';

export const courses: Course[] = [
  {
    id: 'ai-foundations',
    slug: 'ai-foundations',
    title: 'AI Foundations',
    description: 'A comprehensive introduction to AI concepts and tools for beginners.',
    estimatedTime: '1 hour',
    courseType: 'deep',
    lifecycleState: 'current',
    capabilityTags: ['Fundamentals', 'Concepts', 'Getting Started'],
    lastUpdated: 'January 25, 2026',
    href: '/learn/courses/ai-foundations',
    sections: [
      { id: 'intro', title: 'Introduction', anchor: 'intro' },
      { id: 'what-is-ai', title: 'What is AI?', anchor: 'what-is-ai' },
      { id: 'how-llms-work', title: 'How LLMs Work', anchor: 'how-llms-work' },
      { id: 'practical-uses', title: 'Practical Uses', anchor: 'practical-uses' },
    ],
    toolsUsed: ['chatgpt', 'claude'],
  },
  {
    id: 'mastering-chatgpt',
    slug: 'mastering-chatgpt',
    title: 'Mastering AI Prompts: Professional Skills for Real-World Results',
    description: 'Why most prompts produce average results — and the professional techniques that fix it.',
    estimatedTime: '90 min',
    courseType: 'deep',
    lifecycleState: 'current',
    capabilityTags: ['ChatGPT', 'Prompting', 'Productivity'],
    lastUpdated: 'January 20, 2026',
    href: '/learn/courses/mastering-chatgpt',
    toolsUsed: ['chatgpt'],
  },
  {
    id: 'ai-email',
    slug: 'ai-email',
    title: 'AI for Email & Communication',
    description: 'Practical course on using AI to write better emails, messages, and professional communications.',
    estimatedTime: '45 min',
    courseType: 'short',
    lifecycleState: 'current',
    capabilityTags: ['Email', 'Writing', 'Communication'],
    lastUpdated: 'January 15, 2026',
    href: '/learn/courses/ai-email',
    toolsUsed: ['chatgpt', 'claude'],
  },
  {
    id: 'ai-safety',
    slug: 'ai-safety',
    title: 'Understanding AI Safety & Ethics',
    description: 'What you need to know about using AI responsibly and safely in personal and professional contexts.',
    estimatedTime: '30 min',
    courseType: 'reference',
    lifecycleState: 'current',
    capabilityTags: ['Safety', 'Ethics', 'Privacy'],
    lastUpdated: 'January 10, 2026',
    href: '/learn/courses/ai-safety',
  },
  {
    id: 'prompt-engineering-basics',
    slug: 'prompt-engineering-basics',
    title: 'Prompt Engineering Basics',
    description: 'Learn the fundamentals of writing effective prompts that get better AI responses.',
    estimatedTime: '60 min',
    courseType: 'short',
    lifecycleState: 'reference',
    capabilityTags: ['Prompting', 'Fundamentals'],
    lastUpdated: 'December 15, 2025',
    href: '/learn/courses/prompt-engineering-basics',
  },
  {
    id: 'gpt-3-to-4-migration',
    slug: 'gpt-3-to-4-migration',
    title: 'GPT-3 to GPT-4 Migration Guide',
    description: 'Historical reference for users transitioning from GPT-3 to GPT-4 capabilities.',
    estimatedTime: '20 min',
    courseType: 'reference',
    lifecycleState: 'legacy',
    capabilityTags: ['ChatGPT', 'Migration'],
    lastUpdated: 'March 1, 2024',
    href: '/learn/courses/gpt-3-to-4-migration',
  },
];

export const learningPaths: LearningPath[] = [
  {
    id: 'complete-beginner',
    title: 'Complete Beginner',
    description: 'Never used AI before? Start here for a gentle introduction.',
    courseIds: ['ai-foundations', 'ai-safety', 'mastering-chatgpt'],
  },
  {
    id: 'productivity-boost',
    title: 'Productivity Boost',
    description: 'Already using AI? Level up your daily workflows.',
    courseIds: ['mastering-chatgpt', 'ai-email', 'prompt-engineering-basics'],
  },
  {
    id: 'professional-communicator',
    title: 'Professional Communicator',
    description: 'Focus on AI-assisted writing and communication.',
    courseIds: ['ai-email', 'prompt-engineering-basics'],
  },
  {
    id: 'responsible-ai-user',
    title: 'Responsible AI User',
    description: 'Understand the ethical and safety considerations.',
    courseIds: ['ai-safety', 'ai-foundations'],
  },
];

// Helper to get course by ID
export const getCourseById = (id: string): Course | undefined => {
  return courses.find(course => course.id === id);
};

// Helper to get courses for a path
export const getCoursesForPath = (pathId: string): Course[] => {
  const path = learningPaths.find(p => p.id === pathId);
  if (!path) return [];
  return path.courseIds
    .map(id => getCourseById(id))
    .filter((course): course is Course => course !== undefined);
};

// Helper to sort courses by lifecycle state
export const sortCoursesByLifecycle = (coursesToSort: Course[]): Course[] => {
  const order = { current: 0, reference: 1, legacy: 2 };
  return [...coursesToSort].sort((a, b) => order[a.lifecycleState] - order[b.lifecycleState]);
};
