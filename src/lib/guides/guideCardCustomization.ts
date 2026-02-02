// Guide Card Customization Types and Store

// Shadow direction: -1 = center (no offset), 0-315 = directional angles
export type ShadowDirection = -1 | 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

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
  
  // Badges
  difficultyBadgeBackground: string;
  difficultyBadgeBorder: string;
  difficultyBadgeText: string;
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
  
  difficultyBadgeBackground: "0 0% 100%",
  difficultyBadgeBorder: "220 13% 91%",
  difficultyBadgeText: "220 9% 46%",
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
      
      difficultyBadgeBackground: "222 40% 15%",
      difficultyBadgeBorder: "222 35% 22%",
      difficultyBadgeText: "220 13% 69%",
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
      
      difficultyBadgeBackground: "210 50% 95%",
      difficultyBadgeBorder: "210 40% 85%",
      difficultyBadgeText: "217 19% 45%",
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

// Get current settings
export function getGuideCardSettings(): GuideCardSettings {
  try {
    const stored = localStorage.getItem(GUIDE_CARD_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
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
