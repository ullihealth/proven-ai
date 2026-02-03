// Learning Path Card Visual Customization Store

export type LPBackgroundMode = 'plain' | 'gradient' | 'image';
export type LPTextTheme = 'dark' | 'light';

export interface LearningPathCardSettings {
  // Background Mode
  backgroundMode: LPBackgroundMode;
  
  // Gradient settings (when backgroundMode === 'gradient')
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  
  // Image settings (when backgroundMode === 'image')
  backgroundImage: string;
  overlayStrength: number; // 0-100
  imageBrightness: number; // -50 to 50
  imageExposure: number; // 0-60
  
  // Text theme (for gradient/image modes)
  textTheme: LPTextTheme;
  
  // Typography - Header (Path Title)
  titleFontSize: number; // 14-24px
  titleFontWeight: number; // 400-700
  
  // Typography - Description (Subtitle)
  descriptionFontSize: number; // 10-18px
  descriptionFontWeight: number; // 400-700
  
  // Typography - Meta (course count, etc.)
  metaFontSize: number; // 10-16px
  metaFontWeight: number; // 400-600
  
  // Card Colors (HSL format) - for plain mode
  cardBackground: string;
  cardBorder: string;
  
  // Text Colors (HSL format) - for plain mode
  titleColor: string;
  descriptionColor: string;
  metaColor: string;
  
  // Shadow
  shadowIntensity: number; // 0-100
  shadowDirection: ShadowDirection;
}

export type ShadowDirection = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const SHADOW_DIRECTIONS: { value: ShadowDirection; label: string }[] = [
  { value: -1, label: "Centered" },
  { value: 0, label: "Top" },
  { value: 1, label: "Top Right" },
  { value: 2, label: "Right" },
  { value: 3, label: "Bottom Right" },
  { value: 4, label: "Bottom" },
  { value: 5, label: "Bottom Left" },
  { value: 6, label: "Left" },
  { value: 7, label: "Top Left" },
];

export const DEFAULT_LP_GRADIENT_COLORS = {
  from: '#1a1a2e',
  via: '#16213e',
  to: '#0f3460',
};

export const DEFAULT_LEARNING_PATH_CARD_SETTINGS: LearningPathCardSettings = {
  backgroundMode: 'plain',
  gradientFrom: DEFAULT_LP_GRADIENT_COLORS.from,
  gradientVia: DEFAULT_LP_GRADIENT_COLORS.via,
  gradientTo: DEFAULT_LP_GRADIENT_COLORS.to,
  backgroundImage: '',
  overlayStrength: 50,
  imageBrightness: 0,
  imageExposure: 0,
  textTheme: 'dark',
  titleFontSize: 16,
  titleFontWeight: 500,
  descriptionFontSize: 14,
  descriptionFontWeight: 400,
  metaFontSize: 12,
  metaFontWeight: 400,
  cardBackground: "0 0% 100%",
  cardBorder: "0 0% 90%",
  titleColor: "0 0% 9%",
  descriptionColor: "0 0% 45%",
  metaColor: "0 0% 55%",
  shadowIntensity: 10,
  shadowDirection: 4,
};

const STORAGE_KEY = "provenai_learning_path_card_settings";
const PRESETS_KEY = "provenai_learning_path_card_presets";

// Built-in presets
export interface LearningPathCardPreset {
  id: string;
  name: string;
  settings: LearningPathCardSettings;
  isBuiltIn?: boolean;
}

const BUILT_IN_PRESETS: LearningPathCardPreset[] = [
  {
    id: "default",
    name: "Default (Plain)",
    isBuiltIn: true,
    settings: DEFAULT_LEARNING_PATH_CARD_SETTINGS,
  },
  {
    id: "dark-mode",
    name: "Dark Mode (Plain)",
    isBuiltIn: true,
    settings: {
      ...DEFAULT_LEARNING_PATH_CARD_SETTINGS,
      cardBackground: "0 0% 9%",
      cardBorder: "0 0% 20%",
      titleColor: "0 0% 98%",
      descriptionColor: "0 0% 70%",
      metaColor: "0 0% 55%",
    },
  },
  {
    id: "soft-blue",
    name: "Soft Blue (Plain)",
    isBuiltIn: true,
    settings: {
      ...DEFAULT_LEARNING_PATH_CARD_SETTINGS,
      cardBackground: "210 40% 98%",
      cardBorder: "210 30% 88%",
      titleColor: "210 40% 20%",
      descriptionColor: "210 20% 45%",
      metaColor: "210 15% 55%",
    },
  },
  {
    id: "gradient-dark",
    name: "Dark Gradient",
    isBuiltIn: true,
    settings: {
      ...DEFAULT_LEARNING_PATH_CARD_SETTINGS,
      backgroundMode: 'gradient',
      textTheme: 'light',
      gradientFrom: '#1a1a2e',
      gradientVia: '#16213e',
      gradientTo: '#0f3460',
    },
  },
  {
    id: "gradient-purple",
    name: "Purple Gradient",
    isBuiltIn: true,
    settings: {
      ...DEFAULT_LEARNING_PATH_CARD_SETTINGS,
      backgroundMode: 'gradient',
      textTheme: 'light',
      gradientFrom: '#667eea',
      gradientVia: '#764ba2',
      gradientTo: '#6B8DD6',
    },
  },
];

// Get current settings
export function getLearningPathCardSettings(): LearningPathCardSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_LEARNING_PATH_CARD_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_LEARNING_PATH_CARD_SETTINGS;
}

// Save settings
export function saveLearningPathCardSettings(settings: LearningPathCardSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Get all presets (built-in + custom)
export function getAllLearningPathPresets(): LearningPathCardPreset[] {
  const custom = getCustomPresets();
  return [...BUILT_IN_PRESETS, ...custom];
}

// Get custom presets only
function getCustomPresets(): LearningPathCardPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save a custom preset
export function saveCustomLearningPathPreset(name: string, settings: LearningPathCardSettings): void {
  const presets = getCustomPresets();
  presets.push({
    id: `custom-${Date.now()}`,
    name,
    settings,
    isBuiltIn: false,
  });
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

// Delete a custom preset
export function deleteCustomLearningPathPreset(id: string): void {
  const presets = getCustomPresets().filter(p => p.id !== id);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

// Utility: HSL to CSS string
export function hslToCss(hsl: string): string {
  return `hsl(${hsl})`;
}

// Utility: Generate shadow CSS from intensity and direction
export function shadowFromIntensity(intensity: number, direction: ShadowDirection): string {
  if (intensity === 0) return "none";
  
  const opacity = Math.round((intensity / 100) * 0.3 * 100) / 100;
  const blur = Math.round((intensity / 100) * 20);
  const spread = Math.round((intensity / 100) * 4);
  
  // Direction offsets (x, y)
  const offsets: Record<ShadowDirection, [number, number]> = {
    [-1]: [0, 0], // Centered
    0: [0, -1], // Top
    1: [1, -1], // Top Right
    2: [1, 0], // Right
    3: [1, 1], // Bottom Right
    4: [0, 1], // Bottom
    5: [-1, 1], // Bottom Left
    6: [-1, 0], // Left
    7: [-1, -1], // Top Left
  };
  
  const [dx, dy] = offsets[direction];
  const xOffset = dx * Math.round((intensity / 100) * 8);
  const yOffset = dy * Math.round((intensity / 100) * 8);
  
  return `${xOffset}px ${yOffset}px ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`;
}
