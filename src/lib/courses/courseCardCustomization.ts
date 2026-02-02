// Course Card Customization Types and Store
// Comprehensive styling system for Course Cards matching Guide Card capabilities

// Shadow direction: -1 = center (no offset), 0-315 = directional angles
export type ShadowDirection = -1 | 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

// Per-difficulty badge styling
export interface DifficultyBadgeStyle {
  background: string;
  border: string;
  text: string;
}

// Per-lifecycle badge styling
export interface LifecycleBadgeStyle {
  background: string;
  border: string;
  text: string;
}

// Typography settings
export interface TypographyStyle {
  fontSize: number; // in px
  fontWeight: 400 | 500 | 600 | 700;
}

export interface CourseCardSettings {
  // Page background
  pageBackground: string;
  
  // Main card
  cardBackground: string;
  cardBorder: string;
  cardHoverBorder: string;
  cardShadow: number;
  cardShadowDirection: ShadowDirection;
  
  // Typography colors
  titleColor: string;
  descriptionColor: string;
  metaColor: string;
  
  // Typography sizing
  titleTypography: TypographyStyle;
  descriptionTypography: TypographyStyle;
  metaTypography: TypographyStyle;
  
  // Course Type badge (Short, Deep, Reference)
  courseTypeBadgeBackground: string;
  courseTypeBadgeBorder: string;
  courseTypeBadgeText: string;
  
  // Difficulty badges - independent per level
  beginnerBadge: DifficultyBadgeStyle;
  intermediateBadge: DifficultyBadgeStyle;
  advancedBadge: DifficultyBadgeStyle;
  
  // Lifecycle badges - independent per state
  currentBadge: LifecycleBadgeStyle;
  referenceBadge: LifecycleBadgeStyle;
  legacyBadge: LifecycleBadgeStyle;
  
  // Tags (Skills dropdown)
  tagBackground: string;
  tagBorder: string;
  tagText: string;
}

export interface CourseCardPreset {
  id: string;
  name: string;
  settings: CourseCardSettings;
  createdAt: number;
}

// Default typography
export const DEFAULT_TYPOGRAPHY: TypographyStyle = {
  fontSize: 16,
  fontWeight: 500,
};

export const DEFAULT_COURSE_CARD_SETTINGS: CourseCardSettings = {
  pageBackground: "0 0% 100%",
  
  cardBackground: "0 0% 100%",
  cardBorder: "220 13% 91%",
  cardHoverBorder: "217 91% 60% / 0.5",
  cardShadow: 10,
  cardShadowDirection: 180,
  
  titleColor: "222 47% 11%",
  descriptionColor: "220 9% 46%",
  metaColor: "220 9% 46% / 0.7",
  
  titleTypography: { fontSize: 16, fontWeight: 500 },
  descriptionTypography: { fontSize: 14, fontWeight: 400 },
  metaTypography: { fontSize: 12, fontWeight: 400 },
  
  courseTypeBadgeBackground: "220 14% 96%",
  courseTypeBadgeBorder: "220 13% 91%",
  courseTypeBadgeText: "220 9% 46%",
  
  // Beginner - green tint
  beginnerBadge: {
    background: "142 76% 96%",
    border: "142 72% 80%",
    text: "142 72% 29%",
  },
  // Intermediate - amber/yellow tint
  intermediateBadge: {
    background: "48 96% 95%",
    border: "45 93% 70%",
    text: "32 95% 30%",
  },
  // Advanced - red/rose tint
  advancedBadge: {
    background: "0 86% 97%",
    border: "0 74% 82%",
    text: "0 72% 40%",
  },
  
  // Lifecycle badges
  currentBadge: {
    background: "217 91% 60% / 0.1",
    border: "217 91% 60% / 0.4",
    text: "217 91% 50%",
  },
  referenceBadge: {
    background: "220 14% 96%",
    border: "220 13% 91%",
    text: "220 9% 46%",
  },
  legacyBadge: {
    background: "220 14% 96%",
    border: "220 13% 91%",
    text: "220 9% 46% / 0.7",
  },
  
  tagBackground: "220 14% 96%",
  tagBorder: "220 13% 91%",
  tagText: "220 9% 46%",
};

export const BUILT_IN_COURSE_PRESETS: CourseCardPreset[] = [
  {
    id: "default",
    name: "Default (Light)",
    settings: DEFAULT_COURSE_CARD_SETTINGS,
    createdAt: 0,
  },
  {
    id: "dark",
    name: "Dark Mode",
    settings: {
      pageBackground: "222 47% 8%",
      
      cardBackground: "222 47% 11%",
      cardBorder: "222 40% 18%",
      cardHoverBorder: "217 91% 60% / 0.3",
      cardShadow: 20,
      cardShadowDirection: 180,
      
      titleColor: "0 0% 100%",
      descriptionColor: "220 13% 69%",
      metaColor: "220 13% 55%",
      
      titleTypography: { fontSize: 16, fontWeight: 500 },
      descriptionTypography: { fontSize: 14, fontWeight: 400 },
      metaTypography: { fontSize: 12, fontWeight: 400 },
      
      courseTypeBadgeBackground: "222 40% 15%",
      courseTypeBadgeBorder: "222 35% 25%",
      courseTypeBadgeText: "220 13% 69%",
      
      beginnerBadge: {
        background: "142 50% 18%",
        border: "142 40% 28%",
        text: "142 60% 65%",
      },
      intermediateBadge: {
        background: "45 50% 18%",
        border: "45 40% 28%",
        text: "45 70% 65%",
      },
      advancedBadge: {
        background: "0 50% 18%",
        border: "0 40% 28%",
        text: "0 60% 70%",
      },
      
      currentBadge: {
        background: "217 91% 60% / 0.15",
        border: "217 91% 60% / 0.3",
        text: "217 91% 65%",
      },
      referenceBadge: {
        background: "222 40% 15%",
        border: "222 35% 25%",
        text: "220 13% 60%",
      },
      legacyBadge: {
        background: "222 40% 13%",
        border: "222 35% 20%",
        text: "220 13% 50%",
      },
      
      tagBackground: "222 40% 15%",
      tagBorder: "222 35% 25%",
      tagText: "220 13% 69%",
    },
    createdAt: 0,
  },
  {
    id: "deep-navy",
    name: "Deep Navy",
    settings: {
      pageBackground: "222 60% 6%",
      
      cardBackground: "222 55% 10%",
      cardBorder: "222 45% 16%",
      cardHoverBorder: "200 80% 50% / 0.4",
      cardShadow: 25,
      cardShadowDirection: 135,
      
      titleColor: "0 0% 98%",
      descriptionColor: "210 20% 70%",
      metaColor: "210 15% 55%",
      
      titleTypography: { fontSize: 16, fontWeight: 600 },
      descriptionTypography: { fontSize: 14, fontWeight: 400 },
      metaTypography: { fontSize: 12, fontWeight: 400 },
      
      courseTypeBadgeBackground: "222 50% 14%",
      courseTypeBadgeBorder: "222 45% 22%",
      courseTypeBadgeText: "200 60% 70%",
      
      beginnerBadge: {
        background: "160 50% 15%",
        border: "160 40% 25%",
        text: "160 60% 60%",
      },
      intermediateBadge: {
        background: "35 50% 15%",
        border: "35 40% 25%",
        text: "35 70% 60%",
      },
      advancedBadge: {
        background: "350 50% 15%",
        border: "350 40% 25%",
        text: "350 60% 65%",
      },
      
      currentBadge: {
        background: "200 80% 50% / 0.15",
        border: "200 80% 50% / 0.3",
        text: "200 80% 60%",
      },
      referenceBadge: {
        background: "222 50% 14%",
        border: "222 45% 22%",
        text: "210 20% 60%",
      },
      legacyBadge: {
        background: "222 50% 12%",
        border: "222 45% 18%",
        text: "210 15% 50%",
      },
      
      tagBackground: "222 50% 14%",
      tagBorder: "222 45% 22%",
      tagText: "200 60% 70%",
    },
    createdAt: 0,
  },
];

// Storage keys
const COURSE_CARD_SETTINGS_KEY = "provenai_course_card_settings";
const COURSE_CARD_PRESETS_KEY = "provenai_course_card_presets";

// Get current settings
export function getCourseCardSettings(): CourseCardSettings {
  try {
    const stored = localStorage.getItem(COURSE_CARD_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all required fields exist (migration for old data)
      return {
        ...DEFAULT_COURSE_CARD_SETTINGS,
        ...parsed,
        titleTypography: { ...DEFAULT_TYPOGRAPHY, ...parsed.titleTypography },
        descriptionTypography: { ...DEFAULT_COURSE_CARD_SETTINGS.descriptionTypography, ...parsed.descriptionTypography },
        metaTypography: { ...DEFAULT_COURSE_CARD_SETTINGS.metaTypography, ...parsed.metaTypography },
        beginnerBadge: { ...DEFAULT_COURSE_CARD_SETTINGS.beginnerBadge, ...parsed.beginnerBadge },
        intermediateBadge: { ...DEFAULT_COURSE_CARD_SETTINGS.intermediateBadge, ...parsed.intermediateBadge },
        advancedBadge: { ...DEFAULT_COURSE_CARD_SETTINGS.advancedBadge, ...parsed.advancedBadge },
        currentBadge: { ...DEFAULT_COURSE_CARD_SETTINGS.currentBadge, ...parsed.currentBadge },
        referenceBadge: { ...DEFAULT_COURSE_CARD_SETTINGS.referenceBadge, ...parsed.referenceBadge },
        legacyBadge: { ...DEFAULT_COURSE_CARD_SETTINGS.legacyBadge, ...parsed.legacyBadge },
      };
    }
  } catch (e) {
    console.error("Failed to load course card settings:", e);
  }
  return DEFAULT_COURSE_CARD_SETTINGS;
}

// Save settings
export function saveCourseCardSettings(settings: CourseCardSettings): void {
  localStorage.setItem(COURSE_CARD_SETTINGS_KEY, JSON.stringify(settings));
}

// Presets
export function getCustomCoursePresets(): CourseCardPreset[] {
  try {
    const stored = localStorage.getItem(COURSE_CARD_PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load course card presets:", e);
  }
  return [];
}

export function getAllCoursePresets(): CourseCardPreset[] {
  return [...BUILT_IN_COURSE_PRESETS, ...getCustomCoursePresets()];
}

export function saveCustomCoursePreset(name: string, settings: CourseCardSettings): CourseCardPreset {
  const preset: CourseCardPreset = {
    id: `custom_${Date.now()}`,
    name,
    settings,
    createdAt: Date.now(),
  };
  const presets = getCustomCoursePresets();
  presets.push(preset);
  localStorage.setItem(COURSE_CARD_PRESETS_KEY, JSON.stringify(presets));
  return preset;
}

export function deleteCustomCoursePreset(id: string): void {
  const presets = getCustomCoursePresets().filter(p => p.id !== id);
  localStorage.setItem(COURSE_CARD_PRESETS_KEY, JSON.stringify(presets));
}

// Helper to convert HSL string to CSS
export function hslToCss(hsl: string): string {
  return `hsl(${hsl})`;
}

// Direction labels for UI
export const SHADOW_DIRECTIONS: { value: ShadowDirection; label: string }[] = [
  { value: -1, label: "● Center (Even)" },
  { value: 0, label: "↑ Top" },
  { value: 45, label: "↗ Top Right" },
  { value: 90, label: "→ Right" },
  { value: 135, label: "↘ Bottom Right" },
  { value: 180, label: "↓ Bottom" },
  { value: 225, label: "↙ Bottom Left" },
  { value: 270, label: "← Left" },
  { value: 315, label: "↖ Top Left" },
];

// Helper to generate box-shadow from intensity (0-100) and direction
export function shadowFromIntensity(intensity: number, direction: ShadowDirection = 180): string {
  if (intensity <= 0) return "none";
  
  const scale = intensity / 100;
  const blur = Math.round(8 + scale * 24);
  const spread = Math.round(scale * 4);
  const opacity = (0.04 + scale * 0.16).toFixed(2);
  
  if (direction === -1) {
    return `0 0 ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`;
  }
  
  const distance = Math.round(2 + scale * 10);
  const angleRad = (direction * Math.PI) / 180;
  const xOffset = Math.round(Math.sin(angleRad) * distance);
  const yOffset = Math.round(Math.cos(angleRad) * distance);
  
  return `${xOffset}px ${yOffset}px ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`;
}

import type { CourseDifficulty, LifecycleState } from './types';

// Helper to get difficulty badge styles
export function getDifficultyBadgeStyles(settings: CourseCardSettings, difficulty: CourseDifficulty): DifficultyBadgeStyle {
  switch (difficulty) {
    case 'beginner':
      return settings.beginnerBadge;
    case 'intermediate':
      return settings.intermediateBadge;
    case 'advanced':
      return settings.advancedBadge;
  }
}

// Helper to get lifecycle badge styles
export function getLifecycleBadgeStyles(settings: CourseCardSettings, lifecycle: LifecycleState): LifecycleBadgeStyle {
  switch (lifecycle) {
    case 'current':
      return settings.currentBadge;
    case 'reference':
      return settings.referenceBadge;
    case 'legacy':
      return settings.legacyBadge;
  }
}
