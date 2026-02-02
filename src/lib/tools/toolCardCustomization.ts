// Tool Card Customization Types and Store

// Shadow direction: -1 = center (no offset), 0-315 = directional angles
export type ShadowDirection = -1 | 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

export interface ToolCardSettings {
  // Page background
  pageBackground: string;        // HSL values for page background
  
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

// Storage keys
const TOOL_CARD_SETTINGS_KEY = "provenai_tool_card_settings";
const TOOL_CARD_PRESETS_KEY = "provenai_tool_card_presets";
const TOOL_LOGOS_KEY = "provenai_tool_logos";

// Get current settings
export function getToolCardSettings(): ToolCardCustomization {
  try {
    const stored = localStorage.getItem(TOOL_CARD_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load tool card settings:", e);
  }
  return {
    coreTools: DEFAULT_CORE_TOOLS_SETTINGS,
    directory: DEFAULT_DIRECTORY_SETTINGS,
    logos: [],
  };
}

// Save settings
export function saveToolCardSettings(settings: ToolCardCustomization): void {
  localStorage.setItem(TOOL_CARD_SETTINGS_KEY, JSON.stringify(settings));
}

// Get settings for a specific view
export function getCoreToolsCardSettings(): ToolCardSettings {
  return getToolCardSettings().coreTools;
}

export function getDirectoryCardSettings(): ToolCardSettings {
  return getToolCardSettings().directory;
}

// Update settings for a specific view
export function saveCoreToolsCardSettings(settings: ToolCardSettings): void {
  const current = getToolCardSettings();
  current.coreTools = settings;
  saveToolCardSettings(current);
}

export function saveDirectoryCardSettings(settings: ToolCardSettings): void {
  const current = getToolCardSettings();
  current.directory = settings;
  saveToolCardSettings(current);
}

// Logo management
export function getToolLogos(): ToolLogo[] {
  try {
    const stored = localStorage.getItem(TOOL_LOGOS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load tool logos:", e);
  }
  return [];
}

export function getToolLogo(toolId: string): string | null {
  const logos = getToolLogos();
  const logo = logos.find(l => l.toolId === toolId);
  return logo?.logoUrl || null;
}

export function saveToolLogo(toolId: string, logoUrl: string): void {
  const logos = getToolLogos();
  const existingIndex = logos.findIndex(l => l.toolId === toolId);
  
  const newLogo: ToolLogo = {
    toolId,
    logoUrl,
    uploadedAt: Date.now(),
  };
  
  if (existingIndex >= 0) {
    logos[existingIndex] = newLogo;
  } else {
    logos.push(newLogo);
  }
  
  localStorage.setItem(TOOL_LOGOS_KEY, JSON.stringify(logos));
}

export function deleteToolLogo(toolId: string): void {
  const logos = getToolLogos().filter(l => l.toolId !== toolId);
  localStorage.setItem(TOOL_LOGOS_KEY, JSON.stringify(logos));
}

// Presets
export function getCustomToolPresets(): ToolCardPreset[] {
  try {
    const stored = localStorage.getItem(TOOL_CARD_PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load tool card presets:", e);
  }
  return [];
}

export function getAllToolPresets(): ToolCardPreset[] {
  return [...BUILT_IN_TOOL_PRESETS, ...getCustomToolPresets()];
}

export function saveCustomToolPreset(name: string, settings: ToolCardSettings): ToolCardPreset {
  const preset: ToolCardPreset = {
    id: `custom_${Date.now()}`,
    name,
    settings,
    createdAt: Date.now(),
  };
  const presets = getCustomToolPresets();
  presets.push(preset);
  localStorage.setItem(TOOL_CARD_PRESETS_KEY, JSON.stringify(presets));
  return preset;
}

export function deleteCustomToolPreset(id: string): void {
  const presets = getCustomToolPresets().filter(p => p.id !== id);
  localStorage.setItem(TOOL_CARD_PRESETS_KEY, JSON.stringify(presets));
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
