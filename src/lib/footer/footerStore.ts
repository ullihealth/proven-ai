/**
 * Footer Config Store — D1-backed via app_visual_config key-value table.
 * In-memory cache: loadFooterConfig() fetches once, getFooterConfig() reads cache.
 */

const CONFIG_KEY = "footer_config";

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

// ---- In-memory cache ----
let configCache: FooterConfig = { ...DEFAULT_CONFIG };
let cacheLoaded = false;

/** Load from D1 — call once on app init */
export async function loadFooterConfig(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const res = await fetch(`/api/visual-config?key=${CONFIG_KEY}`);
    if (res.ok) {
      const json = await res.json() as { ok: boolean; value: Partial<FooterConfig> | null };
      if (json.ok && json.value) {
        configCache = {
          courses: json.value.courses ?? { ...DEFAULT_CONFIG.courses },
          publications: json.value.publications ?? { ...DEFAULT_CONFIG.publications },
          apps: json.value.apps ?? { ...DEFAULT_CONFIG.apps },
          social: json.value.social ?? {},
        };
      }
    }
  } catch (err) {
    console.error('[footerStore] load failed:', err);
  }
  cacheLoaded = true;
}

/** Sync read from cache */
export function getFooterConfig(): FooterConfig {
  return configCache;
}

/** Save to D1 + update cache (enforces max items) */
export async function saveFooterConfig(config: FooterConfig): Promise<void> {
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
  const prev = configCache;
  configCache = clamped;
  try {
    const res = await fetch('/api/admin/visual-config', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: CONFIG_KEY, value: clamped }),
    });
    if (!res.ok) {
      console.error('[footerStore] save rejected:', res.status);
      configCache = prev;
    }
  } catch (err) {
    console.error('[footerStore] save failed:', err);
    configCache = prev;
  }
}

/** Reset to defaults, save to D1, update cache */
export async function resetFooterConfig(): Promise<void> {
  await saveFooterConfig({ ...DEFAULT_CONFIG });
}

/** Heading-level routes for each dynamic section */
export const SECTION_INDEX_ROUTES = {
  courses: "/learn/courses",
  publications: "/learn/guides", // TODO: replace when /publications route exists
  apps: "/core-tools", // TODO: replace when /apps route exists
} as const;
