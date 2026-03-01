import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Play } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getUserPreference, saveUserPreference } from "@/lib/storage/userPreferencesStore";

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

export interface BriefingItemData {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  commentary: string | null;
  category: string;
  categoryLabel: string;
  sourceName: string;
  publishedAt: string | null;
  fetchedAt: string;
}

export interface IntelConfig {
  INTEL_SUMMARY_MODE: string;
  INTEL_ARTICLE_VIEW: string;
  INTEL_COMMENTARY: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   Fixed 4 categories — tabs
   ═══════════════════════════════════════════════════════════════════════ */

const INTEL_CATEGORIES = ["ai_software", "ai_robotics", "ai_business", "ai_medicine"] as const;
type IntelCategory = (typeof INTEL_CATEGORIES)[number];

/** Tab display labels — full words, no abbreviations */
const TAB_LABELS: Record<IntelCategory, string> = {
  ai_software: "News",
  ai_robotics: "Robotics",
  ai_business: "Business",
  ai_medicine: "Health",
};

/** Active tab accent colours (2px bottom border) */
const TAB_ACCENT: Record<IntelCategory, string> = {
  ai_software: "#EAB308",   // yellow
  ai_robotics: "#7C3AED",   // purple
  ai_business: "#2563EB",   // mid-dark blue
  ai_medicine: "#16A34A",   // green
};

/* ═══════════════════════════════════════════════════════════════════════
   Density modes (D1-backed via user preferences)
   ═══════════════════════════════════════════════════════════════════════ */

export type DensityMode = "standard" | "compact" | "headlines";

const DENSITY_KEY = "intel_density";

function getDensity(): DensityMode {
  const stored = getUserPreference<string>(DENSITY_KEY);
  if (stored === "standard" || stored === "compact" || stored === "headlines") return stored;
  return "standard";
}

function saveDensity(mode: DensityMode) {
  saveUserPreference(DENSITY_KEY, mode);
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

export function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "Yesterday";
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch { return ""; }
}

function groupByCategory(items: BriefingItemData[]) {
  const map: Record<IntelCategory, BriefingItemData[]> = {
    ai_software: [], ai_robotics: [], ai_medicine: [], ai_business: [],
  };
  for (const item of items) {
    const cat = item.category as IntelCategory;
    if (cat in map) map[cat].push(item);
  }
  return map;
}

/* ═══════════════════════════════════════════════════════════════════════
   Data hooks
   ═══════════════════════════════════════════════════════════════════════ */

let _cache: { items: BriefingItemData[]; ts: number } | null = null;

export function useBriefingItems(limit = 20) {
  const [items, setItems] = useState<BriefingItemData[]>(_cache?.items || []);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_cache && Date.now() - _cache.ts < 60_000) {
      setItems(_cache.items); setLoading(false); return;
    }
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch(`/api/briefing?limit=${limit}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const fetched = data.items || [];
        _cache = { items: fetched, ts: Date.now() };
        setItems(fetched);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally { setLoading(false); }
    })();
  }, [limit]);

  const refresh = useCallback(() => {
    _cache = null;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch(`/api/briefing?limit=${limit}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const fetched = data.items || [];
        _cache = { items: fetched, ts: Date.now() };
        setItems(fetched); setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally { setLoading(false); }
    })();
  }, [limit]);

  return { items, loading, error, refresh };
}

let _configCache: { config: IntelConfig; ts: number } | null = null;

function useIntelConfig() {
  const defaults: IntelConfig = { INTEL_SUMMARY_MODE: "standard", INTEL_ITEMS_PER_CATEGORY: "2", INTEL_ARTICLE_VIEW: "on", INTEL_COMMENTARY: "off" };
  const [config, setConfig] = useState<IntelConfig>(_configCache?.config || defaults);

  useEffect(() => {
    if (_configCache && Date.now() - _configCache.ts < 300_000) {
      setConfig(_configCache.config); return;
    }
    (async () => {
      try {
        const resp = await fetch("/api/briefing/config");
        if (!resp.ok) return;
        const data = await resp.json();
        const c = { ...defaults, ...data.config } as IntelConfig;
        _configCache = { config: c, ts: Date.now() };
        setConfig(c);
      } catch { /* use defaults */ }
    })();
  }, []);

  return config;
}

/* ═══════════════════════════════════════════════════════════════════════
   UI Components
   ═══════════════════════════════════════════════════════════════════════ */

/** Single article row — no category badge (tab defines context) */
const ArticleRow = ({
  item,
  showCommentary,
}: {
  item: BriefingItemData;
  showCommentary: boolean;
}) => {
  const linkTo = `/intelligence/${item.id}`;

  return (
    <Link
      to={linkTo}
      className="group block py-2.5 transition-colors hover:bg-[var(--cc-hover-row)] -mx-2 px-2 rounded-sm cursor-pointer"
    >
      <span className="text-[14px] font-bold text-[var(--cc-text)] leading-[1.2] line-clamp-2 group-hover:underline underline-offset-2 block">
        {item.title}
      </span>
      {item.summary && (
        <span className="text-[11.5px] text-[var(--cc-text-muted)] leading-snug mt-0.5 block line-clamp-2">
          {item.summary}
        </span>
      )}
      {showCommentary && item.commentary && (
        <span className="text-[11.5px] text-[#2563EB]/80 italic leading-snug mt-0.5 block line-clamp-2">
          Why this matters: {item.commentary}
        </span>
      )}
      <span className="text-[10.5px] text-[var(--cc-text-subtle)] block mt-0.5">
        {item.sourceName}
        {item.publishedAt && <> · {formatRelativeDate(item.publishedAt)}</>}
      </span>
    </Link>
  );
};

/** Category tabs */
const CategoryTabs = ({
  active,
  onChange,
  counts,
}: {
  active: IntelCategory;
  onChange: (cat: IntelCategory) => void;
  counts: Record<IntelCategory, number>;
}) => (
  <div className="flex items-center gap-0 border-b border-[var(--cc-border)]">
    {INTEL_CATEGORIES.map((cat) => {
      const isActive = cat === active;
      const hasItems = counts[cat] > 0;
      return (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          disabled={!hasItems}
          className={`relative px-2.5 py-2 text-[13px] tracking-[0.02em] transition-colors ${
            isActive
              ? "font-semibold text-[var(--cc-text)]"
              : hasItems
                ? "font-medium text-[var(--cc-text-muted)] hover:text-[var(--cc-text)]"
                : "font-medium text-[var(--cc-border)] cursor-default"
          }`}
        >
          {TAB_LABELS[cat]}
          {isActive && (
            <span
              className="absolute bottom-0 left-2.5 right-2.5 h-[2px]"
              style={{ backgroundColor: TAB_ACCENT[cat] }}
            />
          )}
        </button>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   Main export — AIIntelligence (tabbed single-dataset model)
   ═══════════════════════════════════════════════════════════════════════ */

export const AIIntelligence = () => {
  const { items, loading, error, refresh } = useBriefingItems(60);
  const config = useIntelConfig();
  const { isAdmin } = useAuth();
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<IntelCategory>("ai_software");

  const grouped = groupByCategory(items);
  const showCommentary = config.INTEL_COMMENTARY === "on";

  // Counts for tab badges / disabled state
  const counts = INTEL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = grouped[cat].length;
    return acc;
  }, {} as Record<IntelCategory, number>);

  // Active tab's items — already sorted by API, take first 5
  const activeItems = grouped[activeTab].slice(0, 5);

  const handleRun = async () => {
    try {
      setRunning(true);
      await fetch("/api/admin/briefing/run", { method: "POST" });
      setTimeout(() => refresh(), 1500);
    } catch { /* silent */ } finally { setRunning(false); }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="h-3.5 w-3.5 text-[var(--cc-text-subtle)] animate-spin mx-auto" />
      </div>
    );
  }

  const hasAny = INTEL_CATEGORIES.some((cat) => grouped[cat].length > 0);

  return (
    <div className="bg-[var(--cc-card)] -mx-2 px-3 py-3 rounded min-h-[200px]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[16px] font-bold text-[var(--cc-text)] uppercase tracking-[0.04em]">
          AI News Desk
        </h3>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-[var(--cc-text-muted)] hover:text-[var(--cc-text)] hover:bg-[var(--cc-hover)] transition-colors disabled:opacity-30"
            >
              {running ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Play className="h-2.5 w-2.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <CategoryTabs active={activeTab} onChange={setActiveTab} counts={counts} />

      {/* Feed content — single dataset, no sub-scroll */}
      {!hasAny && !error && (
        <div className="py-6 text-center">
          <p className="text-[13px] text-[var(--cc-text-muted)]">No intelligence items available.</p>
        </div>
      )}

      {activeItems.length > 0 && (
        <div className="divide-y divide-[var(--cc-border)] mt-0.5">
          {activeItems.map((item) => (
            <ArticleRow
              key={item.id}
              item={item}
              showCommentary={showCommentary}
            />
          ))}
        </div>
      )}

      {hasAny && activeItems.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-[13px] text-[var(--cc-text-muted)]">No items in this category yet.</p>
        </div>
      )}
    </div>
  );
};

/* Legacy exports */
export const AISignals = AIIntelligence;
export const IntelligenceSection = () => null;
export const FeaturedIntelligence = () => null;
export const BriefingStatusBar = () => null;
export const IntelligenceBriefing = () => null;
