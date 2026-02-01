import { AppColorSettings, AppColorPreset, DEFAULT_APP_COLORS, BUILT_IN_PRESETS } from "./types";

const APP_COLORS_KEY = "provenai_app_colors";
const APP_PRESETS_KEY = "provenai_app_presets";

export function getAppColors(): AppColorSettings {
  const stored = localStorage.getItem(APP_COLORS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_APP_COLORS;
    }
  }
  return DEFAULT_APP_COLORS;
}

export function saveAppColors(settings: AppColorSettings): void {
  localStorage.setItem(APP_COLORS_KEY, JSON.stringify(settings));
  applyColorsToDocument(settings);
}

export function getCustomPresets(): AppColorPreset[] {
  const stored = localStorage.getItem(APP_PRESETS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function getAllPresets(): AppColorPreset[] {
  return [...BUILT_IN_PRESETS, ...getCustomPresets()];
}

export function saveCustomPreset(name: string, settings: AppColorSettings): AppColorPreset {
  const preset: AppColorPreset = {
    id: `custom_${Date.now()}`,
    name,
    settings,
    createdAt: Date.now(),
  };
  const presets = getCustomPresets();
  presets.push(preset);
  localStorage.setItem(APP_PRESETS_KEY, JSON.stringify(presets));
  return preset;
}

export function deleteCustomPreset(id: string): void {
  const presets = getCustomPresets().filter((p) => p.id !== id);
  localStorage.setItem(APP_PRESETS_KEY, JSON.stringify(presets));
}

export function applyColorsToDocument(settings: AppColorSettings): void {
  const root = document.documentElement;
  root.style.setProperty("--sidebar-background", settings.sidebarBackground);
  root.style.setProperty("--sidebar-border", settings.sidebarBorder);
  root.style.setProperty("--pai-topbar-bg", settings.headerBackground);
  // Custom property for header border
  root.style.setProperty("--header-border", settings.headerBorder);
}

export function initializeAppColors(): void {
  const colors = getAppColors();
  applyColorsToDocument(colors);
}
