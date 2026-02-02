// Course System Types for ProvenAI

export type CourseType = 'short' | 'deep' | 'reference';
export type LifecycleState = 'current' | 'reference' | 'legacy';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

// Price tiers for monetization (computed from releaseDate)
export type CoursePriceTier = '497' | '247' | 'included';

// Admin-controlled visual customization
export type CardBackgroundMode = 'plain' | 'gradient' | 'image';
export type CardTextTheme = 'light' | 'dark';
export type CardOverlayEffect = 'none' | 'grid' | 'particles' | 'circuit' | 'waves' | 'matrix';

export interface CourseVisualSettings {
  backgroundMode: CardBackgroundMode;
  backgroundImage?: string; // URL or base64
  overlayStrength: number; // 0-80
  textTheme: CardTextTheme;
  accentColor?: string; // HSL string for border/focus/tag highlight
  logoUrl?: string; // Small icon/logo URL
  // Gradient customization
  gradientFrom?: string; // Hex color for gradient start
  gradientVia?: string; // Hex color for gradient middle
  gradientTo?: string; // Hex color for gradient end
  // AI overlay effect
  overlayEffect?: CardOverlayEffect;
}

// Labels for overlay effects
export const overlayEffectLabels: Record<CardOverlayEffect, string> = {
  none: 'None',
  grid: 'Tech Grid',
  particles: 'Particles',
  circuit: 'Circuit Lines',
  waves: 'Wave Pattern',
  matrix: 'Matrix Rain',
};

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimatedTime: string; // e.g., "30 min", "2 hours"
  courseType: CourseType;
  lifecycleState: LifecycleState;
  difficulty?: CourseDifficulty; // Optional difficulty level
  capabilityTags?: string[]; // max 6
  lastUpdated: string;
  href: string;
  // For course page template
  sections?: CourseSection[];
  toolsUsed?: string[]; // Tool IDs/slugs
  // Admin-controlled visual settings
  visualSettings?: CourseVisualSettings;
  // Monetization fields (BetterAuth/Stripe ready)
  releaseDate?: string; // ISO date string - used to compute price tier
  priceTier?: CoursePriceTier; // Computed: 497, 247, or included
  isIncludedForMembers?: boolean; // Computed: true if 6+ months old
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

export const difficultyLabels: Record<CourseDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

// Sort priority for lifecycle states
export const lifecycleSortOrder: Record<LifecycleState, number> = {
  current: 0,
  reference: 1,
  legacy: 2,
};

// Default gradient colors
export const defaultGradientColors = {
  from: '#0f1729', // Deep navy
  via: '#1a2540', // Dark blue
  to: '#252f4a', // Slate blue
};

// Default visual settings for new courses
export const defaultVisualSettings: CourseVisualSettings = {
  backgroundMode: 'plain',
  overlayStrength: 40,
  textTheme: 'dark',
  gradientFrom: defaultGradientColors.from,
  gradientVia: defaultGradientColors.via,
  gradientTo: defaultGradientColors.to,
  overlayEffect: 'none',
};

// Preset type for saving reusable visual settings
export interface VisualPreset {
  id: string;
  name: string;
  settings: CourseVisualSettings;
  createdAt: string;
}
