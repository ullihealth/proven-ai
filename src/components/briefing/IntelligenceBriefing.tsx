import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Play, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
   Fixed 4 categories (locked order)
   ═══════════════════════════════════════════════════════════════════════ */

const INTEL_CATEGORIES = ["ai_news", "ai_robotics", "ai_medicine", "ai_business"] as const;
type IntelCategory = (typeof INTEL_CATEGORIES)[number];

const CATEGORY_DISPLAY: Record<string, string> = {
  ai_news: "AI NEWS",
  ai_robotics: "AI ROBOTICS",
  ai_medicine: "AI MEDICINE",
  ai_business: "AI BUSINESS",
};

const CATEGORY_PILL: Record<string, { bg: string; text: string }> = {
  ai_news: { bg: "#2563EB", text: "#FFFFFF" },
  ai_robotics: { bg: "#7C3AED", text: "#FFFFFF" },
  ai_medicine: { bg: "#DC2626", text: "#FFFFFF" },
  ai_business: { bg: "#059669", text: "#FFFFFF" },
};

/* ═══════════════════════════════════════════════════════════════════════
   Density modes (localStorage)
   ═══════════════════════════════════════════════════════════════════════ */

export type DensityMode = "standard" | "compact" | "headlines";

const DENSITY_KEY = "provenai_intel_density";

function getDensity(): DensityMode {
  try {
    const stored = localStorage.getItem(DENSITY_KEY);
    if (stored === "standard" || stored === "compact" || stored === "headlines") return stored;
  } catch { /* */ }
  return "standard";
}

function saveDensity(mode: DensityMode) {
  try { localStorage.setItem(DENSITY_KEY, mode); } catch { /* */ }
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
    ai_news: [], ai_robotics: [], ai_medicine: [], ai_business: [],
  };
  for (const item of items) {
    const cat = item.category as IntelCategory;
    if (cat in map && map[cat].length < 5) map[cat].push(item);
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
  const defaults: IntelConfig = { INTEL_SUMMARY_MODE: "standard", INTEL_ARTICLE_VIEW: "on", INTEL_COMMENTARY: "off" };
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

const CategoryPill = ({ category }: { category: string }) => {
  const pill = CATEGORY_PILL[category] || { bg: "#6B7280", text: "#FFFFFF" };
  return (
    <span
      className="inline-block text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-sm"
      style={{ backgroundColor: pill.bg, color: pill.text }}
    >
      {CATEGORY_DISPLAY[category] || category}
    </span>
  );
};

/* Single headline row — adapts to density + config */
const SignalRow = ({
  item, density, articleView, showCommentary,
}: {
  item: BriefingItemData; density: DensityMode; articleView: boolean; showCommentary: boolean;
}) => {
  const isHL = density === "headlines";
  const isCmp = density === "compact";
  const showSummary = !isHL && item.summary;
  const summaryClamp = isCmp ? "line-clamp-1" : "line-clamp-2";

  const linkTo = articleView ? `/intelligence/${item.id}` : item.url;
  const externalProps = articleView ? {} : { target: "_blank" as const, rel: "noopener noreferrer" as const };

  const inner = (
    <Link
      to={linkTo}
      {...externalProps}
      className={`group block ${isHL ? "py-1" : isCmp ? "py-1.5" : "py-2"} transition-colors hover:bg-[#EBEDF0] -mx-2 px-2 rounded-sm cursor-pointer`}
    >
      <span className={`${isHL ? "text-[13px]" : "text-[14px]"} font-semibold text-[#111827] leading-snug line-clamp-2 group-hover:underline underline-offset-2 block`}>
        {item.title}
      </span>
      {showSummary && (
        <span className={`text-[12px] text-[#6B7280] leading-relaxed mt-0.5 block ${summaryClamp}`}>
          {item.summary}
        </span>
      )}
      {showCommentary && item.commentary && !isHL && (
        <span className="text-[12px] text-[#2563EB]/80 italic leading-relaxed mt-1 block line-clamp-2">
          Why this matters: {item.commentary}
        </span>
      )}
      <span className={`text-[11px] text-[#9CA3AF] block ${isHL ? "mt-0" : "mt-0.5"}`}>
        {item.sourceName}
        {item.publishedAt && <> · {formatRelativeDate(item.publishedAt)}</>}
      </span>
    </Link>
  );

  if (isHL && item.summary) {
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="left" className="max-w-[280px] text-[12px] leading-relaxed">{item.summary}</TooltipContent>
      </Tooltip>
    );
  }
  return inner;
};

/* Category block — collapsible on mobile */
const CategoryBlock = ({
  category, items, density, articleView, showCommentary,
}: {
  category: IntelCategory; items: BriefingItemData[]; density: DensityMode; articleView: boolean; showCommentary: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="py-2.5">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 mb-1.5 w-full text-left md:pointer-events-none"
      >
        <CategoryPill category={category} />
        <span className="md:hidden text-[#9CA3AF]">
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </button>
      {!collapsed && (
        <div className="space-y-0 divide-y divide-[#E5E7EB]">
          {items.map((item) => (
            <SignalRow key={item.id} item={item} density={density} articleView={articleView} showCommentary={showCommentary} />
          ))}
        </div>
      )}
    </div>
  );
};

/* Density toggle */
const DensityToggle = ({ density, onChange }: { density: DensityMode; onChange: (d: DensityMode) => void }) => (
  <div className="flex items-center gap-0.5 bg-[#E5E7EB] rounded p-0.5">
    {([["standard", "Std"], ["compact", "Cmp"], ["headlines", "Hdl"]] as [DensityMode, string][]).map(([v, l]) => (
      <button
        key={v}
        onClick={() => onChange(v)}
        className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
          density === v ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#111827]"
        }`}
      >
        {l}
      </button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   Main export — AIIntelligence
   ═══════════════════════════════════════════════════════════════════════ */

export const AIIntelligence = () => {
  const { items, loading, error, refresh } = useBriefingItems(20);
  const config = useIntelConfig();
  const { isAdmin } = useAuth();
  const [running, setRunning] = useState(false);
  const [density, setDensityState] = useState<DensityMode>(getDensity);

  const handleDensity = (d: DensityMode) => { setDensityState(d); saveDensity(d); };

  const grouped = groupByCategory(items);
  const articleView = config.INTEL_ARTICLE_VIEW === "on";
  const showCommentary = config.INTEL_COMMENTARY === "on";

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
        <RefreshCw className="h-3.5 w-3.5 text-[#9CA3AF] animate-spin mx-auto" />
      </div>
    );
  }

  const hasAny = INTEL_CATEGORIES.some((cat) => grouped[cat].length > 0);

  return (
    <div className="bg-[#F3F4F6] -mx-2 px-3 py-3 rounded min-h-[200px]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[13px] font-bold text-[#111827] uppercase tracking-[0.04em]">
          AI Intelligence
        </h3>
        <div className="flex items-center gap-2">
          <DensityToggle density={density} onChange={handleDensity} />
          {isAdmin && (
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#D1D5DB] transition-colors disabled:opacity-30"
            >
              {running ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Play className="h-2.5 w-2.5" />}
            </button>
          )}
        </div>
      </div>
      <div className="h-px bg-[#D1D5DB] mb-1" />

      {!hasAny && !error && (
        <div className="py-6 text-center">
          <p className="text-[13px] text-[#6B7280]">No intelligence items available.</p>
        </div>
      )}

      {hasAny && (
        <div className="divide-y divide-[#D1D5DB]">
          {INTEL_CATEGORIES.map((cat) => (
            <CategoryBlock
              key={cat}
              category={cat}
              items={grouped[cat]}
              density={density}
              articleView={articleView}
              showCommentary={showCommentary}
            />
          ))}
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
