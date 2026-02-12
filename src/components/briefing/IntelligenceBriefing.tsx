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

export function useBriefingItems(limit = 12) {
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
    : "text-[11px] px-2 py-1 rounded-md";
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

const FeaturedCard = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] transition-colors duration-150 overflow-hidden"
  >
    <div className="flex">
      {/* Category accent bar */}
      <div
        className="w-1 flex-shrink-0 self-stretch"
        style={{ backgroundColor: CATEGORY_BAR[item.category] || CATEGORY_BAR.other }}
      />
      <div className="p-6 flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Featured Insight
          </span>
          <CategoryChip category={item.category} />
        </div>
        <h3 className="text-[24px] font-semibold text-[#111827] leading-[1.25] line-clamp-2 tracking-[-0.015em]">
          {item.title}
        </h3>
        {item.summary && (
          <p className="mt-2 text-[15px] text-[#374151] leading-relaxed line-clamp-3">
            {item.summary}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[13px] text-[#4B5563]">{item.sourceName}</span>
          <span className="text-[13px] font-medium text-[#2563EB] group-hover:underline flex items-center gap-1">
            Read more
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  </a>
);

/* ═══════════════════════════════════════════════════════════════════════
   Signal Card — 2-col grid items (Level 2 depth — flat bordered)
   ═══════════════════════════════════════════════════════════════════════ */

const SignalCard = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block rounded-lg bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] hover:-translate-y-px transition-all duration-[180ms] ease-out p-4"
  >
    <div className="mb-1.5">
      <CategoryChip category={item.category} />
    </div>
    <h4 className="text-[15px] font-semibold text-[#1F2937] leading-snug line-clamp-2 group-hover:underline decoration-[#2563EB]/40 underline-offset-2">
      {item.title}
    </h4>
    <span className="text-[13px] text-[#6B7280] block mt-1.5">{item.sourceName}</span>
  </a>
);

/* ═══════════════════════════════════════════════════════════════════════
   Intelligence Section — full left-column primary block
   Header + Featured + 4-item grid
   Items 0–4 used here ← signals column uses 5–10
   ═══════════════════════════════════════════════════════════════════════ */

export const IntelligenceSection = () => {
  const { items, loading, error, refresh } = useBriefingItems(12);
  const { isAdmin } = useAuth();
  const [running, setRunning] = useState(false);

  const featured = items[0] ?? null;
  const grid = items.slice(1, 5);

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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[20px] font-bold text-[#111827] tracking-[-0.015em] uppercase">
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
      <div className="h-px bg-[#E5E7EB] mb-5" />

      {loading && (
        <div className="py-10 text-center">
          <RefreshCw className="h-4 w-4 text-[#6B7280]/40 animate-spin mx-auto" />
        </div>
      )}

      {!loading && (error || items.length === 0) && (
        <div className="py-6 text-center">
          <p className="text-[13px] text-[#6B7280]">No briefing items available.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-5">
          {/* Level 1 — Featured Insight (editorial) */}
          {featured && <FeaturedCard item={featured} />}

          {/* Level 2 — Signal Grid (flat bordered) */}
          {grid.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grid.map((item) => (
                <SignalCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   AI Signals — right column editorial list (Level 3 — flat, no cards)
   Items 5–10, no duplication with main column
   ═══════════════════════════════════════════════════════════════════════ */

const SignalRow = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block py-2.5 transition-colors duration-100"
  >
    <div className="mb-1">
      <CategoryChip category={item.category} size="sm" />
    </div>
    <span className="text-[15px] font-semibold text-[#1F2937] leading-snug line-clamp-2 group-hover:text-[#2563EB] group-hover:underline underline-offset-2 block">
      {item.title}
    </span>
    <span className="text-[12px] text-[#6B7280] block mt-0.5">{item.sourceName}</span>
  </a>
);

export const AISignals = () => {
  const { items, loading } = useBriefingItems(12);
  const signals = items.slice(5, 11);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="h-3.5 w-3.5 text-[#6B7280]/40 animate-spin mx-auto" />
      </div>
    );
  }

  if (signals.length === 0) return null;

  return (
    <div>
      <h3 className="text-[15px] font-bold text-[#111827] uppercase tracking-[-0.01em] mb-2">
        AI Signals
      </h3>
      <div className="h-px bg-[#E5E7EB] mb-0" />
      <div className="divide-y divide-[#E5E7EB]">
        {signals.map((item) => (
          <SignalRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

/* Legacy exports */
export const FeaturedIntelligence = IntelligenceSection;
export const BriefingStatusBar = () => null;
export const IntelligenceBriefing = IntelligenceSection;
