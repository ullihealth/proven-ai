import { useState, useEffect, useCallback } from "react";
import { ArrowRight, RefreshCw, Play } from "lucide-react";
import { useAuth } from "@/lib/auth";

export interface BriefingItemData {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  category: string;
  categoryLabel: string;
  sourceName: string;
  publishedAt: string | null;
  fetchedAt: string;
}

const CATEGORY_DISPLAY: Record<string, string> = {
  ai_software: "AI SOFTWARE",
  ai_business: "AI BUSINESS",
  ai_robotics: "AI ROBOTICS",
  ai_medicine: "AI MEDICINE",
  ai_regulation: "AI REGULATION",
  ai_research: "AI RESEARCH",
  other: "SIGNAL",
};

/* Category chip colour map — bg + text */
const CATEGORY_CHIP: Record<string, { bg: string; text: string }> = {
  ai_software: { bg: "rgba(37,99,235,0.08)", text: "#2563EB" },
  ai_business: { bg: "rgba(16,185,129,0.08)", text: "#059669" },
  ai_robotics: { bg: "rgba(139,92,246,0.08)", text: "#7C3AED" },
  ai_medicine: { bg: "rgba(239,68,68,0.08)", text: "#DC2626" },
  ai_regulation: { bg: "rgba(245,158,11,0.08)", text: "#D97706" },
  ai_research: { bg: "rgba(79,70,229,0.08)", text: "#4338CA" },
  other: { bg: "rgba(107,114,128,0.08)", text: "#6B7280" },
};

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
  } catch {
    return "";
  }
}

/* ─── Shared hook ─── */
let _cache: { items: BriefingItemData[]; ts: number } | null = null;

export function useBriefingItems(limit = 20) {
  const [items, setItems] = useState<BriefingItemData[]>(_cache?.items || []);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_cache && Date.now() - _cache.ts < 60_000) {
      setItems(_cache.items);
      setLoading(false);
      return;
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
      } finally {
        setLoading(false);
      }
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
        setItems(fetched);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  return { items, loading, error, refresh };
}

/* ═══════════════════════════════════════════════════════════════════════
   Featured Insight — elevated editorial anchor (Level 1 depth)
   ═══════════════════════════════════════════════════════════════════════ */

const CategoryChip = ({ category, size = "default" }: { category: string; size?: "default" | "sm" }) => {
  const chip = CATEGORY_CHIP[category] || CATEGORY_CHIP.other;
  const cls = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 rounded"
    : "text-[11px] px-2 py-0.5 rounded";
  return (
    <span
      className={`inline-block font-semibold uppercase tracking-wide ${cls}`}
      style={{ backgroundColor: chip.bg, color: chip.text }}
    >
      {CATEGORY_DISPLAY[category] || CATEGORY_DISPLAY.other}
    </span>
  );
};

/* Left-edge category accent bar colours */
const CATEGORY_BAR: Record<string, string> = {
  ai_software: "#2563EB",
  ai_business: "#059669",
  ai_robotics: "#7C3AED",
  ai_medicine: "#DC2626",
  ai_regulation: "#D97706",
  ai_research: "#4338CA",
  other: "#9CA3AF",
};

/* ─── 4 core categories ─── */
const CORE_CATEGORIES = ["ai_software", "ai_robotics", "ai_medicine", "ai_business"] as const;
type CoreCategory = (typeof CORE_CATEGORIES)[number];

function groupByCategory(items: BriefingItemData[]) {
  const map: Record<CoreCategory, BriefingItemData[]> = {
    ai_software: [],
    ai_robotics: [],
    ai_medicine: [],
    ai_business: [],
  };
  for (const item of items) {
    const cat = item.category as CoreCategory;
    if (cat in map && map[cat].length < 4) {
      map[cat].push(item);
    }
  }
  return map;
}

/* ═══════════════════════════════════════════════════════════════════════
   Category Card — 1 primary item per category in a 2×2 grid
   ═══════════════════════════════════════════════════════════════════════ */

const CategoryCard = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block rounded-md bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-px transition-all duration-[180ms] ease-out overflow-hidden"
  >
    <div className="flex">
      <div
        className="w-1 flex-shrink-0 self-stretch"
        style={{ backgroundColor: CATEGORY_BAR[item.category] || CATEGORY_BAR.other }}
      />
      <div className="p-4 flex-1 min-w-0">
        <div className="mb-1.5">
          <CategoryChip category={item.category} />
        </div>
        <h4 className="text-[15px] font-semibold text-[#111827] leading-snug line-clamp-2 group-hover:underline decoration-[#2563EB]/40 underline-offset-2 tracking-[-0.01em]">
          {item.title}
        </h4>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[12px] text-[#6B7280]">
            {item.sourceName}
            {item.publishedAt && <> · {formatRelativeDate(item.publishedAt)}</>}
          </span>
        </div>
      </div>
    </div>
  </a>
);

/* ═══════════════════════════════════════════════════════════════════════
   Intelligence Section — 4 categories × 1 primary item each (2×2 grid)
   ═══════════════════════════════════════════════════════════════════════ */

export const IntelligenceSection = () => {
  const { items, loading, error, refresh } = useBriefingItems(20);
  const { isAdmin } = useAuth();
  const [running, setRunning] = useState(false);

  const grouped = groupByCategory(items);

  const handleRun = async () => {
    try {
      setRunning(true);
      const res = await fetch("/api/admin/briefing/run", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTimeout(() => refresh(), 1500);
    } catch {
      // silent
    } finally {
      setRunning(false);
    }
  };

  return (
    <section>
      {/* Divider ABOVE header */}
      <div className="h-px bg-[#E5E7EB] mb-4" />

      {/* Section header — broadcast marker */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[18px] font-bold text-[#111827] tracking-[-0.015em] uppercase">
          AI Intelligence
        </h2>
        {isAdmin && (
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors disabled:opacity-30"
          >
            {running ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Play className="h-2.5 w-2.5" />}
            Run
          </button>
        )}
      </div>

      {/* Divider BELOW header */}
      <div className="h-px bg-[#E5E7EB] mb-4" />

      {loading && (
        <div className="py-8 text-center">
          <RefreshCw className="h-4 w-4 text-[#9CA3AF] animate-spin mx-auto" />
        </div>
      )}

      {!loading && (error || items.length === 0) && (
        <div className="py-6 text-center">
          <p className="text-[13px] text-[#6B7280]">No intelligence items available.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CORE_CATEGORIES.map((cat) => {
            const primary = grouped[cat][0];
            if (!primary) return null;
            return <CategoryCard key={cat} item={primary} />;
          })}
        </div>
      )}
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   AI Signals — right column
   4 categories stacked vertically, max 3 headlines each
   No excerpts. Tight spacing. Thin dividers.
   ═══════════════════════════════════════════════════════════════════════ */

const SignalHeadline = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block py-1.5 transition-colors"
  >
    <span className="text-[14px] font-semibold text-[#111827] leading-snug line-clamp-2 group-hover:text-[#2563EB] group-hover:underline underline-offset-2 block">
      {item.title}
    </span>
    <span className="text-[11px] text-[#6B7280] block mt-0.5">
      {item.sourceName}
      {item.publishedAt && <> · {formatRelativeDate(item.publishedAt)}</>}
    </span>
  </a>
);

const SignalCategoryBlock = ({ category, items }: { category: CoreCategory; items: BriefingItemData[] }) => {
  /* Skip the first item (shown in main column grid), take next 3 */
  const signals = items.slice(1, 4);
  if (signals.length === 0) return null;

  return (
    <div className="py-3 first:pt-0">
      <div className="flex items-center justify-between mb-2">
        <CategoryChip category={category} size="sm" />
        <span className="text-[11px] font-medium text-[#9CA3AF] hover:text-[#2563EB] cursor-pointer transition-colors flex items-center gap-0.5">
          View all <ArrowRight className="h-2.5 w-2.5" />
        </span>
      </div>
      <div className="space-y-0 divide-y divide-[#F3F4F6]">
        {signals.map((item) => (
          <SignalHeadline key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export const AISignals = () => {
  const { items, loading } = useBriefingItems(20);
  const grouped = groupByCategory(items);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="h-3.5 w-3.5 text-[#9CA3AF] animate-spin mx-auto" />
      </div>
    );
  }

  const hasAnySignals = CORE_CATEGORIES.some((cat) => grouped[cat].length > 1);
  if (!hasAnySignals) return null;

  return (
    <div>
      <h3 className="text-[15px] font-bold text-[#111827] uppercase tracking-[-0.01em] mb-2">
        AI Signals
      </h3>
      <div className="h-px bg-[#E5E7EB] mb-0" />
      <div className="divide-y divide-[#E5E7EB]">
        {CORE_CATEGORIES.map((cat) => (
          <SignalCategoryBlock key={cat} category={cat} items={grouped[cat]} />
        ))}
      </div>
    </div>
  );
};

/* Legacy exports */
export const FeaturedIntelligence = IntelligenceSection;
export const BriefingStatusBar = () => null;
export const IntelligenceBriefing = IntelligenceSection;
