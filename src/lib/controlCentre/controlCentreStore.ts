/**
 * Control Centre Settings Store (localStorage)
 *
 * Stores admin-configurable settings for the Control Centre dashboard:
 * - Featured course slot 1 & 2 (course ID from catalog)
 * - Optional thumbnail/video override per slot (base64 image or embed URL)
 * - Optional custom title override per slot
 */

const STORAGE_KEY = "provenai_control_centre";

export interface FeaturedSlot {
  /** Course ID from coursesData — empty string means "none" */
  courseId: string;
  /** Override thumbnail (base64 data-URL from uploaded image) */
  thumbnailOverride: string | null;
  /** Override title shown on the card */
  titleOverride: string | null;
  /** Optional subtitle/description override */
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

export function getControlCentreSettings(): ControlCentreSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ControlCentreSettings;
      if (Array.isArray(parsed.featuredSlots)) {
        // Migrate: pad to 3 slots if stored config only had 2
        while (parsed.featuredSlots.length < 3) {
          parsed.featuredSlots.push({ ...EMPTY_SLOT });
        }
        return parsed;
      }
    }
  } catch { /* */ }
  return { ...DEFAULT_SETTINGS, featuredSlots: [...DEFAULT_SETTINGS.featuredSlots] };
}

export function saveControlCentreSettings(settings: ControlCentreSettings): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('[controlCentreStore] Save failed — localStorage quota likely exceeded:', e);
    return false;
  }
}

export function resetControlCentreSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* */ }
}
