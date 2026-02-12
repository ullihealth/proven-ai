import { useState, useEffect } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";

interface BriefingItemData {
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

function formatRelativeDate(iso: string): string {
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

/* ─── Feature Card (item #1) ─── */
const FeatureCard = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex flex-col sm:flex-row">
      {/* Accent stripe */}
      <div className="hidden sm:block w-[3px] rounded-l-xl bg-primary/60 flex-shrink-0" />

      <div className="flex-1 p-5 sm:pl-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground/70">
            {CATEGORY_DISPLAY[item.category] || CATEGORY_DISPLAY.other}
          </span>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="text-[10px] text-muted-foreground/50">{item.sourceName}</span>
        </div>

        <h3 className="text-lg font-semibold text-foreground leading-snug group-hover:underline decoration-primary/40 underline-offset-2 transition-colors line-clamp-2">
          {item.title}
        </h3>

        {item.summary && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {item.summary}
          </p>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60 group-hover:text-primary transition-colors">
          <span>Read</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  </a>
);

/* ─── Supporting Card (items #2–3) ─── */
const SupportingCard = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all p-4"
  >
    <span className="text-[10px] font-semibold tracking-widest text-muted-foreground/70">
      {CATEGORY_DISPLAY[item.category] || CATEGORY_DISPLAY.other}
    </span>

    <h3 className="mt-1.5 text-[15px] font-semibold text-foreground leading-snug group-hover:underline decoration-primary/40 underline-offset-2 transition-colors line-clamp-2">
      {item.title}
    </h3>

    {item.summary && (
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {item.summary}
      </p>
    )}

    <span className="block mt-2 text-[10px] text-muted-foreground/50">
      {item.sourceName}
    </span>
  </a>
);

/* ─── Compact Row (item #4+) ─── */
const CompactRow = ({ item }: { item: BriefingItemData }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/30 transition-colors"
  >
    <span className="text-[10px] font-semibold tracking-widest text-muted-foreground/60 w-24 flex-shrink-0">
      {CATEGORY_DISPLAY[item.category] || CATEGORY_DISPLAY.other}
    </span>
    <span className="text-sm text-foreground truncate flex-1 group-hover:underline decoration-primary/40 underline-offset-2">
      {item.title}
    </span>
    <ArrowRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
  </a>
);

/* ─── Main Component ─── */
export const IntelligenceBriefing = () => {
  const [items, setItems] = useState<BriefingItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch("/api/briefing?limit=4");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load briefing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const featured = items[0] ?? null;
  const supporting = items.slice(1, 3);
  const compact = items.slice(3);

  const lastUpdated = items.length > 0
    ? formatRelativeDate(items[0].fetchedAt)
    : null;

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-semibold text-foreground">
          AI Intelligence Briefing
        </h2>
        {lastUpdated && (
          <span className="text-[11px] text-muted-foreground/50">
            Updated {lastUpdated}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Curated developments across AI software, business, robotics and research.
      </p>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center">
          <RefreshCw className="h-4 w-4 text-muted-foreground/40 animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground/50">Loading briefing…</p>
        </div>
      )}

      {/* Error / Empty */}
      {!loading && (error || items.length === 0) && (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground/50 italic">
            Briefing will appear here soon.
          </p>
        </div>
      )}

      {/* Briefing content — 3-tier hierarchy */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {/* Tier 1: Primary Signal */}
          {featured && <FeatureCard item={featured} />}

          {/* Tier 2: Supporting Signals */}
          {supporting.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {supporting.map((item) => (
                <SupportingCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Tier 3: More Signals */}
          {compact.length > 0 && (
            <div className="border-t border-border/40 pt-2">
              {compact.map((item) => (
                <CompactRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
