// Course Card Customization Types and Store
// Similar to Guide Card customization but for courses

import type { CourseDifficulty } from './types';

// Shadow direction: -1 = center (no offset), 0-315 = directional angles
export type ShadowDirection = -1 | 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

// Per-difficulty badge styling
export interface DifficultyBadgeStyle {
  background: string;
  border: string;
  text: string;
}

// Lifecycle badge styling per state
export interface LifecycleBadgeStyle {
  background: string;
  border: string;
  text: string;
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
  
  // Text colors
  titleColor: string;
  descriptionColor: string;
  metaColor: string;
  
  // Difficulty badges - independent per level
  beginnerBadge: DifficultyBadgeStyle;
  intermediateBadge: DifficultyBadgeStyle;
  advancedBadge: DifficultyBadgeStyle;
  
  // Lifecycle badges - independent per state
  currentBadge: LifecycleBadgeStyle;
  referenceBadge: LifecycleBadgeStyle;
  legacyBadge: LifecycleBadgeStyle;
  
  // Capability tags
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

export const DEFAULT_COURSE_CARD_SETTINGS: CourseCardSettings = {
  pageBackground: "0 0% 100%",
  
  cardBackground: "222 47% 11%",
  cardBorder: "222 40% 18%",
  cardHoverBorder: "217 91% 60% / 0.3",
  cardShadow: 15,
  cardShadowDirection: 180,
  
  titleColor: "0 0% 100%",
  descriptionColor: "220 13% 80%",
  metaColor: "220 13% 65%",
  
  // Beginner - green tint
  beginnerBadge: {
    background: "142 50% 18%",
    border: "142 40% 28%",
    text: "142 60% 65%",
  },
  // Intermediate - amber/yellow tint
  intermediateBadge: {
    background: "45 50% 18%",
    border: "45 40% 28%",
    text: "45 70% 65%",
  },
  // Advanced - red/rose tint
  advancedBadge: {
    background: "0 50% 18%",
    border: "0 40% 28%",
    text: "0 60% 70%",
  },
  
  // Current - primary blue
  currentBadge: {
    background: "217 91% 25%",
    border: "217 91% 40%",
    text: "217 91% 80%",
  },
  // Reference - neutral gray
  referenceBadge: {
    background: "220 13% 20%",
    border: "220 13% 30%",
    text: "220 13% 65%",
  },
  // Legacy - muted/dimmed
  legacyBadge: {
    background: "220 10% 15%",
    border: "220 10% 25%",
    text: "220 10% 50%",
  },
  
  tagBackground: "222 40% 15%",
  tagBorder: "222 30% 25%",
  tagText: "220 13% 70%",
};

export const BUILT_IN_COURSE_PRESETS: CourseCardPreset[] = [
  {
    id: "default",
    name: "Default (Dark)",
    settings: DEFAULT_COURSE_CARD_SETTINGS,
    createdAt: 0,
  },
  {
    id: "light",
    name: "Light Mode",
    settings: {
      pageBackground: "210 20% 98%",
      
      cardBackground: "0 0% 100%",
      cardBorder: "220 13% 91%",
      cardHoverBorder: "217 91% 60% / 0.5",
      cardShadow: 12,
      cardShadowDirection: 180,
      
      titleColor: "222 47% 11%",
      descriptionColor: "220 9% 46%",
      metaColor: "220 9% 46% / 0.7",
      
      beginnerBadge: {
        background: "142 76% 96%",
        border: "142 72% 80%",
        text: "142 72% 29%",
      },
      intermediateBadge: {
        background: "48 96% 95%",
        border: "45 93% 70%",
        text: "32 95% 30%",
      },
      advancedBadge: {
        background: "0 86% 97%",
        border: "0 74% 82%",
        text: "0 72% 40%",
      },
      
      currentBadge: {
        background: "217 91% 95%",
        border: "217 91% 75%",
        text: "217 91% 40%",
      },
      referenceBadge: {
        background: "220 14% 96%",
        border: "220 13% 88%",
        text: "220 9% 46%",
      },
      legacyBadge: {
        background: "220 14% 96%",
        border: "220 13% 91%",
        text: "220 9% 56% / 0.7",
      },
      
      tagBackground: "220 14% 96%",
      tagBorder: "220 13% 91%",
      tagText: "220 9% 46%",
    },
    createdAt: 0,
  },
  {
    id: "deep-navy",
    name: "Deep Navy",
    settings: {
      pageBackground: "222 47% 6%",
      
      cardBackground: "222 50% 8%",
      cardBorder: "222 45% 14%",
      cardHoverBorder: "217 91% 55% / 0.4",
      cardShadow: 20,
      cardShadowDirection: 135,
      
      titleColor: "0 0% 100%",
      descriptionColor: "220 15% 75%",
      metaColor: "220 15% 60%",
      
      beginnerBadge: {
        background: "142 45% 15%",
        border: "142 35% 25%",
        text: "142 55% 60%",
      },
      intermediateBadge: {
        background: "45 45% 15%",
        border: "45 35% 25%",
        text: "45 65% 60%",
      },
      advancedBadge: {
        background: "0 45% 15%",
        border: "0 35% 25%",
        text: "0 55% 65%",
      },
      
      currentBadge: {
        background: "217 80% 20%",
        border: "217 80% 35%",
        text: "217 85% 75%",
      },
      referenceBadge: {
        background: "222 40% 12%",
        border: "222 35% 20%",
        text: "220 15% 60%",
      },
      legacyBadge: {
        background: "222 35% 10%",
        border: "222 30% 18%",
        text: "220 12% 45%",
      },
      
      tagBackground: "222 45% 12%",
      tagBorder: "222 40% 18%",
      tagText: "220 15% 65%",
    },
    createdAt: 0,
  },
];

// Storage keys
const COURSE_CARD_SETTINGS_KEY = "provenai_course_card_settings";
const COURSE_CARD_PRESETS_KEY = "provenai_course_card_presets";

// Migrate old settings format to new format
function migrateSettings(stored: any): CourseCardSettings {
  // If it has the new format, return as-is with defaults for missing fields
  if (stored.beginnerBadge && stored.currentBadge) {
    return { ...DEFAULT_COURSE_CARD_SETTINGS, ...stored };
  }
  
  // Return defaults merged with whatever is stored
  return { ...DEFAULT_COURSE_CARD_SETTINGS, ...stored };
}

// Get current settings
export function getCourseCardSettings(): CourseCardSettings {
  try {
    const stored = localStorage.getItem(COURSE_CARD_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return migrateSettings(parsed);
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
