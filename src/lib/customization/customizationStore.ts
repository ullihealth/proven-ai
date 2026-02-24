/**
 * App Colors Store — D1-backed via app_visual_config key-value table.
 * In-memory cache: loadAppColors() fetches once, getAppColors() reads cache.
 */
import { AppColorSettings, AppColorPreset, DEFAULT_APP_COLORS, BUILT_IN_PRESETS } from "./types";

const COLORS_CONFIG_KEY = "app_colors";
const PRESETS_CONFIG_KEY = "app_color_presets";

// ---- In-memory caches ----
let colorsCache: AppColorSettings = { ...DEFAULT_APP_COLORS };
let presetsCache: AppColorPreset[] = [];
let cacheLoaded = false;

/** Load from D1 — call once on app init */
export async function loadAppColors(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const [colorsRes, presetsRes] = await Promise.all([
      fetch(`/api/visual-config?key=${COLORS_CONFIG_KEY}`),
      fetch(`/api/visual-config?key=${PRESETS_CONFIG_KEY}`),
    ]);
    if (colorsRes.ok) {
      const json = (await colorsRes.json()) as { ok: boolean; value: AppColorSettings | null };
      if (json.ok && json.value) colorsCache = json.value;
    }
    if (presetsRes.ok) {
      const json = (await presetsRes.json()) as { ok: boolean; value: AppColorPreset[] | null };
      if (json.ok && Array.isArray(json.value)) presetsCache = json.value;
    }
  } catch (err) {
    console.error("[appColors] load failed:", err);
  }
  cacheLoaded = true;
}

/** Sync read from cache */
export function getAppColors(): AppColorSettings {
  return colorsCache;
}

/** Save to D1 + update cache + apply CSS vars */
export async function saveAppColors(settings: AppColorSettings): Promise<void> {
  const prevColors = colorsCache;
  colorsCache = settings;
  applyColorsToDocument(settings);
  try {
    const res = await fetch("/api/admin/visual-config", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: COLORS_CONFIG_KEY, value: settings }),
    });
    if (!res.ok) {
      console.error("[appColors] save rejected:", res.status);
      colorsCache = prevColors;
      applyColorsToDocument(prevColors);
    }
  } catch (err) {
    console.error("[appColors] save failed:", err);
    colorsCache = prevColors;
    applyColorsToDocument(prevColors);
  }
}

/** Sync read custom presets from cache */
export function getCustomPresets(): AppColorPreset[] {
  return presetsCache;
}

export function getAllPresets(): AppColorPreset[] {
  return [...BUILT_IN_PRESETS, ...presetsCache];
}

/** Save a new custom preset to D1 + update cache */
export async function saveCustomPreset(name: string, settings: AppColorSettings): Promise<AppColorPreset> {
  const preset: AppColorPreset = {
    id: `custom_${Date.now()}`,
    name,
    settings,
    createdAt: Date.now(),
  };
  presetsCache = [...presetsCache, preset];
  await _persistPresets();
  return preset;
}

/** Delete a custom preset from D1 + update cache */
export async function deleteCustomPreset(id: string): Promise<void> {
  presetsCache = presetsCache.filter((p) => p.id !== id);
  await _persistPresets();
}

async function _persistPresets(): Promise<void> {
  try {
    const res = await fetch("/api/admin/visual-config", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: PRESETS_CONFIG_KEY, value: presetsCache }),
    });
    if (!res.ok) console.error("[appColors] preset save rejected:", res.status);
  } catch (err) {
    console.error("[appColors] preset save failed:", err);
  }
}

export function applyColorsToDocument(settings: AppColorSettings): void {
  const root = document.documentElement;
  root.style.setProperty("--sidebar-background", settings.sidebarBackground);
  root.style.setProperty("--sidebar-border", settings.sidebarBorder);
  root.style.setProperty("--pai-topbar-bg", settings.headerBackground);
  root.style.setProperty("--header-border", settings.headerBorder);
}

/**
 * Initialize app colors — async, loads from D1 then applies CSS vars.
 * Called from main.tsx before first render.
 */
export async function initializeAppColors(): Promise<void> {
  await loadAppColors();
  applyColorsToDocument(colorsCache);
}
