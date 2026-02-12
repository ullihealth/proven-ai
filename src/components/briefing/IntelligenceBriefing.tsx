import { useState, useEffect } from "react";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";

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

const CATEGORY_COLORS: Record<string, string> = {
  ai_software: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ai_business: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ai_robotics: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ai_medicine: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  ai_regulation: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ai_research: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  other: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

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

  return (
    <section className="pai-section mt-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI Intelligence Briefing</h2>
        </div>
      </div>
      <p className="text-pai-text-secondary mb-6">
        Curated AI developments — no hype, just what matters.
      </p>

      {loading && (
        <div className="p-6 rounded-lg bg-card border border-border text-center">
          <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading briefing…</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-6 rounded-lg bg-card border border-border text-center">
          <p className="text-sm text-muted-foreground">
            Briefing will appear here soon.
          </p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="p-6 rounded-lg bg-card border border-border text-center">
          <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Briefing will appear here soon.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid gap-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${
                        CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
                      }`}
                    >
                      {item.categoryLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.sourceName}
                    </span>
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="mt-1 text-sm text-pai-text-secondary line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
};
