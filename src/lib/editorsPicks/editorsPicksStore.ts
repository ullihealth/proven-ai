/**
 * Top Topics Store — localStorage persistence for the 2 editorial picks
 * shown on the Control Centre. Same pattern as coursesStore.
 */

const STORAGE_KEY = "provenai_editors_picks";

export interface EditorPick {
  id: string;
  headline: string;
  summary: string;
  meta: string;
  href: string;
  thumbnailUrl: string; // base64 data URL or empty
  tag?: string; // authority tag e.g. "Founder Recommended", "Strategic"
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

function init(): void {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PICKS));
  }
}

export function getEditorsPicks(): EditorPick[] {
  init();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PICKS;
  } catch {
    return DEFAULT_PICKS;
  }
}

export function saveEditorsPicks(picks: EditorPick[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
    return true;
  } catch (e) {
    console.error('[editorsPicksStore] Save failed — localStorage quota likely exceeded:', e);
    return false;
  }
}

export function saveEditorPick(pick: EditorPick): boolean {
  const picks = getEditorsPicks();
  const idx = picks.findIndex((p) => p.id === pick.id);
  if (idx >= 0) {
    picks[idx] = pick;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
    return true;
  } catch (e) {
    console.error('[editorsPicksStore] Save failed — localStorage quota likely exceeded:', e);
    return false;
  }
}
