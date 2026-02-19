/**
 * Platform Updates Store — D1-backed via app_visual_config key-value table.
 * In-memory cache: loadPlatformUpdates() fetches once, getPlatformUpdates() reads cache.
 */

const CONFIG_KEY = "platform_updates";

export interface PlatformUpdate {
  id: string;
  /** Short label chip — e.g. "NEW", "UPDATED", "BETA", "FIX" */
  label: string;
  /** Main text shown in the ticker row */
  title: string;
  /** Where clicking the row navigates */
  href: string;
  /** ISO date string for sorting / display */
  date: string;
}

/** Available link targets for the href dropdown */
export const UPDATE_LINK_TARGETS = [
  { label: "AI Foundations Course", value: "/learn/courses/ai-foundations" },
  { label: "Mastering ChatGPT Course", value: "/learn/courses/mastering-chatgpt" },
  { label: "Prompt Engineering Course", value: "/learn/courses/prompt-engineering-basics" },
  { label: "AI Email Course", value: "/learn/courses/ai-email" },
  { label: "AI Safety Course", value: "/learn/courses/ai-safety" },
  { label: "Free Courses", value: "/learn/courses" },
  { label: "Guides", value: "/learn/guides" },
  { label: "Core Tools", value: "/core-tools" },
  { label: "Tools Directory", value: "/tools/directory" },
  { label: "Glossary", value: "/glossary" },
  { label: "Monday — Foundations", value: "/daily/monday" },
  { label: "Tuesday — Tools & Tips", value: "/daily/tuesday" },
  { label: "Wednesday — Work & Wealth", value: "/daily/wednesday" },
  { label: "Thursday — AI News", value: "/daily/thursday" },
  { label: "Friday — Q&A", value: "/daily/friday" },
  { label: "Support", value: "/support" },
];

/** Label presets for quick selection */
export const LABEL_PRESETS = ["NEW", "UPDATED", "BETA", "FIX", "COMING SOON", "LIVE"];

const DEFAULT_UPDATES: PlatformUpdate[] = [
  {
    id: "pu-1",
    label: "UPDATED",
    title: "AI Foundations for Professionals",
    href: "/learn/courses/ai-foundations",
    date: new Date().toISOString(),
  },
  {
    id: "pu-2",
    label: "NEW",
    title: "Tools Directory — latest additions",
    href: "/tools/directory",
    date: new Date().toISOString(),
  },
];

// ---- In-memory cache ----
let updatesCache: PlatformUpdate[] = [...DEFAULT_UPDATES];
let cacheLoaded = false;

/** Load from D1 — call once on app init */
export async function loadPlatformUpdates(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const res = await fetch(`/api/visual-config?key=${CONFIG_KEY}`);
    if (res.ok) {
      const json = await res.json() as { ok: boolean; value: PlatformUpdate[] | null };
      if (json.ok && Array.isArray(json.value)) {
        updatesCache = json.value;
      }
    }
  } catch (err) {
    console.error('[platformUpdatesStore] load failed:', err);
  }
  cacheLoaded = true;
}

/** Sync read from cache */
export function getPlatformUpdates(): PlatformUpdate[] {
  return updatesCache;
}

/** Save to D1 + update cache */
export async function savePlatformUpdates(updates: PlatformUpdate[]): Promise<void> {
  updatesCache = updates;
  try {
    await fetch('/api/admin/visual-config', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: CONFIG_KEY, value: updates }),
    });
  } catch (err) {
    console.error('[platformUpdatesStore] save failed:', err);
  }
}

/** Reset to defaults */
export async function resetPlatformUpdates(): Promise<void> {
  await savePlatformUpdates([...DEFAULT_UPDATES]);
}

/** Generate a unique ID */
export function newUpdateId(): string {
  return `pu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
