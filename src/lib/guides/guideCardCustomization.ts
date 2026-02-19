// Guide Card Customization Types and Store

// Shadow direction: -1 = center (no offset), 0-315 = directional angles
export type ShadowDirection = -1 | 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

// Per-difficulty badge styling
export interface DifficultyBadgeStyle {
  background: string;
  border: string;
  text: string;
}

// Typography settings
export interface TypographyStyle {
  fontSize: number; // in px
  fontWeight: 400 | 500 | 600 | 700;
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
  
  // Typography sizing
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

// Default typography
export const DEFAULT_GUIDE_TYPOGRAPHY: TypographyStyle = {
  fontSize: 16,
  fontWeight: 600,
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

// Storage keys — D1 via app_visual_config
const GUIDE_CARD_SETTINGS_KEY = "guide_card_settings";
const GUIDE_CARD_PRESETS_KEY = "guide_card_presets";

// ---- In-memory caches ----
let settingsCache: GuideCardSettings = { ...DEFAULT_GUIDE_CARD_SETTINGS };
let presetsCache: GuideCardPreset[] = [];
let cacheLoaded = false;

/** Load from D1 — call once on app init */
export async function loadGuideCardSettings(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const [settingsRes, presetsRes] = await Promise.all([
      fetch(`/api/visual-config?key=${GUIDE_CARD_SETTINGS_KEY}`),
      fetch(`/api/visual-config?key=${GUIDE_CARD_PRESETS_KEY}`),
    ]);
    if (settingsRes.ok) {
      const json = (await settingsRes.json()) as { ok: boolean; value: GuideCardSettings | null };
      if (json.ok && json.value) {
        settingsCache = {
          ...DEFAULT_GUIDE_CARD_SETTINGS,
          ...json.value,
          titleTypography: { ...DEFAULT_GUIDE_CARD_SETTINGS.titleTypography, ...json.value.titleTypography },
          descriptionTypography: { ...DEFAULT_GUIDE_CARD_SETTINGS.descriptionTypography, ...json.value.descriptionTypography },
          metaTypography: { ...DEFAULT_GUIDE_CARD_SETTINGS.metaTypography, ...json.value.metaTypography },
          beginnerBadge: { ...DEFAULT_GUIDE_CARD_SETTINGS.beginnerBadge, ...json.value.beginnerBadge },
          intermediateBadge: { ...DEFAULT_GUIDE_CARD_SETTINGS.intermediateBadge, ...json.value.intermediateBadge },
          advancedBadge: { ...DEFAULT_GUIDE_CARD_SETTINGS.advancedBadge, ...json.value.advancedBadge },
        };
      }
    }
    if (presetsRes.ok) {
      const json = (await presetsRes.json()) as { ok: boolean; value: GuideCardPreset[] | null };
      if (json.ok && Array.isArray(json.value)) presetsCache = json.value;
    }
  } catch (err) {
    console.error("[guideCardSettings] load failed:", err);
  }
  cacheLoaded = true;
}

// Get current settings (sync, from cache)
export function getGuideCardSettings(): GuideCardSettings {
  return settingsCache;
}

// Save settings to D1 + update cache
export async function saveGuideCardSettings(settings: GuideCardSettings): Promise<void> {
  settingsCache = settings;
  try {
    await fetch("/api/admin/visual-config", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: GUIDE_CARD_SETTINGS_KEY, value: settings }),
    });
  } catch (err) {
    console.error("[guideCardSettings] save failed:", err);
  }
}

// Presets (sync read from cache)
export function getCustomGuidePresets(): GuideCardPreset[] {
  return presetsCache;
}

export function getAllGuidePresets(): GuideCardPreset[] {
  return [...BUILT_IN_GUIDE_PRESETS, ...presetsCache];
}

export async function saveCustomGuidePreset(name: string, settings: GuideCardSettings): Promise<GuideCardPreset> {
  const preset: GuideCardPreset = {
    id: `custom_${Date.now()}`,
    name,
    settings,
    createdAt: Date.now(),
  };
  presetsCache = [...presetsCache, preset];
  await _persistGuidePresets();
  return preset;
}

export async function deleteCustomGuidePreset(id: string): Promise<void> {
  presetsCache = presetsCache.filter(p => p.id !== id);
  await _persistGuidePresets();
}

async function _persistGuidePresets(): Promise<void> {
  try {
    await fetch("/api/admin/visual-config", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: GUIDE_CARD_PRESETS_KEY, value: presetsCache }),
    });
  } catch (err) {
    console.error("[guideCardPresets] save failed:", err);
  }
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
