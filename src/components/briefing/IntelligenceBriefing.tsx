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
  ai_business: "border-l-emerald-600/70",
  ai_robotics: "border-l-violet-500/70",
  ai_medicine: "border-l-rose-700/70",
  ai_regulation: "border-l-amber-500/70",
  ai_research: "border-l-cyan-600/70",
  other: "border-l-muted-foreground/30",
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

/* ─── Shared hook — fetches briefing once, shared across components ─── */
let _cache: { items: BriefingItemData[]; ts: number } | null = null;

export function useBriefingItems(limit = 8) {
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
   Briefing Status Bar — compact row above Featured Intelligence
   Max 56px, minimal padding. Shows title, timestamp, cadence, admin run.
   ═══════════════════════════════════════════════════════════════════════ */

export const BriefingStatusBar = () => {
  const { items, loading, refresh } = useBriefingItems(8);
  const { isAdmin } = useAuth();
  const [running, setRunning] = useState(false);

  const lastUpdated = items.length > 0 ? formatRelativeDate(items[0].fetchedAt) : null;

  const handleRun = async () => {
    try {
      setRunning(true);
      const res = await fetch("/api/admin/briefing/run", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Refresh briefing data after successful run
      setTimeout(() => refresh(), 1500);
    } catch {
      // Silently fail — admin can check settings page for details
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex items-center justify-between h-[40px] px-0.5">
      <div className="flex items-center gap-3">
        <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
          AI Intelligence Briefing
        </h2>
        {lastUpdated && (
          <span className="text-[10px] text-muted-foreground/40 tabular-nums">
            Updated {lastUpdated}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/30">·</span>
        <span className="text-[10px] text-muted-foreground/30">Auto-refresh 6h</span>
      </div>

      {isAdmin && (
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-colors duration-150 disabled:opacity-40"
        >
          {running ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          Run Update
        </button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Featured Intelligence — left column (items 0–2)
   ═══════════════════════════════════════════════════════════════════════ */

const FeatureCard = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className={`group block rounded-md bg-card/60 border border-border/40 hover:border-border/60 transition-all duration-150 border-l-[3px] ${CATEGORY_ACCENT[item.category] || CATEGORY_ACCENT.other}`}
  >
    <div className="px-5 py-4">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/50 uppercase">
          {CATEGORY_DISPLAY[item.category] || CATEGORY_DISPLAY.other}
        </span>
        <span className="text-[10px] text-muted-foreground/30">·</span>
        <span className="text-[10px] text-muted-foreground/30">{item.sourceName}</span>
      </div>

      <h3 className="text-[17px] font-semibold text-foreground leading-snug group-hover:underline decoration-primary/30 underline-offset-2 line-clamp-2">
        {item.title}
      </h3>

      {item.summary && (
        <p className="mt-2 text-[13px] text-muted-foreground/70 leading-relaxed line-clamp-2">
          {item.summary}
        </p>
      )}

      <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-muted-foreground/40 group-hover:text-primary/70 transition-colors duration-150">
        <span>Read</span>
        <ArrowRight className="h-3 w-3" />
      </div>
    </div>
  </a>
);

export const FeaturedIntelligence = () => {
  const { items, loading, error } = useBriefingItems(8);

  const featured = items[0] ?? null;

  return (
    <section>
      {loading && (
        <div className="py-6 text-center">
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground/30 animate-spin mx-auto" />
        </div>
      )}

      {!loading && (error || items.length === 0) && (
        <div className="py-4 text-center">
          <p className="text-[11px] text-muted-foreground/40">No briefing items.</p>
        </div>
      )}

      {!loading && !error && featured && (
        <FeatureCard item={featured} />
      )}
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   AI Signals — right column (items 3–7)
   ═══════════════════════════════════════════════════════════════════════ */

const SignalRow = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block py-[9px] cursor-pointer"
  >
    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/40 uppercase block mb-0.5">
      {CATEGORY_DISPLAY[item.category] || CATEGORY_DISPLAY.other}
    </span>
    <span className="text-[13px] font-medium text-foreground leading-snug line-clamp-2 group-hover:underline decoration-primary/30 underline-offset-2">
      {item.title}
    </span>
    <span className="text-[11px] text-muted-foreground/35 block mt-0.5">{item.sourceName}</span>
  </a>
);

export const AISignals = () => {
  const { items, loading } = useBriefingItems(8);
  const signals = items.slice(1, 6);

  if (loading) {
    return (
      <div className="py-6 text-center">
        <RefreshCw className="h-3 w-3 text-muted-foreground/30 animate-spin mx-auto" />
      </div>
    );
  }

  if (signals.length === 0) return null;

  return (
    <div>
      <h3 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-4">
        AI Signals
      </h3>
      <div className="space-y-[18px]">
        {signals.map((item) => (
          <SignalRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Legacy default export — keeps old import working (wraps both)
   ═══════════════════════════════════════════════════════════════════════ */
export const IntelligenceBriefing = FeaturedIntelligence;
