// Course System Types for ProvenAI

export type CourseType = 'short' | 'deep' | 'reference';
export type LifecycleState = 'current' | 'reference' | 'legacy';

// Admin-controlled visual customization
export type CardBackgroundMode = 'plain' | 'gradient' | 'image';
export type CardTextTheme = 'light' | 'dark';

export interface CourseVisualSettings {
  backgroundMode: CardBackgroundMode;
  backgroundImage?: string; // URL or base64
  overlayStrength: number; // 0-80
  textTheme: CardTextTheme;
  accentColor?: string; // HSL string for border/focus/tag highlight
  logoUrl?: string; // Small icon/logo URL
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimatedTime: string; // e.g., "30 min", "2 hours"
  courseType: CourseType;
  lifecycleState: LifecycleState;
  capabilityTags?: string[]; // max 6
  lastUpdated: string;
  href: string;
  // For course page template
  sections?: CourseSection[];
  toolsUsed?: string[]; // Tool IDs/slugs
  // Admin-controlled visual settings
  visualSettings?: CourseVisualSettings;
}

export interface CourseSection {
  id: string;
  title: string;
  anchor: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courseIds: string[]; // References to course IDs, not duplicated content
}

// Display labels for types
export const courseTypeLabels: Record<CourseType, string> = {
  short: 'Short',
  deep: 'Deep',
  reference: 'Reference',
};

export const lifecycleStateLabels: Record<LifecycleState, string> = {
  current: 'Current',
  reference: 'Stable Reference',
  legacy: 'Legacy',
};

// Sort priority for lifecycle states
export const lifecycleSortOrder: Record<LifecycleState, number> = {
  current: 0,
  reference: 1,
  legacy: 2,
};

// Default visual settings for new courses
export const defaultVisualSettings: CourseVisualSettings = {
  backgroundMode: 'plain',
  overlayStrength: 40,
  textTheme: 'dark',
};
