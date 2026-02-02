// Learning Path Card Customization Types and Store
// Mirrors Course Card customization for consistent admin experience

// Shadow direction: -1 = center (no offset), 0-315 = directional angles
export type ShadowDirection = -1 | 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

// Typography style settings
export interface TypographyStyle {
  fontSize: number; // in pixels
  fontWeight: number; // 400 = normal, 500 = medium, 600 = semibold, 700 = bold
}

export interface LearningPathCardSettings {
  // Main card
  cardBackground: string;
  cardBorder: string;
  cardHoverBackground: string;
  cardShadow: number;
  cardShadowDirection: ShadowDirection;
  
  // Header section
  headerBackground: string;
  
  // Text colors
  titleColor: string;
  descriptionColor: string;
  metaColor: string;
  
  // Typography settings
  titleTypography: TypographyStyle;
  descriptionTypography: TypographyStyle;
  metaTypography: TypographyStyle;
  
  // Chevron/icon colors
  iconColor: string;
  
  // Course list item styling
  courseItemBackground: string;
  courseItemHoverBackground: string;
  courseItemBorder: string;
  courseNumberBackground: string;
  courseNumberText: string;
  courseTitleColor: string;
  courseMetaColor: string;
}

export interface LearningPathCardPreset {
  id: string;
  name: string;
  settings: LearningPathCardSettings;
  createdAt: number;
}

// Default typography values
export const DEFAULT_LP_TYPOGRAPHY: Record<'title' | 'description' | 'meta', TypographyStyle> = {
  title: { fontSize: 16, fontWeight: 500 },
  description: { fontSize: 14, fontWeight: 400 },
  meta: { fontSize: 12, fontWeight: 400 },
};

export const DEFAULT_LP_CARD_SETTINGS: LearningPathCardSettings = {
  // Card
  cardBackground: "0 0% 100%",
  cardBorder: "220 13% 91%",
  cardHoverBackground: "220 14% 96%",
  cardShadow: 10,
  cardShadowDirection: 180,
  
  // Header
  headerBackground: "0 0% 100%",
  
  // Text
  titleColor: "222 47% 11%",
  descriptionColor: "220 9% 46%",
  metaColor: "220 9% 46% / 0.7",
  
  // Typography
  titleTypography: { fontSize: 16, fontWeight: 500 },
  descriptionTypography: { fontSize: 14, fontWeight: 400 },
  metaTypography: { fontSize: 12, fontWeight: 400 },
  
  // Icons
  iconColor: "220 9% 46%",
  
  // Course items
  courseItemBackground: "0 0% 100%",
  courseItemHoverBackground: "220 14% 96%",
  courseItemBorder: "220 13% 91%",
  courseNumberBackground: "220 14% 96%",
  courseNumberText: "220 9% 46%",
  courseTitleColor: "222 47% 11%",
  courseMetaColor: "220 9% 46%",
};

export const BUILT_IN_LP_PRESETS: LearningPathCardPreset[] = [
  {
    id: "default",
    name: "Default (Light)",
    settings: DEFAULT_LP_CARD_SETTINGS,
    createdAt: 0,
  },
  {
    id: "dark",
    name: "Dark Mode",
    settings: {
      cardBackground: "222 47% 11%",
      cardBorder: "222 40% 18%",
      cardHoverBackground: "222 40% 14%",
      cardShadow: 15,
      cardShadowDirection: 180,
      
      headerBackground: "222 47% 11%",
      
      titleColor: "0 0% 100%",
      descriptionColor: "220 13% 80%",
      metaColor: "220 13% 65%",
      
      titleTypography: { fontSize: 16, fontWeight: 500 },
      descriptionTypography: { fontSize: 14, fontWeight: 400 },
      metaTypography: { fontSize: 12, fontWeight: 400 },
      
      iconColor: "220 13% 65%",
      
      courseItemBackground: "222 47% 11%",
      courseItemHoverBackground: "222 40% 14%",
      courseItemBorder: "222 40% 18%",
      courseNumberBackground: "222 40% 15%",
      courseNumberText: "220 13% 70%",
      courseTitleColor: "0 0% 100%",
      courseMetaColor: "220 13% 65%",
    },
    createdAt: 0,
  },
  {
    id: "soft-blue",
    name: "Soft Blue",
    settings: {
      cardBackground: "210 40% 98%",
      cardBorder: "214 32% 91%",
      cardHoverBackground: "210 40% 95%",
      cardShadow: 12,
      cardShadowDirection: 180,
      
      headerBackground: "210 40% 98%",
      
      titleColor: "222 47% 11%",
      descriptionColor: "215 16% 47%",
      metaColor: "215 16% 47% / 0.7",
      
      titleTypography: { fontSize: 16, fontWeight: 500 },
      descriptionTypography: { fontSize: 14, fontWeight: 400 },
      metaTypography: { fontSize: 12, fontWeight: 400 },
      
      iconColor: "215 16% 47%",
      
      courseItemBackground: "210 40% 98%",
      courseItemHoverBackground: "210 40% 95%",
      courseItemBorder: "214 32% 91%",
      courseNumberBackground: "217 91% 95%",
      courseNumberText: "217 91% 40%",
      courseTitleColor: "222 47% 11%",
      courseMetaColor: "215 16% 47%",
    },
    createdAt: 0,
  },
];

// Storage keys
const LP_CARD_SETTINGS_KEY = "provenai_lp_card_settings";
const LP_CARD_PRESETS_KEY = "provenai_lp_card_presets";

// Get current settings
export function getLPCardSettings(): LearningPathCardSettings {
  try {
    const stored = localStorage.getItem(LP_CARD_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_LP_CARD_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load learning path card settings:", e);
  }
  return DEFAULT_LP_CARD_SETTINGS;
}

// Save settings
export function saveLPCardSettings(settings: LearningPathCardSettings): void {
  localStorage.setItem(LP_CARD_SETTINGS_KEY, JSON.stringify(settings));
}

// Presets
export function getCustomLPPresets(): LearningPathCardPreset[] {
  try {
    const stored = localStorage.getItem(LP_CARD_PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load learning path card presets:", e);
  }
  return [];
}

export function getAllLPPresets(): LearningPathCardPreset[] {
  return [...BUILT_IN_LP_PRESETS, ...getCustomLPPresets()];
}

export function saveCustomLPPreset(name: string, settings: LearningPathCardSettings): LearningPathCardPreset {
  const preset: LearningPathCardPreset = {
    id: `custom_${Date.now()}`,
    name,
    settings,
    createdAt: Date.now(),
  };
  const presets = getCustomLPPresets();
  presets.push(preset);
  localStorage.setItem(LP_CARD_PRESETS_KEY, JSON.stringify(presets));
  return preset;
}

export function deleteCustomLPPreset(id: string): void {
  const presets = getCustomLPPresets().filter(p => p.id !== id);
  localStorage.setItem(LP_CARD_PRESETS_KEY, JSON.stringify(presets));
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

// Helper to generate box-shadow from intensity and direction
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
