// Tool Card Customization Types and Store

// Shadow direction: -1 = center (no offset), 0-315 = directional angles
export type ShadowDirection = -1 | 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

export interface ToolCardSettings {
  // Page background
  pageBackground: string;        // HSL values for page background
  
  // Intro callout (Why these tools? section)
  calloutBackground: string;
  calloutBorder: string;
  calloutIconBackground: string;
  calloutTitleColor: string;
  calloutTextColor: string;
  
  // Main card
  cardBackground: string;        // HSL values e.g. "222 47% 11%"
  cardBorder: string;
  cardHoverBorder: string;
  cardShadow: number;            // Shadow intensity 0-100
  cardShadowDirection: ShadowDirection; // Shadow angle in degrees
  
  // Sub cards (Use when / Skip if boxes)
  subCardPositiveBackground: string;
  subCardPositiveBorder: string;
  subCardNegativeBackground: string;
  subCardNegativeBorder: string;
  subCardShadow: number;         // Shadow intensity 0-100
  subCardShadowDirection: ShadowDirection; // Shadow angle in degrees
  
  // Text colors
  titleColor: string;
  descriptionColor: string;
  subCardTitleColor: string;
  subCardTextColor: string;
  badgeBackground: string;
  badgeTextColor: string;
  
  // Accent colors for icons
  accentColor: string;
  positiveAccent: string;
  negativeAccent: string;
}

export interface ToolLogo {
  toolId: string;
  logoUrl: string;           // URL or base64 data URL
  uploadedAt: number;
}

export interface ToolCardPreset {
  id: string;
  name: string;
  settings: ToolCardSettings;
  createdAt: number;
}

// Separate settings for Core Tools page vs Directory page
export interface ToolCardCustomization {
  coreTools: ToolCardSettings;
  directory: ToolCardSettings;
  logos: ToolLogo[];
}

export const DEFAULT_CORE_TOOLS_SETTINGS: ToolCardSettings = {
  pageBackground: "210 20% 98%",
  
  calloutBackground: "217 91% 60% / 0.05",
  calloutBorder: "217 91% 60% / 0.1",
  calloutIconBackground: "217 91% 60% / 0.1",
  calloutTitleColor: "222 47% 11%",
  calloutTextColor: "220 9% 46%",
  
  cardBackground: "0 0% 100%",
  cardBorder: "220 13% 91%",
  cardHoverBorder: "217 91% 60% / 0.3",
  cardShadow: 15,
  cardShadowDirection: 180,
  
  subCardPositiveBackground: "210 40% 96%",
  subCardPositiveBorder: "220 13% 91%",
  subCardNegativeBackground: "220 14% 96%",
  subCardNegativeBorder: "220 13% 91%",
  subCardShadow: 0,
  subCardShadowDirection: 180,
  
  titleColor: "222 47% 11%",
  descriptionColor: "220 9% 46%",
  subCardTitleColor: "222 47% 11%",
  subCardTextColor: "220 9% 46%",
  badgeBackground: "217 91% 60%",
  badgeTextColor: "0 0% 100%",
  
  accentColor: "217 91% 60%",
  positiveAccent: "217 91% 60%",
  negativeAccent: "220 9% 46%",
};

export const DEFAULT_DIRECTORY_SETTINGS: ToolCardSettings = {
  pageBackground: "210 20% 98%",
  
  calloutBackground: "217 91% 60% / 0.05",
  calloutBorder: "217 91% 60% / 0.1",
  calloutIconBackground: "217 91% 60% / 0.1",
  calloutTitleColor: "222 47% 11%",
  calloutTextColor: "220 9% 46%",
  
  cardBackground: "0 0% 100%",
  cardBorder: "220 13% 91%",
  cardHoverBorder: "217 91% 60% / 0.3",
  cardShadow: 10,
  cardShadowDirection: 180,
  
  subCardPositiveBackground: "210 40% 96%",
  subCardPositiveBorder: "220 13% 91%",
  subCardNegativeBackground: "220 14% 96%",
  subCardNegativeBorder: "220 13% 91%",
  subCardShadow: 0,
  subCardShadowDirection: 180,
  
  titleColor: "222 47% 11%",
  descriptionColor: "220 9% 46%",
  subCardTitleColor: "222 47% 11%",
  subCardTextColor: "220 9% 46%",
  badgeBackground: "217 91% 60%",
  badgeTextColor: "0 0% 100%",
  
  accentColor: "217 91% 60%",
  positiveAccent: "217 91% 60%",
  negativeAccent: "220 9% 46%",
};

export const BUILT_IN_TOOL_PRESETS: ToolCardPreset[] = [
  {
    id: "default",
    name: "Default (Light)",
    settings: DEFAULT_CORE_TOOLS_SETTINGS,
    createdAt: 0,
  },
  {
    id: "dark",
    name: "Dark Mode",
    settings: {
      pageBackground: "222 47% 8%",
      
      calloutBackground: "217 91% 60% / 0.08",
      calloutBorder: "217 91% 60% / 0.15",
      calloutIconBackground: "217 91% 60% / 0.15",
      calloutTitleColor: "0 0% 100%",
      calloutTextColor: "220 13% 69%",
      
      cardBackground: "222 47% 11%",
      cardBorder: "222 40% 18%",
      cardHoverBorder: "217 91% 60% / 0.3",
      cardShadow: 25,
      cardShadowDirection: 180,
      
      subCardPositiveBackground: "222 40% 15%",
      subCardPositiveBorder: "222 35% 22%",
      subCardNegativeBackground: "222 40% 13%",
      subCardNegativeBorder: "222 35% 20%",
      subCardShadow: 10,
      subCardShadowDirection: 180,
      
      titleColor: "0 0% 100%",
      descriptionColor: "220 13% 69%",
      subCardTitleColor: "0 0% 98%",
      subCardTextColor: "220 13% 69%",
      badgeBackground: "217 91% 60%",
      badgeTextColor: "0 0% 100%",
      
      accentColor: "217 91% 60%",
      positiveAccent: "142 76% 36%",
      negativeAccent: "25 95% 53%",
    },
    createdAt: 0,
  },
  {
    id: "soft-blue",
    name: "Soft Blue",
    settings: {
      pageBackground: "210 50% 96%",
      
      calloutBackground: "210 60% 92%",
      calloutBorder: "210 50% 85%",
      calloutIconBackground: "210 50% 88%",
      calloutTitleColor: "217 33% 17%",
      calloutTextColor: "217 19% 45%",
      
      cardBackground: "210 40% 98%",
      cardBorder: "210 30% 88%",
      cardHoverBorder: "217 91% 60% / 0.4",
      cardShadow: 20,
      cardShadowDirection: 135,
      
      subCardPositiveBackground: "210 50% 95%",
      subCardPositiveBorder: "210 40% 85%",
      subCardNegativeBackground: "210 30% 95%",
      subCardNegativeBorder: "210 25% 85%",
      subCardShadow: 5,
      subCardShadowDirection: 180,
      
      titleColor: "217 33% 17%",
      descriptionColor: "217 19% 45%",
      subCardTitleColor: "217 33% 17%",
      subCardTextColor: "217 19% 45%",
      badgeBackground: "217 91% 60%",
      badgeTextColor: "0 0% 100%",
      
      accentColor: "217 91% 60%",
      positiveAccent: "217 91% 50%",
      negativeAccent: "217 19% 55%",
    },
    createdAt: 0,
  },
];

// Storage keys — D1 via app_visual_config
const TOOL_CARD_SETTINGS_KEY = "tool_card_settings";
const TOOL_CARD_PRESETS_KEY = "tool_card_presets";
const TOOL_LOGOS_KEY = "tool_logos";

// ---- In-memory caches ----
let settingsCache: ToolCardCustomization = {
  coreTools: DEFAULT_CORE_TOOLS_SETTINGS,
  directory: DEFAULT_DIRECTORY_SETTINGS,
  logos: [],
};
let presetsCache: ToolCardPreset[] = [];
let logosCache: ToolLogo[] = [];
let cacheLoaded = false;

/** Load from D1 — call once on app init */
export async function loadToolCardSettings(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const [settingsRes, presetsRes, logosRes] = await Promise.all([
      fetch(`/api/visual-config?key=${TOOL_CARD_SETTINGS_KEY}`),
      fetch(`/api/visual-config?key=${TOOL_CARD_PRESETS_KEY}`),
      fetch(`/api/visual-config?key=${TOOL_LOGOS_KEY}`),
    ]);
    if (settingsRes.ok) {
      const json = (await settingsRes.json()) as { ok: boolean; value: ToolCardCustomization | null };
      if (json.ok && json.value) settingsCache = json.value;
    }
    if (presetsRes.ok) {
      const json = (await presetsRes.json()) as { ok: boolean; value: ToolCardPreset[] | null };
      if (json.ok && Array.isArray(json.value)) presetsCache = json.value;
    }
    if (logosRes.ok) {
      const json = (await logosRes.json()) as { ok: boolean; value: ToolLogo[] | null };
      if (json.ok && Array.isArray(json.value)) logosCache = json.value;
    }
  } catch (err) {
    console.error("[toolCardSettings] load failed:", err);
  }
  cacheLoaded = true;
}

// Get current settings (sync, from cache)
export function getToolCardSettings(): ToolCardCustomization {
  return settingsCache;
}

// Save settings to D1 + update cache
export async function saveToolCardSettings(settings: ToolCardCustomization): Promise<void> {
  settingsCache = settings;
  try {
    await fetch("/api/admin/visual-config", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: TOOL_CARD_SETTINGS_KEY, value: settings }),
    });
  } catch (err) {
    console.error("[toolCardSettings] save failed:", err);
  }
}

// Get settings for a specific view
export function getCoreToolsCardSettings(): ToolCardSettings {
  return settingsCache.coreTools;
}

export function getDirectoryCardSettings(): ToolCardSettings {
  return settingsCache.directory;
}

// Update settings for a specific view
export async function saveCoreToolsCardSettings(settings: ToolCardSettings): Promise<void> {
  settingsCache = { ...settingsCache, coreTools: settings };
  await saveToolCardSettings(settingsCache);
}

export async function saveDirectoryCardSettings(settings: ToolCardSettings): Promise<void> {
  settingsCache = { ...settingsCache, directory: settings };
  await saveToolCardSettings(settingsCache);
}

// Logo management (sync read, async write)
export function getToolLogos(): ToolLogo[] {
  return logosCache;
}

export function getToolLogo(toolId: string): string | null {
  const logo = logosCache.find(l => l.toolId === toolId);
  return logo?.logoUrl || null;
}

export async function saveToolLogo(toolId: string, logoUrl: string): Promise<void> {
  const existingIndex = logosCache.findIndex(l => l.toolId === toolId);
  const newLogo: ToolLogo = { toolId, logoUrl, uploadedAt: Date.now() };

  if (existingIndex >= 0) {
    logosCache = [...logosCache];
    logosCache[existingIndex] = newLogo;
  } else {
    logosCache = [...logosCache, newLogo];
  }
  await _persistLogos();
}

export async function deleteToolLogo(toolId: string): Promise<void> {
  logosCache = logosCache.filter(l => l.toolId !== toolId);
  await _persistLogos();
}

async function _persistLogos(): Promise<void> {
  try {
    await fetch("/api/admin/visual-config", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: TOOL_LOGOS_KEY, value: logosCache }),
    });
  } catch (err) {
    console.error("[toolLogos] save failed:", err);
  }
}

// Presets (sync read, async write)
export function getCustomToolPresets(): ToolCardPreset[] {
  return presetsCache;
}

export function getAllToolPresets(): ToolCardPreset[] {
  return [...BUILT_IN_TOOL_PRESETS, ...presetsCache];
}

export async function saveCustomToolPreset(name: string, settings: ToolCardSettings): Promise<ToolCardPreset> {
  const preset: ToolCardPreset = {
    id: `custom_${Date.now()}`,
    name,
    settings,
    createdAt: Date.now(),
  };
  presetsCache = [...presetsCache, preset];
  await _persistToolPresets();
  return preset;
}

export async function deleteCustomToolPreset(id: string): Promise<void> {
  presetsCache = presetsCache.filter(p => p.id !== id);
  await _persistToolPresets();
}

async function _persistToolPresets(): Promise<void> {
  try {
    await fetch("/api/admin/visual-config", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: TOOL_CARD_PRESETS_KEY, value: presetsCache }),
    });
  } catch (err) {
    console.error("[toolPresets] save failed:", err);
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

// Helper to generate box-shadow from intensity (0-100) and direction (degrees, -1 = center)
export function shadowFromIntensity(intensity: number, direction: ShadowDirection = 180): string {
  if (intensity <= 0) return "none";
  
  // Scale shadow values based on intensity
  const scale = intensity / 100;
  const blur = Math.round(8 + scale * 24);      // 8px to 32px blur
  const spread = Math.round(scale * 4);          // 0px to 4px spread
  const opacity = (0.04 + scale * 0.16).toFixed(2); // 0.04 to 0.20 opacity
  
  // Center direction = no offset (even shadow all around)
  if (direction === -1) {
    return `0 0 ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`;
  }
  
  // Directional shadow
  const distance = Math.round(2 + scale * 10);   // 2px to 12px offset
  const angleRad = (direction * Math.PI) / 180;
  const xOffset = Math.round(Math.sin(angleRad) * distance);
  const yOffset = Math.round(Math.cos(angleRad) * distance);
  
  return `${xOffset}px ${yOffset}px ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`;
}
