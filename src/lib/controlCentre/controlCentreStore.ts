/**
 * Control Centre Settings Store — D1-backed via app_visual_config key-value table.
 * In-memory cache: loadControlCentreSettings() fetches once, get reads cache.
 */

const CONFIG_KEY = "control_centre";

export interface FeaturedSlot {
  courseId: string;
  thumbnailOverride: string | null;
  titleOverride: string | null;
  descriptionOverride: string | null;
}

export interface ControlCentreSettings {
  featuredSlots: [FeaturedSlot, FeaturedSlot, FeaturedSlot];
}

const EMPTY_SLOT: FeaturedSlot = { courseId: "", thumbnailOverride: null, titleOverride: null, descriptionOverride: null };

const DEFAULT_SETTINGS: ControlCentreSettings = {
  featuredSlots: [
    { courseId: "ai-foundations", thumbnailOverride: null, titleOverride: null, descriptionOverride: null },
    { courseId: "prompt-engineering-basics", thumbnailOverride: null, titleOverride: null, descriptionOverride: null },
    { ...EMPTY_SLOT },
  ],
};

// ---- In-memory cache ----
let settingsCache: ControlCentreSettings = { ...DEFAULT_SETTINGS, featuredSlots: [...DEFAULT_SETTINGS.featuredSlots] };
let cacheLoaded = false;

/** Load from D1 — call once on app init */
export async function loadControlCentreSettings(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const res = await fetch(`/api/visual-config?key=${CONFIG_KEY}`);
    if (res.ok) {
      const json = await res.json() as { ok: boolean; value: ControlCentreSettings | null };
      if (json.ok && json.value && Array.isArray(json.value.featuredSlots)) {
        // Pad to 3 slots if fewer stored
        while (json.value.featuredSlots.length < 3) {
          json.value.featuredSlots.push({ ...EMPTY_SLOT });
        }
        settingsCache = json.value;
      }
    }
  } catch (err) {
    console.error('[controlCentreStore] load failed:', err);
  }
  cacheLoaded = true;
}

/** Sync read from cache */
export function getControlCentreSettings(): ControlCentreSettings {
  return settingsCache;
}

/** Save to D1 + update cache */
export async function saveControlCentreSettings(settings: ControlCentreSettings): Promise<boolean> {
  const prev = settingsCache;
  settingsCache = settings;
  try {
    const res = await fetch('/api/admin/visual-config', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: CONFIG_KEY, value: settings }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`);
      console.error('[controlCentreStore] save rejected:', res.status, text);
      settingsCache = prev; // revert cache
      return false;
    }
    return true;
  } catch (err) {
    console.error('[controlCentreStore] save failed:', err);
    settingsCache = prev; // revert cache
    return false;
  }
}

/** Reset to defaults */
export async function resetControlCentreSettings(): Promise<void> {
  await saveControlCentreSettings({ ...DEFAULT_SETTINGS, featuredSlots: [...DEFAULT_SETTINGS.featuredSlots] });
}
