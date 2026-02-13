/**
 * Platform Updates Store — localStorage persistence for admin-configurable
 * ticker items shown in the Platform Updates section of the Control Centre.
 *
 * Each item has a label ("NEW", "UPDATED", etc.), title, href, and date.
 * Admin can freely add/remove/reorder items. Newest items appear first.
 */

const STORAGE_KEY = "provenai_platform_updates";

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

function init(): void {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_UPDATES));
  }
}

export function getPlatformUpdates(): PlatformUpdate[] {
  init();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as PlatformUpdate[];
  } catch { /* */ }
  return [...DEFAULT_UPDATES];
}

export function savePlatformUpdates(updates: PlatformUpdate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
  } catch { /* */ }
}

export function resetPlatformUpdates(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_UPDATES));
}

/** Generate a unique ID */
export function newUpdateId(): string {
  return `pu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
