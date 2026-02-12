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
  ai_business: "AI & BUSINESS",
  ai_robotics: "AI & ROBOTICS",
  ai_medicine: "AI & MEDICINE",
  ai_regulation: "AI REGULATION",
  ai_research: "AI RESEARCH",
  other: "SIGNAL",
};

const CATEGORY_ACCENT: Record<string, string> = {
  ai_software: "border-l-[#2262ec]",
  ai_business: "border-l-emerald-500",
  ai_robotics: "border-l-violet-500",
  ai_medicine: "border-l-rose-600",
  ai_regulation: "border-l-amber-500",
  ai_research: "border-l-cyan-500",
  other: "border-l-muted-foreground/50",
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
   Featured Card — large top item
   ═══════════════════════════════════════════════════════════════════════ */

const FeaturedCard = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className={`group block rounded-[14px] bg-card/60 border border-border/50 hover:border-border/70 hover:-translate-y-0.5 transition-all duration-150 ease-out border-l-[4px] shadow-md hover:shadow-lg ${CATEGORY_ACCENT[item.category] || CATEGORY_ACCENT.other}`}
  >
    <div className="p-6">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground/70 uppercase">
          {CATEGORY_DISPLAY[item.category] || CATEGORY_DISPLAY.other}
        </span>
        <span className="text-[9px] text-muted-foreground/40">·</span>
        <span className="text-[10px] font-medium text-muted-foreground/70">{item.sourceName}</span>
      </div>
      <h3 className="text-[20px] font-bold text-foreground leading-snug group-hover:underline decoration-primary/40 underline-offset-2 line-clamp-2">
        {item.title}
      </h3>
      {item.summary && (
        <p className="mt-2.5 text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
          {item.summary}
        </p>
      )}
      <div className="mt-3.5 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/60 group-hover:text-primary transition-colors duration-150">
        <span>Read</span>
        <ArrowRight className="h-3 w-3" />
      </div>
    </div>
  </a>
);

/* ═══════════════════════════════════════════════════════════════════════
   Compact Grid Card — items 1–4
   ═══════════════════════════════════════════════════════════════════════ */

const CompactCard = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className={`group block rounded-lg bg-card/40 border border-border/40 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 ease-out border-l-[3px] h-[106px] ${CATEGORY_ACCENT[item.category] || CATEGORY_ACCENT.other}`}
  >
    <div className="p-3.5 flex flex-col justify-between h-full">
      <div>
        <span className="text-[9px] font-bold tracking-[0.14em] text-muted-foreground/70 uppercase block mb-1">
          {CATEGORY_DISPLAY[item.category] || CATEGORY_DISPLAY.other}
        </span>
        <h4 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:underline decoration-primary/40 underline-offset-2">
          {item.title}
        </h4>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground/70 truncate">{item.sourceName}</span>
    </div>
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
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[18px] font-bold text-foreground tracking-tight uppercase">
          AI Intelligence
        </h2>
        {isAdmin && (
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
          >
            {running ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Play className="h-2.5 w-2.5" />}
            Run
          </button>
        )}
      </div>
      <div className="h-px bg-border/50 mb-5" />

      {loading && (
        <div className="py-10 text-center">
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground/30 animate-spin mx-auto" />
        </div>
      )}

      {!loading && (error || items.length === 0) && (
        <div className="py-6 text-center">
          <p className="text-[11px] text-muted-foreground/35">No briefing items.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="relative">
          {/* Subtle intelligence texture */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-blue-50/[0.04] to-transparent pointer-events-none" />
          <div className="relative space-y-3">
            {featured && <FeaturedCard item={featured} />}
            {grid.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {grid.map((item) => (
                  <CompactCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   AI Signals — right column (items 5–10, no duplication)
   Compressed text blocks, no cards, no shadows
   ═══════════════════════════════════════════════════════════════════════ */

const SignalRow = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block rounded-md px-2.5 py-2 -mx-2.5 hover:bg-muted/15 transition-colors duration-100"
  >
    <span className="text-[9px] font-bold tracking-[0.16em] text-muted-foreground/70 uppercase block mb-0.5">
      {CATEGORY_DISPLAY[item.category] || CATEGORY_DISPLAY.other}
    </span>
    <span className="text-[14px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:underline decoration-primary/40 underline-offset-2">
      {item.title}
    </span>
    <span className="text-[11px] font-medium text-muted-foreground/70 block mt-0.5">{item.sourceName}</span>
  </a>
);

export const AISignals = () => {
  const { items, loading } = useBriefingItems(12);
  const signals = items.slice(5, 11);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="h-3 w-3 text-muted-foreground/30 animate-spin mx-auto" />
      </div>
    );
  }

  if (signals.length === 0) return null;

  return (
    <div>
      <h3 className="text-[12px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em] mb-3">
        AI Signals
      </h3>
      <div className="h-px bg-border/50 mb-4" />
      <div className="space-y-0">
        {signals.map((item, i) => (
          <div key={item.id}>
            <SignalRow item={item} />
            {i < signals.length - 1 && <div className="h-px bg-border/30 mx-2.5" />}
          </div>
        ))}
      </div>
    </div>
  );
};

/* Legacy exports */
export const FeaturedIntelligence = IntelligenceSection;
export const BriefingStatusBar = () => null;
export const IntelligenceBriefing = IntelligenceSection;
