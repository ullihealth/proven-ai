/**
 * Footer Config Store — localStorage persistence for the 6-column
 * institutional footer. Static columns (Platform / Intelligence / Company)
 * are hardcoded. Dynamic columns (Courses / Publications / Apps) and
 * social links are admin-configurable.
 */

const STORAGE_KEY = "provenai_footer_config";

export type SectionMode = "index_only" | "show_selected";

export interface FooterSocialLinks {
  facebook?: string;
  youtube?: string;
  x?: string;
  linkedin?: string;
}

export interface FooterSelectedItem {
  id: string;
  label: string;
  href: string;
}

export interface FooterConfig {
  courses: {
    mode: SectionMode;
    selectedItems: FooterSelectedItem[];
  };
  publications: {
    mode: SectionMode;
    selectedItems: FooterSelectedItem[];
  };
  apps: {
    mode: SectionMode;
    selectedItems: FooterSelectedItem[];
  };
  social: FooterSocialLinks;
}

const MAX_ITEMS = 5;

const DEFAULT_CONFIG: FooterConfig = {
  courses: { mode: "index_only", selectedItems: [] },
  publications: { mode: "index_only", selectedItems: [] },
  apps: { mode: "index_only", selectedItems: [] },
  social: {},
};

/** Read footer config from localStorage (returns defaults if missing/corrupt) */
export function getFooterConfig(): FooterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<FooterConfig>;
    return {
      courses: parsed.courses ?? { ...DEFAULT_CONFIG.courses },
      publications: parsed.publications ?? { ...DEFAULT_CONFIG.publications },
      apps: parsed.apps ?? { ...DEFAULT_CONFIG.apps },
      social: parsed.social ?? {},
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/** Save footer config to localStorage (enforces max items) */
export function saveFooterConfig(config: FooterConfig): void {
  const clamped: FooterConfig = {
    courses: {
      mode: config.courses.mode,
      selectedItems: config.courses.selectedItems.slice(0, MAX_ITEMS),
    },
    publications: {
      mode: config.publications.mode,
      selectedItems: config.publications.selectedItems.slice(0, MAX_ITEMS),
    },
    apps: {
      mode: config.apps.mode,
      selectedItems: config.apps.selectedItems.slice(0, MAX_ITEMS),
    },
    social: config.social,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
}

/** Heading-level routes for each dynamic section */
export const SECTION_INDEX_ROUTES = {
  courses: "/learn/courses",
  publications: "/learn/guides", // TODO: replace when /publications route exists
  apps: "/core-tools", // TODO: replace when /apps route exists
} as const;
