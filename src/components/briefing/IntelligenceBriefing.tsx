import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Play } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
    if (cat in map && map[cat].length < 3) {
      map[cat].push(item);
    }
  }
  return map;
}

/* ═══════════════════════════════════════════════════════════════════════
   AI Intelligence — right column ONLY
   4 categories stacked vertically, max 3 headlines each
   No excerpts. Tight spacing. Thin dividers.
   ═══════════════════════════════════════════════════════════════════════ */

const SignalHeadline = ({ item }: { item: BriefingItemData }) => {
  const inner = (
    <Link
      to={`/intelligence/${item.id}`}
      className="group block py-1.5 transition-colors"
    >
      <span className="text-[14px] font-semibold text-[#111827] leading-snug line-clamp-2 group-hover:text-[#2563EB] group-hover:underline underline-offset-2 block">
        {item.title}
      </span>
      <span className="text-[11px] text-[#6B7280] block mt-0.5">
        {item.sourceName}
        {item.publishedAt && <> · {formatRelativeDate(item.publishedAt)}</>}
      </span>
    </Link>
  );

  if (!item.summary) return inner;

  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        {inner}
      </TooltipTrigger>
      <TooltipContent
        side="left"
        className="max-w-[280px] text-[12px] leading-relaxed"
      >
        {item.summary}
      </TooltipContent>
    </Tooltip>
  );
};

const SignalCategoryBlock = ({ category, items }: { category: CoreCategory; items: BriefingItemData[] }) => {
  if (items.length === 0) return null;

  return (
    <div className="py-3 first:pt-0">
      <div className="mb-2">
        <CategoryChip category={category} size="sm" />
      </div>
      <div className="space-y-0 divide-y divide-[#F3F4F6]">
        {items.map((item) => (
          <SignalHeadline key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export const AIIntelligence = () => {
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

  if (loading) {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="h-3.5 w-3.5 text-[#9CA3AF] animate-spin mx-auto" />
      </div>
    );
  }

  const hasAny = CORE_CATEGORIES.some((cat) => grouped[cat].length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-bold text-[#111827] uppercase tracking-[-0.01em]">
          AI Intelligence
        </h3>
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
      <div className="h-px bg-[#E5E7EB] mb-0" />

      {!hasAny && !error && (
        <div className="py-6 text-center">
          <p className="text-[13px] text-[#6B7280]">No intelligence items available.</p>
        </div>
      )}

      {hasAny && (
        <div className="divide-y divide-[#E5E7EB]">
          {CORE_CATEGORIES.map((cat) => (
            <SignalCategoryBlock key={cat} category={cat} items={grouped[cat]} />
          ))}
        </div>
      )}
    </div>
  );
};

/* Legacy exports — keep for any remaining imports */
export const AISignals = AIIntelligence;
export const IntelligenceSection = () => null;
export const FeaturedIntelligence = () => null;
export const BriefingStatusBar = () => null;
export const IntelligenceBriefing = () => null;
