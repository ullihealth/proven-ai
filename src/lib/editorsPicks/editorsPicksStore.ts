/**
 * Top Topics Store — D1-backed via app_visual_config key-value table.
 * In-memory cache: loadEditorsPicks() fetches once, getEditorsPicks() reads cache.
 */

const CONFIG_KEY = "editors_picks";

export interface EditorPick {
  id: string;
  headline: string;
  summary: string;
  meta: string;
  href: string;
  thumbnailUrl: string;
  tag?: string;
}

const DEFAULT_PICKS: EditorPick[] = [
  {
    id: "pick-1",
    headline: "Why Every Professional Needs an AI Strategy in 2026",
    summary:
      "The shift from experimentation to execution — and what it means for your career.",
    meta: "5 min read",
    href: "/daily/monday",
    thumbnailUrl: "",
    tag: "Founder Recommended",
  },
  {
    id: "pick-2",
    headline: "Prompt Engineering Is Dead. Here's What Replaced It.",
    summary:
      "Agentic workflows are rewriting the rules. A concise guide to the new paradigm.",
    meta: "4 min read",
    href: "/daily/tuesday",
    thumbnailUrl: "",
    tag: "Strategic",
  },
];

/** Authority tag presets for Top Topics */
export const TAG_PRESETS = [
  "Founder Recommended",
  "Strategic",
  "Must Understand",
  "Business Critical",
  "Most Watched",
] as const;

/** Available link targets for the pick href dropdown */
export const LINK_TARGETS = [
  { label: "Monday — Foundations", value: "/daily/monday" },
  { label: "Tuesday — Tools & Tips", value: "/daily/tuesday" },
  { label: "Wednesday — Work & Wealth", value: "/daily/wednesday" },
  { label: "Thursday — AI News & Updates", value: "/daily/thursday" },
  { label: "Friday — Feedback & Questions", value: "/daily/friday" },
  { label: "AI Foundations Course", value: "/learn/courses/ai-foundations" },
  { label: "Mastering ChatGPT Course", value: "/learn/courses/mastering-chatgpt" },
  { label: "Free Courses", value: "/learn/courses" },
  { label: "Guides", value: "/learn/guides" },
  { label: "Core Tools", value: "/core-tools" },
  { label: "Glossary", value: "/glossary" },
];

// ---- In-memory cache ----
let picksCache: EditorPick[] = [...DEFAULT_PICKS];
let cacheLoaded = false;

/** Load from D1 — call once on app init */
export async function loadEditorsPicks(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const res = await fetch(`/api/visual-config?key=${CONFIG_KEY}`);
    if (res.ok) {
      const json = await res.json() as { ok: boolean; value: EditorPick[] | null };
      if (json.ok && Array.isArray(json.value)) {
        picksCache = json.value;
      }
    }
  } catch (err) {
    console.error('[editorsPicksStore] load failed:', err);
  }
  cacheLoaded = true;
}

/** Sync read from cache */
export function getEditorsPicks(): EditorPick[] {
  return picksCache;
}

/** Save all picks to D1 + update cache */
export async function saveEditorsPicks(picks: EditorPick[]): Promise<boolean> {
  const prev = picksCache;
  picksCache = picks;
  try {
    const res = await fetch('/api/admin/visual-config', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: CONFIG_KEY, value: picks }),
    });
    if (!res.ok) {
      console.error('[editorsPicksStore] save rejected:', res.status);
      picksCache = prev;
      return false;
    }
    return true;
  } catch (err) {
    console.error('[editorsPicksStore] save failed:', err);
    picksCache = prev;
    return false;
  }
}

/** Save a single pick (merge into array) */
export async function saveEditorPick(pick: EditorPick): Promise<boolean> {
  const picks = [...picksCache];
  const idx = picks.findIndex((p) => p.id === pick.id);
  if (idx >= 0) {
    picks[idx] = pick;
  }
  return saveEditorsPicks(picks);
}

/** Reset to defaults, save to D1, update cache */
export async function resetEditorsPicks(): Promise<void> {
  await saveEditorsPicks([...DEFAULT_PICKS]);
}
