// Guide Card Customization Types and Store

// Shadow direction: -1 = center (no offset), 0-315 = directional angles
export type ShadowDirection = -1 | 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

// Per-difficulty badge styling
export interface DifficultyBadgeStyle {
  background: string;
  border: string;
  text: string;
}

// Typography style settings
export interface TypographyStyle {
  fontSize: number; // in pixels (e.g., 14, 16, 18)
  fontWeight: number; // 400 = normal, 500 = medium, 600 = semibold, 700 = bold
}

export interface GuideCardSettings {
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
  
  // Typography settings
  titleTypography: TypographyStyle;
  descriptionTypography: TypographyStyle;
  metaTypography: TypographyStyle;
  
  // Difficulty badges - independent per level
  beginnerBadge: DifficultyBadgeStyle;
  intermediateBadge: DifficultyBadgeStyle;
  advancedBadge: DifficultyBadgeStyle;
  
  // Lifecycle badge
  lifecycleBadgeBackground: string;
  lifecycleBadgeBorder: string;
  lifecycleBadgeText: string;
  
  // Tags
  tagBackground: string;
  tagText: string;
}

export interface GuideCardPreset {
  id: string;
  name: string;
  settings: GuideCardSettings;
  createdAt: number;
}

// Default typography values
export const DEFAULT_TYPOGRAPHY: Record<'title' | 'description' | 'meta', TypographyStyle> = {
  title: { fontSize: 16, fontWeight: 600 },
  description: { fontSize: 14, fontWeight: 400 },
  meta: { fontSize: 12, fontWeight: 400 },
};

export const DEFAULT_GUIDE_CARD_SETTINGS: GuideCardSettings = {
  pageBackground: "210 20% 98%",
  
  cardBackground: "0 0% 100%",
  cardBorder: "220 13% 91%",
  cardHoverBorder: "217 91% 60% / 0.5",
  cardShadow: 10,
  cardShadowDirection: 180,
  
  titleColor: "222 47% 11%",
  descriptionColor: "220 9% 46%",
  metaColor: "220 9% 46% / 0.7",
  
  // Typography settings
  titleTypography: { fontSize: 16, fontWeight: 600 },
  descriptionTypography: { fontSize: 14, fontWeight: 400 },
  metaTypography: { fontSize: 12, fontWeight: 400 },
  
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
  
  lifecycleBadgeBackground: "220 14% 96%",
  lifecycleBadgeBorder: "220 13% 91%",
  lifecycleBadgeText: "220 9% 46%",
  
  tagBackground: "220 14% 96%",
  tagText: "220 9% 46%",
};

export const BUILT_IN_GUIDE_PRESETS: GuideCardPreset[] = [
  {
    id: "default",
    name: "Default (Light)",
    settings: DEFAULT_GUIDE_CARD_SETTINGS,
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
      
      titleTypography: { fontSize: 16, fontWeight: 600 },
      descriptionTypography: { fontSize: 14, fontWeight: 400 },
      metaTypography: { fontSize: 12, fontWeight: 400 },
      
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
      
      lifecycleBadgeBackground: "222 40% 13%",
      lifecycleBadgeBorder: "222 35% 20%",
      lifecycleBadgeText: "220 13% 69%",
      
      tagBackground: "222 40% 15%",
      tagText: "220 13% 69%",
    },
    createdAt: 0,
  },
  {
    id: "soft-blue",
    name: "Soft Blue",
    settings: {
      pageBackground: "210 50% 96%",
      
      cardBackground: "210 40% 98%",
      cardBorder: "210 30% 88%",
      cardHoverBorder: "217 91% 60% / 0.4",
      cardShadow: 15,
      cardShadowDirection: 135,
      
      titleColor: "217 33% 17%",
      descriptionColor: "217 19% 45%",
      metaColor: "217 19% 55%",
      
      titleTypography: { fontSize: 16, fontWeight: 600 },
      descriptionTypography: { fontSize: 14, fontWeight: 400 },
      metaTypography: { fontSize: 12, fontWeight: 400 },
      
      beginnerBadge: {
        background: "142 60% 94%",
        border: "142 50% 78%",
        text: "142 60% 32%",
      },
      intermediateBadge: {
        background: "48 80% 92%",
        border: "45 70% 68%",
        text: "32 80% 32%",
      },
      advancedBadge: {
        background: "0 70% 95%",
        border: "0 60% 80%",
        text: "0 60% 42%",
      },
      
      lifecycleBadgeBackground: "210 30% 95%",
      lifecycleBadgeBorder: "210 25% 85%",
      lifecycleBadgeText: "217 19% 45%",
      
      tagBackground: "210 50% 92%",
      tagText: "217 19% 45%",
    },
    createdAt: 0,
  },
];

// Storage keys
const GUIDE_CARD_SETTINGS_KEY = "provenai_guide_card_settings";
const GUIDE_CARD_PRESETS_KEY = "provenai_guide_card_presets";

// Migrate old settings format to new format
function migrateSettings(stored: any): GuideCardSettings {
  // If it has the new format, return as-is with defaults for missing fields
  if (stored.beginnerBadge && stored.intermediateBadge && stored.advancedBadge) {
    return { ...DEFAULT_GUIDE_CARD_SETTINGS, ...stored };
  }
  
  // Migrate from old flat format
  const migrated: GuideCardSettings = {
    ...DEFAULT_GUIDE_CARD_SETTINGS,
    pageBackground: stored.pageBackground ?? DEFAULT_GUIDE_CARD_SETTINGS.pageBackground,
    cardBackground: stored.cardBackground ?? DEFAULT_GUIDE_CARD_SETTINGS.cardBackground,
    cardBorder: stored.cardBorder ?? DEFAULT_GUIDE_CARD_SETTINGS.cardBorder,
    cardHoverBorder: stored.cardHoverBorder ?? DEFAULT_GUIDE_CARD_SETTINGS.cardHoverBorder,
    cardShadow: stored.cardShadow ?? DEFAULT_GUIDE_CARD_SETTINGS.cardShadow,
    cardShadowDirection: stored.cardShadowDirection ?? DEFAULT_GUIDE_CARD_SETTINGS.cardShadowDirection,
    titleColor: stored.titleColor ?? DEFAULT_GUIDE_CARD_SETTINGS.titleColor,
    descriptionColor: stored.descriptionColor ?? DEFAULT_GUIDE_CARD_SETTINGS.descriptionColor,
    metaColor: stored.metaColor ?? DEFAULT_GUIDE_CARD_SETTINGS.metaColor,
    lifecycleBadgeBackground: stored.lifecycleBadgeBackground ?? DEFAULT_GUIDE_CARD_SETTINGS.lifecycleBadgeBackground,
    lifecycleBadgeBorder: stored.lifecycleBadgeBorder ?? DEFAULT_GUIDE_CARD_SETTINGS.lifecycleBadgeBorder,
    lifecycleBadgeText: stored.lifecycleBadgeText ?? DEFAULT_GUIDE_CARD_SETTINGS.lifecycleBadgeText,
    tagBackground: stored.tagBackground ?? DEFAULT_GUIDE_CARD_SETTINGS.tagBackground,
    tagText: stored.tagText ?? DEFAULT_GUIDE_CARD_SETTINGS.tagText,
    // Use old flat values for all difficulty badges if they exist, otherwise use new defaults
    beginnerBadge: stored.difficultyBadgeBackground ? {
      background: stored.difficultyBadgeBackground,
      border: stored.difficultyBadgeBorder,
      text: stored.difficultyBadgeText,
    } : DEFAULT_GUIDE_CARD_SETTINGS.beginnerBadge,
    intermediateBadge: stored.difficultyBadgeBackground ? {
      background: stored.difficultyBadgeBackground,
      border: stored.difficultyBadgeBorder,
      text: stored.difficultyBadgeText,
    } : DEFAULT_GUIDE_CARD_SETTINGS.intermediateBadge,
    advancedBadge: stored.difficultyBadgeBackground ? {
      background: stored.difficultyBadgeBackground,
      border: stored.difficultyBadgeBorder,
      text: stored.difficultyBadgeText,
    } : DEFAULT_GUIDE_CARD_SETTINGS.advancedBadge,
  };
  
  // Save migrated settings
  saveGuideCardSettings(migrated);
  return migrated;
}

// Get current settings
export function getGuideCardSettings(): GuideCardSettings {
  try {
    const stored = localStorage.getItem(GUIDE_CARD_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return migrateSettings(parsed);
    }
  } catch (e) {
    console.error("Failed to load guide card settings:", e);
  }
  return DEFAULT_GUIDE_CARD_SETTINGS;
}

// Save settings
export function saveGuideCardSettings(settings: GuideCardSettings): void {
  localStorage.setItem(GUIDE_CARD_SETTINGS_KEY, JSON.stringify(settings));
}

// Presets
export function getCustomGuidePresets(): GuideCardPreset[] {
  try {
    const stored = localStorage.getItem(GUIDE_CARD_PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load guide card presets:", e);
  }
  return [];
}

export function getAllGuidePresets(): GuideCardPreset[] {
  return [...BUILT_IN_GUIDE_PRESETS, ...getCustomGuidePresets()];
}

export function saveCustomGuidePreset(name: string, settings: GuideCardSettings): GuideCardPreset {
  const preset: GuideCardPreset = {
    id: `custom_${Date.now()}`,
    name,
    settings,
    createdAt: Date.now(),
  };
  const presets = getCustomGuidePresets();
  presets.push(preset);
  localStorage.setItem(GUIDE_CARD_PRESETS_KEY, JSON.stringify(presets));
  return preset;
}

export function deleteCustomGuidePreset(id: string): void {
  const presets = getCustomGuidePresets().filter(p => p.id !== id);
  localStorage.setItem(GUIDE_CARD_PRESETS_KEY, JSON.stringify(presets));
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
