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
  featuredSlots: [FeaturedSlot, FeaturedSlot];
}

const DEFAULT_SETTINGS: ControlCentreSettings = {
  featuredSlots: [
    { courseId: "ai-foundations", thumbnailOverride: null, titleOverride: null, descriptionOverride: null },
    { courseId: "prompt-engineering-basics", thumbnailOverride: null, titleOverride: null, descriptionOverride: null },
  ],
};

export function getControlCentreSettings(): ControlCentreSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ControlCentreSettings;
      // Ensure 2 slots always exist
      if (parsed.featuredSlots?.length === 2) return parsed;
    }
  } catch { /* */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveControlCentreSettings(settings: ControlCentreSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* */ }
}

export function resetControlCentreSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* */ }
}
